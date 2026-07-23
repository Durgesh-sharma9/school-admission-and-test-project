const mongoose = require('mongoose');
const CollegeApplication = require('../models/CollegeApplication');
const CollegeCourse = require('../models/CollegeCourse');
const CollegeDepartment = require('../models/CollegeDepartment');
const CollegeAcademicConfig = require('../models/CollegeAcademicConfig');

// @desc    Get College CRM Dashboard analytics
// @route   GET /api/v1/college/dashboard/analytics
// @access  Private (College Admin)
const getDashboardAnalytics = async (req, res) => {
  try {
    // Validate authentication context
    if (!req.school || !req.school.id) {
      console.error('Dashboard Auth Error: req.school or req.school.id is missing');
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, invalid school/college administrator context' 
      });
    }

    const collegeId = req.school.id;
    let collegeObjectId;
    try {
      collegeObjectId = new mongoose.Types.ObjectId(collegeId);
    } catch (err) {
      console.error(`Dashboard ObjectId conversion error for ID ${collegeId}:`, err);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid college identifier format' 
      });
    }

    // Basic Metrics (always default to 0 on failure or empty)
    let totalApplications = 0;
    let todayApplications = 0;
    let counsellingAssigned = 0;
    let callScheduled = 0;
    let callCompleted = 0;
    let campusVisit = 0;
    let pendingVerification = 0;
    let verifiedVerification = 0;
    let selected = 0;
    let rejected = 0;
    let confirmedAdmissions = 0;
    let scholarshipRequests = 0;
    let hostelRequests = 0;

    try {
      totalApplications = await CollegeApplication.countDocuments({ schoolId: collegeObjectId }) || 0;
    } catch (e) {
      console.error('Error counting totalApplications:', e);
    }

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      todayApplications = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        createdAt: { $gte: todayStart }
      }) || 0;
    } catch (e) {
      console.error('Error counting todayApplications:', e);
    }

    try {
      counsellingAssigned = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Counselling Assigned'
      }) || 0;
    } catch (e) {
      console.error('Error counting counsellingAssigned:', e);
    }

    try {
      callScheduled = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Call Scheduled'
      }) || 0;
    } catch (e) {
      console.error('Error counting callScheduled:', e);
    }

    try {
      callCompleted = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Call Completed'
      }) || 0;
    } catch (e) {
      console.error('Error counting callCompleted:', e);
    }

    try {
      campusVisit = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Campus Visit'
      }) || 0;
    } catch (e) {
      console.error('Error counting campusVisit:', e);
    }

    try {
      pendingVerification = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Documents Pending'
      }) || 0;
    } catch (e) {
      console.error('Error counting pendingVerification:', e);
    }

    try {
      verifiedVerification = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Documents Verified'
      }) || 0;
    } catch (e) {
      console.error('Error counting verifiedVerification:', e);
    }

    try {
      selected = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Selected'
      }) || 0;
    } catch (e) {
      console.error('Error counting selected:', e);
    }

    try {
      rejected = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Rejected'
      }) || 0;
    } catch (e) {
      console.error('Error counting rejected:', e);
    }

    try {
      confirmedAdmissions = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        stage: 'Admission Confirmed'
      }) || 0;
    } catch (e) {
      console.error('Error counting confirmedAdmissions:', e);
    }

    try {
      scholarshipRequests = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        $or: [
          { scholarshipApplied: true },
          { scholarshipAmount: { $gt: 0 } }
        ]
      }) || 0;
    } catch (e) {
      console.error('Error counting scholarshipRequests:', e);
    }

    try {
      hostelRequests = await CollegeApplication.countDocuments({
        schoolId: collegeObjectId,
        hostelRequired: true
      }) || 0;
    } catch (e) {
      console.error('Error counting hostelRequests:', e);
    }

    // Course distribution
    let courseDistribution = [];
    try {
      const config = await CollegeAcademicConfig.findOne({ schoolId: collegeObjectId })
        .populate('selectedDepartments')
        .populate('selectedCourses');

      const courses = config ? config.selectedCourses : [];
      for (const course of courses) {
        if (course && course._id) {
          const count = await CollegeApplication.countDocuments({ schoolId: collegeObjectId, courseId: course._id }) || 0;
          courseDistribution.push({
            name: course.name || 'Unknown Course',
            code: course.code || 'N/A',
            count
          });
        }
      }
    } catch (e) {
      console.error('Error generating courseDistribution:', e);
    }

    // Department distribution
    let departmentDistribution = [];
    try {
      const config = await CollegeAcademicConfig.findOne({ schoolId: collegeObjectId })
        .populate('selectedDepartments');

      const departments = config ? config.selectedDepartments : [];
      for (const dept of departments) {
        if (dept && dept._id) {
          const count = await CollegeApplication.countDocuments({ schoolId: collegeObjectId, departmentId: dept._id }) || 0;
          departmentDistribution.push({
            name: dept.name || 'Unknown Department',
            code: dept.code || 'N/A',
            count
          });
        }
      }
    } catch (e) {
      console.error('Error generating departmentDistribution:', e);
    }

    // City-wise applications
    let cityDistribution = [];
    try {
      const cityAggregate = await CollegeApplication.aggregate([
        { $match: { schoolId: collegeObjectId } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      cityDistribution = (cityAggregate || []).map(item => ({
        city: item?._id || 'Unknown',
        count: item?.count || 0
      }));
    } catch (e) {
      console.error('Error generating cityDistribution aggregate:', e);
    }

    // Lead source analytics
    let leadSourceDistribution = [];
    try {
      const sourceAggregate = await CollegeApplication.aggregate([
        { $match: { schoolId: collegeObjectId } },
        { $group: { _id: '$referralSource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      leadSourceDistribution = (sourceAggregate || []).map(item => ({
        source: item?._id || 'Organic',
        count: item?.count || 0
      }));
    } catch (e) {
      console.error('Error generating leadSourceDistribution aggregate:', e);
    }

    // Recent applications
    let recentApplications = [];
    try {
      recentApplications = await CollegeApplication.find({ schoolId: collegeObjectId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('courseId', 'name')
        .populate('departmentId', 'name') || [];
    } catch (e) {
      console.error('Error fetching recentApplications:', e);
    }

    // Build stats mapping (with aliases to support both frontend & any external spec checklist)
    const stats = {
      totalApplications,
      todayApplications,
      counsellingAssigned,
      callScheduled,
      callCompleted,
      campusVisit,
      pendingVerification,
      docsPending: pendingVerification,
      verifiedVerification,
      docsVerified: verifiedVerification,
      selected,
      selectedApplicants: selected,
      rejected,
      rejectedApplicants: rejected,
      confirmedAdmissions,
      scholarshipRequests,
      hostelRequests,
      applicationsByDepartment: departmentDistribution || [],
      applicationsByCourse: courseDistribution || []
    };

    return res.json({
      success: true,
      data: {
        stats,
        courseDistribution: courseDistribution || [],
        departmentDistribution: departmentDistribution || [],
        cityDistribution: cityDistribution || [],
        leadSourceDistribution: leadSourceDistribution || [],
        recentApplications: recentApplications || []
      }
    });
  } catch (error) {
    console.error('CRITICAL: College dashboard analytics exception caught:');
    console.error(error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error loading dashboard analytics' 
    });
  }
};

module.exports = { getDashboardAnalytics };
