const School = require('../models/School');
const Enquiry = require('../models/Enquiry');
const Assessment = require('../models/Assessment');
const generateToken = require('../utils/generateToken');

// @desc    Get all schools
// @route   GET /api/v1/super-admin/schools
// @access  Private (Super Admin)
const getAllSchools = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;

    let queryFilter = { role: 'school-admin' };

    // Search filter
    if (search) {
      queryFilter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) {
      queryFilter['subscription.status'] = status;
    }

    const skip = (page - 1) * limit;
    const schools = await School.find(queryFilter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await School.countDocuments(queryFilter);

    res.status(200).json({
      success: true,
      data: schools,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single school with complete statistics
// @route   GET /api/v1/super-admin/schools/:id
// @access  Private (Super Admin)
const getSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Get real statistics from DB
    const totalEnquiries = await Enquiry.countDocuments({ school: req.params.id });
    const totalAssessments = await Assessment.countDocuments({ school: req.params.id });
    const totalAdmissions = await Enquiry.countDocuments({ 
      school: req.params.id, 
      status: 'admitted' 
    });

    // Estimate school plan value in INR
    const planPricing = {
      'pro': 1999,
      'enterprise': 4999,
      'starter': 999,
      'free-trial': 0
    };
    const currentMonthlyRate = planPricing[school.subscription?.plan] || 0;

    res.status(200).json({
      success: true,
      data: {
        ...school._doc,
        statistics: {
          totalEnquiries,
          totalAssessments,
          totalAdmissions,
          revenue: currentMonthlyRate,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get real Super Admin platform dashboard analytics
// @route   GET /api/v1/super-admin/analytics
// @access  Private (Super Admin)
const getDashboardAnalytics = async (req, res) => {
  try {
    const allSchools = await School.find({ role: 'school-admin' }).sort({ createdAt: -1 });

    const totalSchools = allSchools.length;
    const activeSchools = allSchools.filter(s => s.subscription?.status === 'active').length;
    const trialSchools = allSchools.filter(s => s.subscription?.plan === 'free-trial').length;
    const suspendedSchools = allSchools.filter(s => s.subscription?.status === 'suspended').length;
    const expiredSchools = allSchools.filter(s => s.subscription?.status === 'expired' || s.subscription?.status === 'suspended').length;

    // Plan pricing in INR (₹)
    const planPricing = {
      'pro': 1999,
      'enterprise': 4999,
      'starter': 999,
      'free-trial': 0
    };

    let monthlyRevenue = 0;
    allSchools.forEach(s => {
      if (s.subscription?.status === 'active') {
        monthlyRevenue += (planPricing[s.subscription?.plan] || 1999);
      }
    });

    const totalRevenue = monthlyRevenue * 12;

    const recentRegistrations = allSchools.slice(0, 5).map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      plan: s.subscription?.plan || 'free-trial',
      status: s.subscription?.status || 'active',
      createdAt: s.createdAt,
    }));

    // Real enquiry activity counts
    const totalEnquiriesCount = await Enquiry.countDocuments();
    const totalAdmissionsCount = await Enquiry.countDocuments({ status: 'admitted' });

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        activeSchools,
        trialSchools,
        suspendedSchools,
        expiredSchools,
        monthlyRevenue,
        totalRevenue,
        activeSubscriptions: activeSchools,
        expiringTrials: trialSchools,
        recentRegistrations,
        platformActivity: {
          totalEnquiries: totalEnquiriesCount,
          totalAdmissions: totalAdmissionsCount,
        }
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Impersonate school (Support Mode)
// @route   POST /api/v1/super-admin/impersonate/:id
// @access  Private (Super Admin)
const impersonateSchool = async (req, res) => {
  try {
    const school = await School.findById(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    // Security check: Only super-admin role can impersonate
    if (req.superAdmin.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. Super Admin access required.',
      });
    }

    // Audit log
    console.log(`[AUDIT] Super Admin (${req.superAdmin.id}) initiated Support Mode for School: "${school.name}" (${school._id}) at ${new Date().toISOString()}`);

    // Generate temporary JWT token for school admin
    const token = generateToken(school._id, 'school-admin');

    res.status(200).json({
      success: true,
      token,
      school: {
        id: school._id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        role: school.role,
        qrCodeUrl: school.qrCodeUrl,
        admissionFormLink: school.admissionFormLink,
        subscription: school.subscription,
        logo: school.logo,
        thankYouCms: school.thankYouCms,
        settings: school.settings,
        communicationTemplates: school.communicationTemplates,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Activate school
// @route   PUT /api/v1/super-admin/schools/:id/activate
// @access  Private (Super Admin)
const activateSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { 'subscription.status': 'active' },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Suspend school
// @route   PUT /api/v1/super-admin/schools/:id/suspend
// @access  Private (Super Admin)
const suspendSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(
      req.params.id,
      { 'subscription.status': 'suspended' },
      { new: true, runValidators: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    res.status(200).json({
      success: true,
      data: school,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete school
// @route   DELETE /api/v1/super-admin/schools/:id
// @access  Private (Super Admin)
const deleteSchool = async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);

    if (!school) {
      return res.status(404).json({
        success: false,
        message: 'School not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'School deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getAllSchools,
  getSchool,
  getDashboardAnalytics,
  impersonateSchool,
  activateSchool,
  suspendSchool,
  deleteSchool,
};
