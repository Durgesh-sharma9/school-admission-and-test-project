const Announcement = require('../models/Announcement');
const School = require('../models/School');

// @desc    Create / Publish / Schedule Announcement
// @route   POST /api/v1/super-admin/announcements
// @access  Private (Super Admin)
const createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      category,
      priority,
      targetType,
      targetSchools,
      sendType,
      scheduledAt,
      expiresAt,
      requireAcknowledgement,
      attachment,
      status,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }

    let finalStatus = status || 'sent';
    let finalScheduledAt = scheduledAt;

    if (sendType === 'later' && scheduledAt) {
      const scheduleDate = new Date(scheduledAt);
      if (scheduleDate > new Date()) {
        finalStatus = 'scheduled';
      }
    }

    // Validate target schools if targetType === 'selected'
    let selectedSchoolIds = [];
    if (targetType === 'selected' && Array.isArray(targetSchools)) {
      selectedSchoolIds = targetSchools;
    }

    const announcement = new Announcement({
      title,
      message,
      category: category || 'Information',
      priority: priority || 'Medium',
      targetType: targetType || 'all',
      targetSchools: selectedSchoolIds,
      sendType: sendType || 'now',
      scheduledAt: finalScheduledAt,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      requireAcknowledgement: Boolean(requireAcknowledgement),
      attachment,
      status: finalStatus,
      createdBy: req.superAdmin ? req.superAdmin.id : null,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: finalStatus === 'scheduled' ? 'Announcement scheduled successfully' : 'Announcement published successfully',
      data: announcement,
    });
  } catch (error) {
    console.error('Create Announcement Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get All Announcements for Super Admin
// @route   GET /api/v1/super-admin/announcements
// @access  Private (Super Admin)
const getAllAnnouncements = async (req, res) => {
  try {
    const { status, category, priority, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const announcements = await Announcement.find(filter)
      .populate('targetSchools', 'name email logo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments(filter);

    // Calculate total target schools count for recipient analysis
    const totalRegisteredSchoolsCount = await School.countDocuments({ role: 'school-admin' });

    const processedAnnouncements = announcements.map((item) => {
      const targetCount = item.targetType === 'all' ? totalRegisteredSchoolsCount : item.targetSchools.length;
      const readCount = item.readReceipts ? item.readReceipts.length : 0;
      const ackCount = item.readReceipts ? item.readReceipts.filter(r => r.acknowledgedAt).length : 0;
      const unreadCount = Math.max(0, targetCount - readCount);

      return {
        ...item._doc,
        recipientStats: {
          totalRecipients: targetCount,
          readCount,
          unreadCount,
          ackCount,
          readRate: targetCount > 0 ? Math.round((readCount / targetCount) * 100) : 0,
        },
      };
    });

    res.status(200).json({
      success: true,
      data: processedAnnouncements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Read Tracking for Announcement
// @route   GET /api/v1/super-admin/announcements/:id
// @access  Private (Super Admin)
const getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate('targetSchools', 'name email logo phone address')
      .populate('readReceipts.school', 'name email logo phone');

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    // Determine target recipient schools
    let recipientSchools = [];
    if (announcement.targetType === 'all') {
      recipientSchools = await School.find({ role: 'school-admin' }).select('name email logo phone address');
    } else {
      recipientSchools = announcement.targetSchools;
    }

    // Map read status per school
    const readReceiptMap = new Map();
    (announcement.readReceipts || []).forEach((rr) => {
      if (rr.school && rr.school._id) {
        readReceiptMap.set(rr.school._id.toString(), {
          readAt: rr.readAt,
          acknowledgedAt: rr.acknowledgedAt,
        });
      }
    });

    const trackingList = recipientSchools.map((s) => {
      const sId = s._id.toString();
      const receipt = readReceiptMap.get(sId);
      return {
        schoolId: s._id,
        schoolName: s.name,
        email: s.email,
        logo: s.logo,
        isRead: Boolean(receipt),
        readAt: receipt ? receipt.readAt : null,
        isAcknowledged: Boolean(receipt && receipt.acknowledgedAt),
        acknowledgedAt: receipt ? receipt.acknowledgedAt : null,
      };
    });

    const totalRecipients = trackingList.length;
    const readCount = trackingList.filter((t) => t.isRead).length;
    const unreadCount = totalRecipients - readCount;
    const ackCount = trackingList.filter((t) => t.isAcknowledged).length;

    res.status(200).json({
      success: true,
      data: {
        ...announcement._doc,
        trackingStats: {
          totalRecipients,
          readCount,
          unreadCount,
          ackCount,
          readRate: totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0,
        },
        recipientDetails: trackingList,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Announcement
// @route   PUT /api/v1/super-admin/announcements/:id
// @access  Private (Super Admin)
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, data: announcement });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Announcement
// @route   DELETE /api/v1/super-admin/announcements/:id
// @access  Private (Super Admin)
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Overall Announcement Platform Analytics
// @route   GET /api/v1/super-admin/announcements-analytics
// @access  Private (Super Admin)
const getAnnouncementAnalytics = async (req, res) => {
  try {
    const totalAnnouncements = await Announcement.countDocuments();
    const sentAnnouncements = await Announcement.countDocuments({ status: 'sent' });
    const scheduledAnnouncements = await Announcement.countDocuments({ status: 'scheduled' });
    const draftAnnouncements = await Announcement.countDocuments({ status: 'draft' });

    const totalSchools = await School.countDocuments({ role: 'school-admin' });

    const allSent = await Announcement.find({ status: 'sent' });

    let totalPotentialDeliveries = 0;
    let totalReadReceipts = 0;

    allSent.forEach((item) => {
      const targetCount = item.targetType === 'all' ? totalSchools : (item.targetSchools ? item.targetSchools.length : 0);
      totalPotentialDeliveries += targetCount;
      totalReadReceipts += item.readReceipts ? item.readReceipts.length : 0;
    });

    const overallReadRate = totalPotentialDeliveries > 0
      ? Math.round((totalReadReceipts / totalPotentialDeliveries) * 100)
      : 0;

    const unreadRate = 100 - overallReadRate;

    // Top most viewed announcements
    const mostViewed = allSent
      .map((item) => ({
        id: item._id,
        title: item.title,
        category: item.category,
        priority: item.priority,
        views: item.readReceipts ? item.readReceipts.length : 0,
        createdAt: item.createdAt,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalAnnouncements,
        sentAnnouncements,
        scheduledAnnouncements,
        draftAnnouncements,
        overallReadRate,
        unreadRate,
        mostViewed,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SCHOOL ADMIN ENDPOINTS
// ==========================================

// @desc    Get Announcements targeted for current School
// @route   GET /api/v1/school/announcements
// @access  Private (School Admin)
const getSchoolAnnouncements = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const now = new Date();

    // Query announcements targeted to 'all' or specifically including this schoolId
    const announcements = await Announcement.find({
      status: 'sent',
      $or: [
        { targetType: 'all' },
        { targetSchools: schoolId },
      ],
      $and: [
        { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
      ],
    }).sort({ createdAt: -1 });

    const processed = announcements.map((item) => {
      const receipt = (item.readReceipts || []).find(
        (rr) => rr.school && rr.school.toString() === schoolId.toString()
      );

      return {
        ...item._doc,
        isRead: Boolean(receipt),
        readAt: receipt ? receipt.readAt : null,
        isAcknowledged: Boolean(receipt && receipt.acknowledgedAt),
        acknowledgedAt: receipt ? receipt.acknowledgedAt : null,
      };
    });

    const unreadCount = processed.filter((a) => !a.isRead).length;
    const urgentUnread = processed.filter((a) => !a.isRead && (a.priority === 'High' || a.priority === 'Critical'));

    res.status(200).json({
      success: true,
      data: processed,
      unreadCount,
      urgentUnread,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    School Admin Mark Announcement as Read
// @route   POST /api/v1/school/announcements/:id/read
// @access  Private (School Admin)
const markAsRead = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const existingIndex = announcement.readReceipts.findIndex(
      (rr) => rr.school.toString() === schoolId.toString()
    );

    if (existingIndex === -1) {
      announcement.readReceipts.push({
        school: schoolId,
        readAt: new Date(),
      });
      await announcement.save();
    }

    res.status(200).json({ success: true, message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    School Admin Acknowledge Announcement
// @route   POST /api/v1/school/announcements/:id/acknowledge
// @access  Private (School Admin)
const acknowledgeAnnouncement = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const existingIndex = announcement.readReceipts.findIndex(
      (rr) => rr.school.toString() === schoolId.toString()
    );

    if (existingIndex !== -1) {
      announcement.readReceipts[existingIndex].acknowledgedAt = new Date();
    } else {
      announcement.readReceipts.push({
        school: schoolId,
        readAt: new Date(),
        acknowledgedAt: new Date(),
      });
    }

    await announcement.save();

    res.status(200).json({ success: true, message: 'Announcement acknowledged' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAnnouncement,
  getAllAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  getAnnouncementAnalytics,
  getSchoolAnnouncements,
  markAsRead,
  acknowledgeAnnouncement,
};
