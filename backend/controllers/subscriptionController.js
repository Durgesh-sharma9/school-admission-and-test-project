const School = require('../models/School');
const Plan = require('../models/Plan');
const generateToken = require('../utils/generateToken');

// @desc    Get current subscription details
// @route   GET /api/v1/subscription/current
// @access  School Admin
exports.getCurrentSubscription = async (req, res) => {
  try {
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Get plan details if subscribed to a plan
    let planDetails = null;
    if (school.subscription?.plan && school.subscription.plan !== 'free-trial') {
      planDetails = await Plan.findOne({ name: school.subscription.plan });
      // If plan not found by name (backward compatibility), try to find by _id
      if (!planDetails) {
        try {
          planDetails = await Plan.findById(school.subscription.plan);
        } catch (e) {
          // Invalid ID, continue with null planDetails
        }
      }
    }

    // Ensure subscription has all required fields for backward compatibility
    const subscription = {
      plan: school.subscription?.plan || 'free-trial',
      status: school.subscription?.status || 'active',
      billingCycle: school.subscription?.billingCycle || 'monthly',
      price: school.subscription?.price || 0,
      renewalDate: school.subscription?.renewalDate || school.subscription?.trialEnd,
      trialStart: school.subscription?.trialStart,
      trialEnd: school.subscription?.trialEnd,
      changedAt: school.subscription?.changedAt,
      cancelledAt: school.subscription?.cancelledAt,
    };

    // Calculate usage statistics
    const usage = {
      students: {
        used: school.studentsCount || 0,
        limit: planDetails?.capacity?.maxStudents || 100,
      },
      teachers: {
        used: school.teachersCount || 0,
        limit: planDetails?.capacity?.maxTeachers || 10,
      },
      storage: {
        used: school.storageUsed || 0,
        limit: planDetails?.capacity?.maxStorage || 5,
      },
      emails: {
        used: school.emailsSent || 0,
        limit: planDetails?.notifications?.emailLimit || 5000,
      },
      whatsapp: {
        used: school.whatsappSent || 0,
        limit: planDetails?.notifications?.whatsappLimit || 1000,
      },
      aiCredits: {
        used: school.aiCreditsUsed || 0,
        limit: planDetails?.notifications?.aiCredits || 100,
      },
    };

    res.json({
      success: true,
      subscription,
      plan: planDetails,
      usage,
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
};

// @desc    Upgrade/Downgrade subscription
// @route   POST /api/v1/subscription/change-plan
// @access  School Admin
exports.changePlan = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body;
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const newPlan = await Plan.findById(planId);
    if (!newPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (newPlan.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Plan is not available' });
    }

    // Get current plan for comparison
    let currentPlan = null;
    if (school.subscription?.plan && school.subscription.plan !== 'free-trial') {
      currentPlan = await Plan.findOne({ name: school.subscription.plan });
      if (!currentPlan) {
        try {
          currentPlan = await Plan.findById(school.subscription.plan);
        } catch (e) {
          // Invalid ID, currentPlan remains null
        }
      }
    }

    // Check if downgrading and if current usage exceeds new plan limits
    if (currentPlan && newPlan.monthlyPrice < currentPlan.monthlyPrice) {
      // Downgrade - check usage limits
      if ((school.studentsCount || 0) > newPlan.capacity.maxStudents) {
        return res.status(400).json({ 
          success: false, 
          message: `Cannot downgrade. Current students (${school.studentsCount}) exceed new plan limit (${newPlan.capacity.maxStudents})` 
        });
      }
    }

    // Update subscription with new fields
    const price = billingCycle === 'yearly' ? newPlan.yearlyPrice : newPlan.monthlyPrice;
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    school.subscription = {
      plan: newPlan.name,
      status: 'active',
      billingCycle,
      price,
      renewalDate,
      trialStart: school.subscription?.trialStart,
      trialEnd: school.subscription?.trialEnd,
      changedAt: new Date(),
      cancelledAt: null,
    };

    await school.save();

    res.json({
      success: true,
      message: `Successfully ${newPlan.monthlyPrice > (currentPlan?.monthlyPrice || 0) ? 'upgraded' : 'downgraded'} to ${newPlan.name}`,
      subscription: school.subscription,
      plan: newPlan,
    });
  } catch (error) {
    console.error('Change plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to change plan' });
  }
};

// @desc    Renew subscription
// @route   POST /api/v1/subscription/renew
// @access  School Admin
exports.renewSubscription = async (req, res) => {
  try {
    const { billingCycle } = req.body;
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const currentPlan = await Plan.findOne({ name: school.subscription.plan });
    if (!currentPlan) {
      return res.status(404).json({ success: false, message: 'Current plan not found' });
    }

    // Calculate new renewal	date
    const renewalDate = new Date();
    renewalDate.setMonth(renewalDate.getMonth() + (billingCycle === 'yearly' ? 12 : 1));

    const price = billingCycle === 'yearly' ? currentPlan.yearlyPrice : currentPlan.monthlyPrice;

    school.subscription = {
      ...school.subscription,
      billingCycle,
      price,
      renewalDate,
      status: 'active',
    };

    await school.save();

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      subscription: school.subscription,
      plan: currentPlan,
    });
  } catch (error) {
    console.error('Renew subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to renew subscription' });
  }
};

// @desc    Cancel subscription
// @route   POST /api/v1/subscription/cancel
// @access  School Admin
exports.cancelSubscription = async (req, res) => {
  try {
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    if (school.subscription.plan === 'free-trial') {
      return res.status(400).json({ success: false, message: 'Cannot cancel free trial' });
    }

    // Set subscription to expire at renewal date
    school.subscription.status = 'cancelled';
    school.subscription.cancelledAt = new Date();

    await school.save();

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: school.subscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
};

// @desc    Get subscription history
// @route   GET /api/v1/subscription/history
// @access  School Admin
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const school = await School.findById(req.school._id);
    
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // For now, return current subscription info
    // In a full implementation, this would query a SubscriptionHistory collection
    res.json({
      success: true,
      history: [
        {
          plan: school.subscription.plan,
          status: school.subscription.status,
          billingCycle: school.subscription.billingCycle,
          price: school.subscription.price,
          startDate: school.subscription.trialStart || school.createdAt,
          renewalDate: school.subscription.renewalDate,
          changedAt: school.subscription.changedAt,
        },
      ],
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription history' });
  }
};

// @desc    Get available plans for comparison
// @route   GET /api/v1/subscription/plans
// @access  School Admin
exports.getAvailablePlans = async (req, res) => {
  try {
    const { billingCycle } = req.query;
    
    const plans = await Plan.find({ status: 'active' }).sort({ sortOrder: 1, monthlyPrice: 1 });

    res.json({
      success: true,
      plans,
      billingCycle: billingCycle || 'monthly',
    });
  } catch (error) {
    console.error('Get available plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};
