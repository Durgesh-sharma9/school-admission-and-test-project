const mongoose = require('mongoose');
const Enquiry = require('../models/Enquiry');
const School = require('../models/School');
const ParentProfile = require('../models/ParentProfile');
const { processLocalityOnEnquirySave } = require('./localityController');
const generateEnquiryId = require('../utils/enquiryIdGenerator');
const createNotification = require('../utils/createNotification');

// Helper to format date & time
const getFormattedDateTime = () => {
  const now = new Date();
  const saveDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const saveTime = now.toTimeString().split(' ')[0]; // HH:mm:ss
  return { saveDate, saveTime };
};

// @desc    Get all enquiries for logged-in school
// @route   GET /api/v1/enquiries
// @access  Private (School Admin)
const getEnquiries = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      status = '', 
      classFilter = '', 
      startDate = '', 
      endDate = '', 
      sortBy = 'newest' 
    } = req.query;

    const query = { schoolId, isDeleted: { $ne: true } };

    // Apply status filter if provided
    if (status) {
      query.status = status;
    }

    // Apply class filter if provided
    if (classFilter) {
      query.classSeeking = classFilter;
    }

    // Apply date range filter (saveDate is YYYY-MM-DD format)
    if (startDate || endDate) {
      query.saveDate = {};
      if (startDate) query.saveDate.$gte = startDate;
      if (endDate) query.saveDate.$lte = endDate;
    }

    // Apply search filter if provided (matching name, parent, mobile, state, city, area, society, previousSchool, source, sourceOtherSpecify, or enquiryId)
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { parentName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { enquiryId: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { area: { $regex: search, $options: 'i' } },
        { society: { $regex: search, $options: 'i' } },
        { previousSchool: { $regex: search, $options: 'i' } },
        { source: { $regex: search, $options: 'i' } },
        { sourceOtherSpecify: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine Sort options
    let sortOption = { createdAt: -1 }; // default: newest
    if (sortBy === 'oldest') sortOption = { createdAt: 1 };
    else if (sortBy === 'name_asc') sortOption = { studentName: 1 };
    else if (sortBy === 'name_desc') sortOption = { studentName: -1 };
    else if (sortBy === 'class') sortOption = { classSeeking: 1 };

    // Pagination options
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const total = await Enquiry.countDocuments(query);
    const enquiries = await Enquiry.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit, 10));

    // Calculate statistics (Total, New, Hold, Confirmed, Not Interested) for the dashboard dashboard
    // We can fetch it in this route or a separate stats endpoint.
    // Fetching stats here is efficient, but let's build a dedicated stats route for clean MVC separation.
    
    return res.json({
      success: true,
      data: enquiries,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Fetch enquiries error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching enquiries' });
  }
};

// @desc    Get dashboard statistics for a school
// @route   GET /api/v1/enquiries/stats
// @access  Private (School Admin)
const getDashboardStats = async (req, res) => {
  try {
    const schoolId = req.school.id;

    const stats = await Enquiry.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Map aggregates to simple counters
    const formattedStats = {
      total: 0,
      newEnquiry: 0,
      hold: 0,
      notInterested: 0,
      confirmed: 0
    };

    stats.forEach(stat => {
      formattedStats.total += stat.count;
      if (stat._id === 'New Enquiry') formattedStats.newEnquiry = stat.count;
      else if (stat._id === 'Hold') formattedStats.hold = stat.count;
      else if (stat._id === 'Not Interested') formattedStats.notInterested = stat.count;
      else if (stat._id === 'Admission Confirmed') formattedStats.confirmed = stat.count;
    });

    return res.json({
      success: true,
      stats: formattedStats
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

// Helper to upsert parent profile
const upsertParentProfile = async (schoolId, data) => {
  try {
    if (!data.mobile) return;
    
    await ParentProfile.findOneAndUpdate(
      { schoolId: new mongoose.Types.ObjectId(schoolId), mobile: data.mobile.trim() },
      {
        $set: {
          parentName: data.parentName ? data.parentName.trim() : '',
          whatsapp: data.whatsapp ? data.whatsapp.trim() : '',
          email: data.email ? data.email.trim() : '',
          state: data.state ? data.state.trim() : '',
          city: data.city ? data.city.trim() : '',
          area: data.area ? data.area.trim() : '',
          society: data.society ? data.society.trim() : '',
          fullAddress: data.fullAddress ? data.fullAddress.trim() : ''
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    console.error('Failed to upsert ParentProfile:', error);
  }
};

// @desc    Admin creates an enquiry manually
// @route   POST /api/v1/enquiries
// @access  Private (School Admin)
const createEnquiryManual = async (req, res) => {
  try {
    const schoolId = req.school.id;
    const enquiryData = req.body;

    const uniqueId = await generateEnquiryId();
    const { saveDate, saveTime } = getFormattedDateTime();

    let localityInfo = null;
    if (enquiryData.area) {
      localityInfo = await processLocalityOnEnquirySave(schoolId, enquiryData.area, false);
    }

    const enquiry = new Enquiry({
      ...enquiryData,
      schoolId,
      localityId: localityInfo ? localityInfo.localityId : null,
      enquiryId: uniqueId,
      saveDate,
      saveTime,
      status: enquiryData.status || 'New Enquiry',
    });

    await enquiry.save();

    // Upsert parent profile
    await upsertParentProfile(schoolId, enquiryData);

    // Trigger Notification Log
    await createNotification(
      schoolId,
      'New Enquiry Registered',
      `Manual Walk-in enquiry created for ${enquiry.studentName} (ID: ${enquiry.enquiryId})`,
      'new_enquiry'
    );

    return res.status(201).json({
      success: true,
      message: 'Enquiry created successfully',
      data: enquiry,
    });
  } catch (error) {
    console.error('Manual enquiry creation error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error creating enquiry' });
  }
};

// @desc    Public/Parent/Reception creates an enquiry (QR flow / public form)
// @route   POST /api/v1/public/enquiries/:schoolId
// @access  Public
const createEnquiryPublic = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const enquiryData = req.body;

    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    const uniqueId = await generateEnquiryId();
    const { saveDate, saveTime } = getFormattedDateTime();

    let localityInfo = null;
    if (enquiryData.area) {
      localityInfo = await processLocalityOnEnquirySave(schoolId, enquiryData.area, true);
    }

    const enquiry = new Enquiry({
      ...enquiryData,
      schoolId,
      localityId: localityInfo ? localityInfo.localityId : null,
      enquiryId: uniqueId,
      saveDate,
      saveTime,
      status: 'New Enquiry', // Public forms default to New Enquiry
    });

    await enquiry.save();

    // Upsert parent profile
    await upsertParentProfile(schoolId, enquiryData);

    // Trigger Notification Log
    await createNotification(
      schoolId,
      'New Enquiry Submitted',
      `New portal enquiry submitted for student ${enquiry.studentName} (ID: ${enquiry.enquiryId})`,
      'new_enquiry'
    );

    // Fetch the school's CMS settings to customize the public redirect response
    // Specifically returning CMS settings for Thank You preview
    return res.status(201).json({
      success: true,
      message: 'Admission enquiry submitted successfully',
      data: {
        enquiryId: enquiry.enquiryId,
        studentName: enquiry.studentName,
        parentName: enquiry.parentName,
        thankYouCms: school.thankYouCms,
        schoolName: school.name,
      },
    });
  } catch (error) {
    console.error('Public enquiry creation error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error processing admission form' });
  }
};

// @desc    Update full enquiry details
// @route   PUT /api/v1/enquiries/:id
// @access  Private (School Admin)
const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.school.id;
    const updateData = req.body;

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, schoolId: new mongoose.Types.ObjectId(schoolId) },
      updateData,
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found or unauthorized' });
    }

    // Trigger Notification Log
    await createNotification(
      schoolId,
      'Enquiry Updated',
      `Enquiry details updated for student ${enquiry.studentName} (ID: ${enquiry.enquiryId})`,
      'status_changed'
    );

    return res.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry,
    });
  } catch (error) {
    console.error('Update enquiry error:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    return res.status(500).json({ success: false, message: 'Server error updating enquiry' });
  }
};

