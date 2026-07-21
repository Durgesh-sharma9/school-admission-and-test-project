const Plan = require('../models/Plan');
const School = require('../models/School');

// @desc    Get all plans with statistics
// @route   GET /api/v1/plans
// @access  Super Admin only
exports.getAllPlans = async (req, res) => {
  try {
    const { status, planType, search } = req.query;
    
    // Build query
    const query = {};
    if (status) query.status = status;
    if (planType) query.planType = planType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const plans = await Plan.find(query).sort({ sortOrder: 1, createdAt: -1 });
    
    // Calculate statistics
    const stats = {
      totalPlans: plans.length,
      activePlans: plans.filter(p => p.status === 'active').length,
      draftPlans: plans.filter(p => p.status === 'draft').length,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
    };

    // Get school subscription data
    const schools = await School.find({});
    const activeSchools = schools.filter(s => s.subscription?.status === 'active').length;
    const trialSchools = schools.filter(s => s.subscription?.plan === 'free-trial').length;
    
    // Calculate revenue from active subscriptions
    schools.forEach(school => {
      if (school.subscription?.status === 'active' && school.subscription?.plan !== 'free-trial') {
        const plan = plans.find(p => p.name === school.subscription.plan);
        if (plan) {
          stats.monthlyRevenue += plan.monthlyPrice || 0;
          stats.yearlyRevenue += plan.yearlyPrice || 0;
        }
      }
    });

    res.json({
      success: true,
      plans,
      stats: {
        ...stats,
        activeSchools,
        trialSchools,
        totalSchools: schools.length,
      }
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

// @desc    Get single plan by ID
// @route   GET /api/v1/plans/:id
// @access  Super Admin only
exports.getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Get schools using this plan
    const schoolsUsingPlan = await School.find({ 'subscription.plan': plan.name });
    
    res.json({
      success: true,
      plan,
      schoolsCount: schoolsUsingPlan.length,
      schools: schoolsUsingPlan.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        subscriptionStatus: s.subscription?.status,
      }))
    });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plan' });
  }
};

// @desc    Create new plan
// @route   POST /api/v1/plans
// @access  Super Admin only
exports.createPlan = async (req, res) => {
  try {
    const planData = req.body;
    
    // Check if plan with same name exists
    const existingPlan = await Plan.findOne({ name: planData.name });
    if (existingPlan) {
      return res.status(400).json({ success: false, message: 'Plan with this name already exists' });
    }

    const plan = new Plan(planData);
    await plan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      plan
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to create plan' });
  }
};

// @desc    Update plan
// @route   PUT /api/v1/plans/:id
// @access  Super Admin only
exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if name is being changed and if new name already exists
    if (req.body.name && req.body.name !== plan.name) {
      const existingPlan = await Plan.findOne({ name: req.body.name });
      if (existingPlan) {
        return res.status(400).json({ success: false, message: 'Plan with this name already exists' });
      }
    }

    Object.assign(plan, req.body);
    await plan.save();

    res.json({
      success: true,
      message: 'Plan updated successfully',
      plan
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to update plan' });
  }
};

// @desc    Delete plan
// @route   DELETE /api/v1/plans/:id
// @access  Super Admin only
exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Check if any schools are using this plan
    const schoolsUsingPlan = await School.find({ 'subscription.plan': plan.name });
    if (schoolsUsingPlan.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete plan. ${schoolsUsingPlan.length} school(s) are currently using this plan.` 
      });
    }

    await Plan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete plan' });
  }
};

// @desc    Archive plan (soft delete)
// @route   PATCH /api/v1/plans/:id/archive
// @access  Super Admin only
exports.archivePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    plan.status = 'archived';
    await plan.save();

    res.json({
      success: true,
      message: 'Plan archived successfully',
      plan
    });
  } catch (error) {
    console.error('Archive plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to archive plan' });
  }
};

// @desc    Duplicate plan
// @route   POST /api/v1/plans/:id/duplicate
// @access  Super Admin only
exports.duplicatePlan = async (req, res) => {
  try {
    const originalPlan = await Plan.findById(req.params.id);
    
    if (!originalPlan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    // Create a copy with modified name
    const planData = originalPlan.toObject();
    delete planData._id;
    delete planData.createdAt;
    delete planData.updatedAt;
    
    planData.name = `${originalPlan.name} (Copy)`;
    planData.status = 'draft';
    planData.isPopular = false;

    const newPlan = new Plan(planData);
    await newPlan.save();

    res.status(201).json({
      success: true,
      message: 'Plan duplicated successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Duplicate plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate plan' });
  }
};

// @desc    Get active plans for school admin (public view)
// @route   GET /api/v1/plans/public
// @access  Public (for school admin to view available plans)
exports.getPublicPlans = async (req, res) => {
  try {
    const { billingCycle } = req.query; // monthly, yearly, lifetime
    
    const plans = await Plan.find({ 
      status: 'active',
      isEnterpriseOnly: false 
    }).sort({ sortOrder: 1 });

    res.json({
      success: true,
      plans,
      billingCycle: billingCycle || 'monthly'
    });
  } catch (error) {
    console.error('Get public plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
};

// @desc    Reorder plans
// @route   PATCH /api/v1/plans/reorder
// @access  Super Admin only
exports.reorderPlans = async (req, res) => {
  try {
    const { planIds } = req.body;
    
    if (!Array.isArray(planIds)) {
      return res.status(400).json({ success: false, message: 'planIds must be an array' });
    }

    // Update sort order for each plan
    const updatePromises = planIds.map((planId, index) => 
      Plan.findByIdAndUpdate(planId, { sortOrder: index })
    );
    
    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Plans reordered successfully'
    });
  } catch (error) {
    console.error('Reorder plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder plans' });
  }
};
