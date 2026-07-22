const CollegeApplication = require('../models/CollegeApplication');
const CollegeCourse = require('../models/CollegeCourse');
const CollegeDepartment = require('../models/CollegeDepartment');

// @desc    Get College CRM Dashboard analytics
// @route   GET /api/v1/college/dashboard/analytics
// @access  Private (College Admin)
const getDashboardAnalytics = async (req, res) => {
  try {
    const collegeId = req.school.id;

    // Basic Metrics
    const totalApplications = await CollegeApplication.countDocuments({ schoolId: collegeId });
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayApplications = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      createdAt: { $gte: todayStart }
    });

    const pendingVerification = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      stage: 'Documents Pending'
    });

    const counsellingScheduled = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      stage: 'Counselling Scheduled'
    });

    const counsellingCompleted = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      stage: 'Counselling Completed'
    });

    const feePending = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      $or: [
        { stage: 'Fee Pending' },
        { paymentStatus: 'Pending' }
      ]
    });

    const confirmedAdmissions = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      stage: 'Admission Confirmed'
    });

    const scholarshipRequests = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      $or: [
        { scholarshipApplied: true },
        { scholarshipAmount: { $gt: 0 } }
      ]
    });

    const hostelRequests = await CollegeApplication.countDocuments({
      schoolId: collegeId,
      hostelRequired: true
    });

    // Course distribution
    const courses = await CollegeCourse.find({ schoolId: collegeId });
    const courseDistribution = [];
    for (const course of courses) {
      const count = await CollegeApplication.countDocuments({ schoolId: collegeId, courseId: course._id });
      courseDistribution.push({
        name: course.name,
        code: course.code,
        count
      });
    }

    // Department distribution
    const departments = await CollegeDepartment.find({ schoolId: collegeId });
    const departmentDistribution = [];
    for (const dept of departments) {
      const count = await CollegeApplication.countDocuments({ schoolId: collegeId, departmentId: dept._id });
      departmentDistribution.push({
        name: dept.name,
        code: dept.code,
        count
      });
    }

    // City-wise applications
    const cityAggregate = await CollegeApplication.aggregate([
      { $match: { schoolId: new require('mongoose').Types.ObjectId(collegeId) } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const cityDistribution = cityAggregate.map(item => ({
      city: item._id || 'Unknown',
      count: item.count
    }));

    // Lead source analytics
    const sourceAggregate = await CollegeApplication.aggregate([
      { $match: { schoolId: new require('mongoose').Types.ObjectId(collegeId) } },
      { $group: { _id: '$referralSource', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const leadSourceDistribution = sourceAggregate.map(item => ({
      source: item._id || 'Organic',
      count: item.count
    }));

    // Recent applications
    const recentApplications = await CollegeApplication.find({ schoolId: collegeId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('courseId', 'name')
      .populate('departmentId', 'name');

    return res.json({
      success: true,
      data: {
        stats: {
          totalApplications,
          todayApplications,
          pendingVerification,
          counsellingScheduled,
          counsellingCompleted,
          feePending,
          confirmedAdmissions,
          scholarshipRequests,
          hostelRequests
        },
        courseDistribution,
        departmentDistribution,
        cityDistribution,
        leadSourceDistribution,
        recentApplications
      }
    });
  } catch (error) {
    console.error('College dashboard analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading dashboard analytics' });
  }
};

module.exports = { getDashboardAnalytics };
