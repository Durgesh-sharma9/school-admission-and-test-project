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
    const {
      academicSession = '',
      session = '',
      startDate = '',
      endDate = ''
    } = req.query;

    const selectedSession = academicSession || session;
    const baseMatch = { schoolId: new mongoose.Types.ObjectId(schoolId), isDeleted: { $ne: true } };

    if (selectedSession && selectedSession !== 'all' && selectedSession !== 'All Sessions') {
      if (selectedSession === '2026-2027') {
        baseMatch.$or = [
          { academicSession: '2026-2027' },
          { academicSession: { $exists: false } },
          { academicSession: null },
          { academicSession: '' }
        ];
      } else {
        baseMatch.academicSession = selectedSession;
      }
    }

    if (startDate || endDate) {
      baseMatch.saveDate = {};
      if (startDate) baseMatch.saveDate.$gte = startDate;
      if (endDate) baseMatch.saveDate.$lte = endDate;
    }

    // 1. Enquiries by Class seeking (ignoring soft-deleted)
    const classDistribution = await Enquiry.aggregate([
      { $match: baseMatch },
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
      { $match: baseMatch },
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
    const admissionsMatch = {
      ...baseMatch,
      status: 'Admission Confirmed'
    };

    const monthlyAdmissions = await Enquiry.aggregate([
      { $match: admissionsMatch },
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
      { $match: baseMatch },
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
    const recentEnquiries = await Enquiry.find(baseMatch)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('enquiryId studentName parentName classSeeking status saveDate saveTime academicSession');

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
