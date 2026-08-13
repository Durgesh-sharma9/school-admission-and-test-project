const School = require('../models/School');
const Enquiry = require('../models/Enquiry');
const Assessment = require('../models/Assessment');
const Payment = require('../models/Payment');
const SubscriptionRequest = require('../models/SubscriptionRequest');
const CollegeApplication = require('../models/CollegeApplication');
const ParentProfile = require('../models/ParentProfile');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const generateToken = require('../utils/generateToken');

// @desc    Get all schools
// @route   GET /api/v1/super-admin/schools
// @access  Private (Super Admin)
const getAllSchools = async (req, res) => {
  try {
    const { search, status, institutionType, page = 1, limit = 10 } = req.query;

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

    // Institution Type filter
    if (institutionType) {
      queryFilter.institutionType = institutionType;
    } else {
      queryFilter.institutionType = { $ne: 'college' };
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
    await syncSubscriptionPayments();
    const allSchools = await School.find({ role: 'school-admin' }).sort({ createdAt: -1 });

    const schools = allSchools.filter(s => s.institutionType === 'school' || !s.institutionType);
    const colleges = allSchools.filter(s => s.institutionType === 'college');

    const totalSchools = schools.length;
    const activeSchools = schools.filter(s => s.subscription?.status === 'active').length;
    const trialSchools = schools.filter(s => s.subscription?.plan === 'free-trial').length;
    const expiredSchools = schools.filter(s => s.subscription?.status === 'expired' || s.subscription?.status === 'suspended').length;

    const totalColleges = colleges.length;
    const activeColleges = colleges.filter(s => s.subscription?.status === 'active').length;
    const trialColleges = colleges.filter(s => s.subscription?.plan === 'free-trial').length;
    const expiredColleges = colleges.filter(s => s.subscription?.status === 'expired' || s.subscription?.status === 'suspended').length;

    // Real payments count and amount populated by school to separate school and college revenues
    const completedPayments = await Payment.find({ status: 'completed' }).populate('school');
    const completedPaymentsCount = completedPayments.length;

    const schoolPayments = completedPayments.filter(p => p.school && (p.school.institutionType === 'school' || !p.school.institutionType));
    const collegePayments = completedPayments.filter(p => p.school && p.school.institutionType === 'college');

    const schoolTotalRevenue = schoolPayments.reduce((sum, p) => sum + p.amount, 0);
    const collegeTotalRevenue = collegePayments.reduce((sum, p) => sum + p.amount, 0);

    // Pending subscription requests count
    const pendingSubscriptionRequests = await SubscriptionRequest.countDocuments({ status: 'pending' });

    // Monthly revenue (completed payments in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const schoolMonthlyRevenue = schoolPayments
      .filter(p => p.paidAt ? (p.paidAt >= thirtyDaysAgo) : (p.createdAt >= thirtyDaysAgo))
      .reduce((sum, p) => sum + p.amount, 0);

    const collegeMonthlyRevenue = collegePayments
      .filter(p => p.paidAt ? (p.paidAt >= thirtyDaysAgo) : (p.createdAt >= thirtyDaysAgo))
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalRevenue = schoolTotalRevenue + collegeTotalRevenue;
    const monthlyRevenue = schoolMonthlyRevenue + collegeMonthlyRevenue;

    const recentRegistrations = allSchools.slice(0, 5).map(s => ({
      id: s._id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      plan: s.subscription?.plan || 'free-trial',
      status: s.subscription?.status || 'active',
      institutionType: s.institutionType || 'school',
      createdAt: s.createdAt,
    }));

    // Real school enquiry activity counts
    const totalEnquiriesCount = await Enquiry.countDocuments();
    const totalAdmissionsCount = await Enquiry.countDocuments({ status: 'admitted' });

    // Real college applications activity counts
    const totalCollegeApplicationsCount = await CollegeApplication.countDocuments();
    const confirmedCollegeAdmissionsCount = await CollegeApplication.countDocuments({ stage: 'Admission Confirmed' });

    // Platform parent accounts count
    const totalParentsCount = await ParentProfile.countDocuments();
    const totalStudentsCount = totalEnquiriesCount + totalCollegeApplicationsCount;

    // Calculate 6 months trend of registrations and revenue (no simulated fallbacks)
    const monthlyTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const schoolRegs = schools.filter(s => s.createdAt >= startOfMonth && s.createdAt <= endOfMonth).length;
      const collegeRegs = colleges.filter(s => s.createdAt >= startOfMonth && s.createdAt <= endOfMonth).length;

      // Payments in this month
      const monthSchoolPayments = schoolPayments.filter(p => p.paidAt ? (p.paidAt >= startOfMonth && p.paidAt <= endOfMonth) : (p.createdAt >= startOfMonth && p.createdAt <= endOfMonth));
      const monthCollegePayments = collegePayments.filter(p => p.paidAt ? (p.paidAt >= startOfMonth && p.paidAt <= endOfMonth) : (p.createdAt >= startOfMonth && p.createdAt <= endOfMonth));
      
      const monthSchoolRevenue = monthSchoolPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthCollegeRevenue = monthCollegePayments.reduce((sum, p) => sum + p.amount, 0);

      monthlyTrend.push({
        month: monthLabel,
        schools: schoolRegs,
        colleges: collegeRegs,
        schoolRevenue: monthSchoolRevenue,
        collegeRevenue: monthCollegeRevenue,
        revenue: monthSchoolRevenue + monthCollegeRevenue
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalSchools,
        activeSchools,
        trialSchools,
        expiredSchools,
        totalColleges,
        activeColleges,
        trialColleges,
        expiredColleges,
        completedPaymentsCount,
        pendingSubscriptionRequests,
        monthlyRevenue,
        totalRevenue,
        schoolMonthlyRevenue,
        collegeMonthlyRevenue,
        schoolTotalRevenue,
        collegeTotalRevenue,
        activeSubscriptions: activeSchools + activeColleges,
        expiringTrials: trialSchools + trialColleges,
        recentRegistrations,
        monthlyTrend,
        platformActivity: {
          totalEnquiries: totalEnquiriesCount,
          totalAdmissions: totalAdmissionsCount,
          totalCollegeApplications: totalCollegeApplicationsCount,
          confirmedCollegeAdmissions: confirmedCollegeAdmissionsCount,
          totalParents: totalParentsCount,
          totalStudents: totalStudentsCount
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
        institutionType: school.institutionType || 'school',
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

const syncSubscriptionPayments = async () => {
  try {
    const approvedRequests = await SubscriptionRequest.find({ status: 'approved' });
    for (const req of approvedRequests) {
      const plan = await SubscriptionPlan.findOne({ planCode: req.planCode });
      const existingPayment = await Payment.findOne({
        school: req.organizationId,
        amount: req.price,
        status: 'completed'
      });
      if (!existingPayment) {
        await Payment.create({
          school: req.organizationId,
          plan: plan ? plan._id : req.organizationId,
          amount: req.price || 0,
          currency: 'INR',
          status: 'completed',
          paymentMethod: 'bank_transfer',
          transactionId: `TXN-SUB-SYNC-${req._id}`,
          billingCycle: 'yearly',
          paidAt: req.approvedAt || req.updatedAt || new Date(),
          nextBillingDate: new Date((req.approvedAt || req.updatedAt || new Date()).getTime() + 365 * 24 * 60 * 60 * 1000)
        });
      }
    }
  } catch (err) {
    console.error('Subscription sync payments failed:', err);
  }
};

const getAllPayments = async (req, res) => {
  try {
    await syncSubscriptionPayments();
    const payments = await Payment.find()
      .populate('school')
      .populate({ path: 'plan', model: 'SubscriptionPlan' })
      .sort({ createdAt: -1 });

    const today = new Date();
    today.setHours(0,0,0,0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const completedPayments = payments.filter(p => p.status === 'completed');

    const todayRevenue = completedPayments
      .filter(p => p.paidAt ? (p.paidAt >= today) : (p.createdAt >= today))
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyRevenue = completedPayments
      .filter(p => p.paidAt ? (p.paidAt >= startOfMonth) : (p.createdAt >= startOfMonth))
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

    res.status(200).json({
      success: true,
      stats: {
        todayRevenue,
        monthlyRevenue,
        pendingPayments: pendingPaymentsCount,
      },
      data: payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
  getAllPayments,
};
