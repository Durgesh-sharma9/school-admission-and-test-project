const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const AssessmentAssignment = require('../models/AssessmentAssignment');
const Notification = require('../models/Notification');
const Assessment = require('../models/Assessment');

// @desc    Get dashboard metrics, trend chart data, and activity logs
// @route   GET /api/v1/analytics/overview
// @access  Private (Admin)
const getAnalyticsOverview = async (req, res) => {
  try {
    const schoolId = req.school.id;

    // 1. Enquiries by Class seeking (ignoring soft-deleted)
    const classDistribution = await Enquiry.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$classSeeking',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // 2. Monthly registration counts (Inquiries by Month)
    const monthlyEnquiries = await Enquiry.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: { $substr: ['$saveDate', 0, 7] }, // YYYY-MM substring
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 } // Recent 12 months
    ]);

    // 3. Monthly Admissions (Admissions by Month)
    const monthlyAdmissions = await Enquiry.aggregate([
      {
        $match: {
          schoolId: new mongoose.Types.ObjectId(schoolId),
          status: 'Admission Confirmed',
          isDeleted: { $ne: true }
        }
      },
      {
        $group: {
          _id: { $substr: ['$saveDate', 0, 7] }, // YYYY-MM substring
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    // 4. Counts breakdown for conversion rates
    const enquiriesCounts = await Enquiry.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalEnquiries = enquiriesCounts.reduce((sum, item) => sum + item.count, 0);
    const confirmedAdmissions = enquiriesCounts.find(c => c._id === 'Admission Confirmed')?.count || 0;
    const admissionConversionRate = totalEnquiries > 0
      ? parseFloat(((confirmedAdmissions / totalEnquiries) * 100).toFixed(2))
      : 0;

    // 5. Recent Enquiries (Last 5)
    const recentEnquiries = await Enquiry.find({ schoolId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('enquiryId studentName parentName classSeeking status saveDate saveTime');

    // 6. Recent Assessment Completions (Last 5)
    const recentAssessments = await AssessmentAssignment.find({ schoolId, status: 'Completed' })
      .sort({ submittedAt: -1 })
      .limit(5)
      .populate('assessmentId', 'name totalMarks')
      .populate('enquiryId', 'studentName');

    // 7. Recent Logged Activity (Last 10 notifications)
    const recentActivity = await Notification.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: {
        classDistribution,
        monthlyEnquiries,
        monthlyAdmissions,
        rates: {
          admissionConversionRate,
          totalEnquiries,
          confirmedAdmissions
        },
        recentEnquiries,
        recentAssessments,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading analytical data' });
  }
};

module.exports = {
  getAnalyticsOverview,
};