// @desc    Update enquiry status
// @route   PATCH /api/v1/enquiries/:id/status
// @access  Private (School Admin)
const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['New Enquiry', 'Hold', 'Not Interested', 'Admission Confirmed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, schoolId: req.school.id },
      { status },
      { new: true, runValidators: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found or unauthorized' });
    }

    // Trigger Notification Log
    await createNotification(
      req.school.id,
      'Enquiry Status Changed',
      `Enquiry status updated to "${status}" for student ${enquiry.studentName} (ID: ${enquiry.enquiryId})`,
      'status_changed'
    );

    return res.json({
      success: true,
      message: `Enquiry status updated to: ${status}`,
      data: enquiry,
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
};

// @desc    Convert Enquiry to Admission
// @route   POST /api/v1/enquiries/:id/convert
// @access  Private (School Admin)
const convertToAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, schoolId: req.school.id },
      {
        status: 'Admission Confirmed',
        isConvertedToAdmission: true,
        convertedAt: new Date(),
      },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found or unauthorized' });
    }

    // Trigger Notification Log
    await createNotification(
      req.school.id,
      'Admission Confirmed',
      `Admission registration confirmed for student ${enquiry.studentName} (ID: ${enquiry.enquiryId})`,
      'admission_confirmed'
    );

    return res.json({
      success: true,
      message: 'Successfully converted enquiry to Admission!',
      data: enquiry,
    });
  } catch (error) {
    console.error('Convert admission error:', error);
    return res.status(500).json({ success: false, message: 'Server error converting enquiry' });
  }
};

