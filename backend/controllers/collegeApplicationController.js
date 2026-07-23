const CollegeApplication = require('../models/CollegeApplication');
const CollegeCourse = require('../models/CollegeCourse');
const CollegeDepartment = require('../models/CollegeDepartment');
const CollegeAcademicConfig = require('../models/CollegeAcademicConfig');

// Helper to generate custom application ID
const generateApplicationId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'APP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// @desc    Get all applications for college (with filtering & search)
// @route   GET /api/v1/college/applications
// @access  Private (College Admin)
const getApplications = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { search, stage, courseId, departmentId, paymentStatus } = req.query;

    const query = { schoolId: collegeId };

    if (stage) query.stage = stage;
    if (courseId) query.courseId = courseId;
    if (departmentId) query.departmentId = departmentId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { applicationId: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await CollegeApplication.find(query)
      .populate('courseId', 'name code')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get applications error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching applications' });
  }
};

// @desc    Get application details by ID
// @route   GET /api/v1/college/applications/:id
// @access  Private (College Admin)
const getApplicationById = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;

    const application = await CollegeApplication.findOne({ _id: id, schoolId: collegeId })
      .populate('courseId')
      .populate('departmentId');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    return res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application details error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching application details' });
  }
};

// @desc    Submit public college admission form
// @route   POST /api/v1/college/applications/submit
// @access  Public
const submitApplication = async (req, res) => {
  try {
    const {
      schoolId,
      studentName,
      dob,
      gender,
      mobile,
      email,
      aadhaar,
      category,
      nationality,
      fatherName,
      motherName,
      parentName,
      parentMobile,
      parentEmail,
      parentOccupation,
      state,
      city,
      pinCode,
      address,
      area,
      tenthBoard,
      tenthPercentage,
      tenthYear,
      twelfthBoard,
      twelfthPercentage,
      twelfthYear,
      graduationPercentage,
      graduationDegree,
      graduationYear,
      entranceExam,
      entranceScore,
      departmentId,
      courseId,
      specialization,
      session,
      modeOfStudy,
      hostelRequired,
      transportRequired,
      scholarshipApplied,
      referralSource,
      documents,
      feeAmountPaid,
      discountApplied,
      scholarshipAmount,
      paymentMode,
      transactionId,
      receiptUrl
    } = req.body;

    if (!schoolId || !studentName || !email || !mobile || !dob || !gender || !parentName || !parentMobile || !address || !tenthPercentage || !tenthBoard || !tenthYear || !twelfthPercentage || !twelfthBoard || !twelfthYear || !departmentId || !courseId) {
      return res.status(400).json({ success: false, message: 'All mandatory admission details are required' });
    }

    // Verify course belongs to this college
    const config = await CollegeAcademicConfig.findOne({ schoolId });
    if (!config || !config.selectedCourses.includes(courseId)) {
      return res.status(400).json({ success: false, message: 'Selected course is not active for this college' });
    }

    const app = new CollegeApplication({
      applicationId: generateApplicationId(),
      schoolId,
      studentName,
      dob,
      gender,
      mobile,
      email,
      aadhaar,
      category,
      nationality: nationality || 'Indian',
      fatherName,
      motherName,
      parentName,
      parentMobile,
      parentEmail,
      parentOccupation,
      state,
      city,
      pinCode,
      address,
      area,
      tenthBoard,
      tenthPercentage,
      tenthYear,
      twelfthBoard,
      twelfthPercentage,
      twelfthYear,
      graduationPercentage,
      graduationDegree,
      graduationYear,
      entranceExam,
      entranceScore,
      departmentId,
      courseId,
      specialization,
      session: session || '2026-2027',
      modeOfStudy: modeOfStudy || 'Regular',
      hostelRequired: !!hostelRequired,
      transportRequired: !!transportRequired,
      scholarshipApplied: !!scholarshipApplied,
      referralSource,
      documents: documents || [],
      feeAmountPaid: feeAmountPaid || 0,
      discountApplied: discountApplied || 0,
      scholarshipAmount: scholarshipAmount || 0,
      paymentMode: paymentMode || 'Online',
      transactionId: transactionId || '',
      receiptUrl: receiptUrl || '',
      paymentStatus: transactionId ? 'Pending' : 'Pending',
      paymentDate: transactionId ? new Date() : null,
      stage: 'Application Received',
      notes: [{ note: 'Application submitted successfully via Admission Desk Portal.' }]
    });

    await app.save();
    return res.status(201).json({ success: true, message: 'Admission application submitted successfully!', data: app });
  } catch (error) {
    console.error('Submit application error:', error);
    return res.status(500).json({ success: false, message: 'Server error processing application submission' });
  }
};

