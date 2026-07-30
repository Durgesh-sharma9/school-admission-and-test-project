const SubscriptionPlan = require('../models/SubscriptionPlan');

// Seeding helper to ensure standard plans are present in DB
const seedDefaultPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    if (count === 0) {
      const defaultPlans = [
        {
          organizationType: 'school',
          planCode: 'school-basic',
          planName: 'School Basic',
          price: 1999,
          billingCycle: 'yearly',
          assessmentEnabled: false,
          features: [
            'Admission CRM',
            'Enquiries',
            "Today's Tasks",
            'QR Poster',
            'Enquiry Banner',
            'Reports',
            'Settings',
            'Analytics'
          ],
          status: 'active'
        },
        {
          organizationType: 'school',
          planCode: 'school-premium',
          planName: 'School Premium',
          price: 2999,
          billingCycle: 'yearly',
          assessmentEnabled: true,
          features: [
            'Admission CRM',
            'Enquiries',
            "Today's Tasks",
            'QR Poster',
            'Enquiry Banner',
            'Reports',
            'Settings',
            'Analytics',
            'Assessment Module',
            'Question Bank',
            'Tests',
            'Result Analytics',
            'Student Performance',
            'Assessment Dashboard'
          ],
          status: 'active'
        },
        {
          organizationType: 'college',
          planCode: 'college-premium',
          planName: 'College Premium',
          price: 1999,
          billingCycle: 'yearly',
          assessmentEnabled: true,
          features: [
            'Full College CRM',
            'Applications',
            "Today's Tasks",
            'Admission Workflow',
            'QR',
            'Banner',
            'Reports',
            'Full Analytics',
            'All Modules'
          ],
          status: 'active'
        }
      ];

      await SubscriptionPlan.insertMany(defaultPlans);
      console.log('Seeded default subscription plans successfully.');
    }
  } catch (err) {
    console.error('Auto seeding subscription plans failed:', err);
  }
};

// Auto run seeding on import
seedDefaultPlans();

// @desc    Get all plans (Super Admin or Public)
// @route   GET /api/v1/plans
// @access  Super Admin / Public
exports.getAllPlans = async (req, res) => {
  try {
    // Seed in case DB is completely clean
    await seedDefaultPlans();

    const { organizationType, status } = req.query;
    const filter = {};
    if (organizationType) filter.organizationType = organizationType;
    if (status) filter.status = status;

    const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription plans' });
  }
};

// @desc    Get single plan by ID
// @route   GET /api/v1/plans/:id
// @access  Super Admin only
exports.getPlanById = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({
      success: true,
      plan
    });
  } catch (error) {
    console.error('Get plan by ID error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch plan details' });
  }
};

// @desc    Create plan
// @route   POST /api/v1/plans
// @access  Super Admin only
exports.createPlan = async (req, res) => {
  try {
    const { organizationType, planCode, planName, price, billingCycle, assessmentEnabled, features, status } = req.body;
    
    // Check if code exists
    const existing = await SubscriptionPlan.findOne({ planCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Plan code ${planCode} already exists.` });
    }

    const plan = new SubscriptionPlan({
      organizationType,
      planCode,
      planName,
      price,
      billingCycle: billingCycle || 'yearly',
      assessmentEnabled: !!assessmentEnabled,
      features: features || [],
      status: status || 'active'
    });

    await plan.save();
    res.json({
      success: true,
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
    const { planName, price, status, features, assessmentEnabled } = req.body;
    const plan = await SubscriptionPlan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    if (planName !== undefined) plan.planName = planName;
    if (price !== undefined) plan.price = price;
    if (status !== undefined) plan.status = status;
    if (features !== undefined) plan.features = features;
    if (assessmentEnabled !== undefined) plan.assessmentEnabled = assessmentEnabled;

    await plan.save();
    res.json({
      success: true,
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
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.json({
      success: true,
      message: 'Plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete plan' });
  }
};

// @desc    Archive plan (legacy route dummy)
// @route   PATCH /api/v1/plans/:id/archive
// @access  Super Admin only
exports.archivePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    plan.status = plan.status === 'active' ? 'inactive' : 'active';
    await plan.save();
    res.json({ success: true, plan });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed' });
  }
};

// @desc    Duplicate plan (legacy route dummy)
// @route   POST /api/v1/plans/:id/duplicate
// @access  Super Admin only
exports.duplicatePlan = async (req, res) => {
  res.json({ success: true, message: 'Not supported on new billing schema' });
};

// @desc    Public available plans
// @route   GET /api/v1/plans/public
// @access  Public
exports.getPublicPlans = async (req, res) => {
  try {
    await seedDefaultPlans();
    const { organizationType } = req.query;
    const filter = { status: 'active' };
    if (organizationType) {
      filter.organizationType = organizationType;
    }
    const plans = await SubscriptionPlan.find(filter).sort({ price: 1 });
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch public plans' });
  }
};

// @desc    Reorder plans (legacy route dummy)
// @route   PATCH /api/v1/plans/reorder
// @access  Super Admin only
exports.reorderPlans = async (req, res) => {
  res.json({ success: true });
};