// @desc    Soft-delete enquiry
// @route   DELETE /api/v1/enquiries/:id
// @access  Private (School Admin)
const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findOneAndUpdate(
      { _id: id, schoolId: req.school.id },
      { isDeleted: true },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry record not found or unauthorized' });
    }

    // Trigger Notification for audit trail
    await createNotification(
      req.school.id,
      'Enquiry Removed',
      `Enquiry for student ${enquiry.studentName} (ID: ${enquiry.enquiryId}) was soft-deleted.`,
      'status_changed'
    );

    return res.json({
      success: true,
      message: 'Enquiry record soft-deleted successfully',
    });
  } catch (error) {
    console.error('Delete enquiry error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting enquiry' });
  }
};

// @desc    Check parent history by mobile number
// @route   GET /api/v1/enquiries/parent-recognition/:mobile
// @access  Public
const parentRecognition = async (req, res) => {
  try {
    const { mobile } = req.params;
    const schoolId = req.query.schoolId || (req.school && req.school.id);

    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'School identification is mandatory' });
    }

    if (!mobile || mobile.trim().length !== 10) {
      return res.status(400).json({ success: false, message: 'A valid 10-digit mobile number is required' });
    }

    // Find parent profile or check enquiries
    let parent = await ParentProfile.findOne({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      mobile: mobile.trim()
    });

    // Fallback: If parent profile doesn't exist yet, search in existing enquiries
    if (!parent) {
      const existingEnquiry = await Enquiry.findOne({
        schoolId: new mongoose.Types.ObjectId(schoolId),
        mobile: mobile.trim(),
        isDeleted: { $ne: true }
      });

      if (existingEnquiry) {
        parent = new ParentProfile({
          schoolId: new mongoose.Types.ObjectId(schoolId),
          mobile: mobile.trim(),
          parentName: existingEnquiry.parentName,
          whatsapp: existingEnquiry.whatsapp || '',
          email: existingEnquiry.email || '',
          state: existingEnquiry.state || '',
          city: existingEnquiry.city || '',
          area: existingEnquiry.area || '',
          society: existingEnquiry.society || '',
          fullAddress: existingEnquiry.fullAddress || ''
        });
        await parent.save();
      }
    }

    if (!parent) {
      return res.json({ success: true, exists: false });
    }

    // Fetch previous enquiries
    const enquiries = await Enquiry.find({
      schoolId: new mongoose.Types.ObjectId(schoolId),
      mobile: mobile.trim(),
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    const children = [...new Set(enquiries.map(e => e.studentName))];

    return res.json({
      success: true,
      exists: true,
      parent,
      enquiriesCount: enquiries.length,
      children,
      enquiries
    });
  } catch (error) {
    console.error('Parent recognition lookup error:', error);
    return res.status(500).json({ success: false, message: 'Server error during parent recognition' });
  }
};

module.exports = {
  getEnquiries,
  getDashboardStats,
  createEnquiryManual,
  createEnquiryPublic,
  updateEnquiry,
  updateEnquiryStatus,
  convertToAdmission,
  deleteEnquiry,
  parentRecognition,
};