// @desc    Update application stage
// @route   PUT /api/v1/college/applications/:id/stage
// @access  Private (College Admin)
const updateApplicationStage = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;
    const { stage, note } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, message: 'Stage is required' });
    }

    const app = await CollegeApplication.findOne({ _id: id, schoolId: collegeId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    app.stage = stage;
    app.notes.push({
      note: note || `Stage updated to: ${stage}`,
      counselorName: req.school.name,
      date: new Date()
    });

    await app.save();
    return res.json({ success: true, message: 'Stage updated successfully', data: app });
  } catch (error) {
    console.error('Update stage error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating stage' });
  }
};

// @desc    Verify uploaded document
// @route   PUT /api/v1/college/applications/:id/document/:docId
// @access  Private (College Admin)
const verifyDocument = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id, docId } = req.params;
    const { status } = req.body; // 'Verified' | 'Rejected' | 'Pending'

    if (!status) {
      return res.status(400).json({ success: false, message: 'Document status is required' });
    }

    const app = await CollegeApplication.findOne({ _id: id, schoolId: collegeId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const doc = app.documents.id(docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    doc.status = status;
    app.notes.push({
      note: `Document "${doc.name}" marked as ${status}`,
      counselorName: req.school.name,
      date: new Date()
    });

    await app.save();
    return res.json({ success: true, message: 'Document verification updated', data: app });
  } catch (error) {
    console.error('Verify document error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating document verification' });
  }
};



// @desc    Add general counselling note
// @route   POST /api/v1/college/applications/:id/note
// @access  Private (College Admin)
const addApplicationNote = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const app = await CollegeApplication.findOne({ _id: id, schoolId: collegeId });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    app.notes.push({
      note,
      counselorName: req.school.name,
      date: new Date()
    });

    await app.save();
    return res.json({ success: true, message: 'Note added successfully', data: app });
  } catch (error) {
    console.error('Add note error:', error);
    return res.status(500).json({ success: false, message: 'Server error adding note' });
  }
};

// @desc    Get public departments for college
// @route   GET /api/v1/college/public/departments/:collegeId
// @access  Public
const getPublicDepartments = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const config = await CollegeAcademicConfig.findOne({ schoolId: collegeId }).populate('selectedDepartments');
    const departments = config ? config.selectedDepartments : [];
    return res.json({ success: true, data: departments });
  } catch (error) {
    console.error('Public departments error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching departments' });
  }
};

// @desc    Get public courses for college
// @route   GET /api/v1/college/public/courses/:collegeId
// @access  Public
const getPublicCourses = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const config = await CollegeAcademicConfig.findOne({ schoolId: collegeId }).populate({
      path: 'selectedCourses',
      populate: { path: 'departmentId', select: 'name code' }
    });
    const courses = config ? config.selectedCourses : [];
    return res.json({ success: true, data: courses });
  } catch (error) {
    console.error('Public courses error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching courses' });
  }
};

// @desc    Get public specializations for college
// @route   GET /api/v1/college/public/specializations/:collegeId
// @access  Public
const getPublicSpecializations = async (req, res) => {
  try {
    const { collegeId } = req.params;
    const config = await CollegeAcademicConfig.findOne({ schoolId: collegeId }).populate('selectedSpecializations');
    const specializations = config ? config.selectedSpecializations : [];
    return res.json({ success: true, data: specializations });
  } catch (error) {
    console.error('Public specializations error:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching specializations' });
  }
};

module.exports = {
  getApplications,
  getApplicationById,
  submitApplication,
  updateApplicationStage,
  verifyDocument,
  addApplicationNote,
  getPublicDepartments,
  getPublicCourses,
  getPublicSpecializations
};
