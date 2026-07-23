const AcademicMasterRequest = require('../models/AcademicMasterRequest');
const MasterDepartment = require('../models/MasterDepartment');
const MasterCourse = require('../models/MasterCourse');
const MasterSpecialization = require('../models/MasterSpecialization');
const createNotification = require('../utils/createNotification');

// ==========================================
// College Admin Actions
// ==========================================

const submitRequest = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const requestedBy = req.school.name;
    const {
      requestType,
      departmentId,
      courseId,
      departmentName,
      courseName,
      courseCode,
      specializationName,
      duration,
      reason
    } = req.body;

    if (!requestType || !reason) {
      return res.status(400).json({ success: false, message: 'Request Type and Reason are required' });
    }

    // Validation checks based on Request Type
    if (requestType === 'Department') {
      if (!departmentName) {
        return res.status(400).json({ success: false, message: 'Department Name is required' });
      }

      // Check if already exists in Masters
      const deptCode = (departmentName.substring(0, 4).toUpperCase()).trim();
      const masterExists = await MasterDepartment.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${departmentName.trim()}$`, 'i') } },
          { code: deptCode }
        ]
      });
      if (masterExists) {
        return res.status(400).json({ success: false, message: 'This department already exists in global masters.' });
      }

      // Check if duplicate pending request
      const pendingExists = await AcademicMasterRequest.findOne({
        requestType: 'Department',
        status: 'Pending',
        departmentName: { $regex: new RegExp(`^${departmentName.trim()}$`, 'i') }
      });
      if (pendingExists) {
        return res.status(400).json({ success: false, message: 'A pending request for this department already exists.' });
      }

    } else if (requestType === 'Course') {
      if (!departmentId || !courseName) {
        return res.status(400).json({ success: false, message: 'Existing Department and Course Name are required' });
      }

      // Verify department exists
      const dept = await MasterDepartment.findById(departmentId);
      if (!dept) {
        return res.status(404).json({ success: false, message: 'Department not found' });
      }

      // Check if already exists in Masters under this department
      const generatedCode = courseCode ? courseCode.toUpperCase().trim() : courseName.substring(0, 5).toUpperCase().trim();
      const masterExists = await MasterCourse.findOne({
        departmentId,
        $or: [
          { name: { $regex: new RegExp(`^${courseName.trim()}$`, 'i') } },
          { code: generatedCode }
        ]
      });
      if (masterExists) {
        return res.status(400).json({ success: false, message: 'This course already exists in the selected department.' });
      }

      // Check duplicate pending request
      const pendingExists = await AcademicMasterRequest.findOne({
        requestType: 'Course',
        status: 'Pending',
        departmentId,
        courseName: { $regex: new RegExp(`^${courseName.trim()}$`, 'i') }
      });
      if (pendingExists) {
        return res.status(400).json({ success: false, message: 'A pending request for this course already exists.' });
      }

    } else if (requestType === 'Specialization') {
      if (!departmentId || !courseId || !specializationName) {
        return res.status(400).json({ success: false, message: 'Department, Course and Specialization Name are required' });
      }

      // Verify course exists
      const course = await MasterCourse.findById(courseId);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Selected Course not found' });
      }

      // Check if already exists in Masters
      const masterExists = await MasterSpecialization.findOne({
        courseId,
        name: { $regex: new RegExp(`^${specializationName.trim()}$`, 'i') }
      });
      if (masterExists) {
        return res.status(400).json({ success: false, message: 'This specialization already exists under selected course.' });
      }

      // Check duplicate pending request
      const pendingExists = await AcademicMasterRequest.findOne({
        requestType: 'Specialization',
        status: 'Pending',
        courseId,
        specializationName: { $regex: new RegExp(`^${specializationName.trim()}$`, 'i') }
      });
      if (pendingExists) {
        return res.status(400).json({ success: false, message: 'A pending request for this specialization already exists.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid Request Type' });
    }

    const newRequest = new AcademicMasterRequest({
      collegeId,
      requestedBy,
      requestType,
      departmentId: departmentId || null,
      courseId: courseId || null,
      departmentName: departmentName || '',
      courseName: courseName || '',
      courseCode: courseCode || '',
      specializationName: specializationName || '',
      duration: duration || '',
      reason,
      status: 'Pending'
    });

    await newRequest.save();
    return res.status(201).json({ success: true, message: 'Request submitted successfully!', data: newRequest });
  } catch (error) {
    console.error('Submit request error:', error);
    return res.status(500).json({ success: false, message: 'Server error submitting academic master request' });
  }
};

const getCollegeRequests = async (req, res) => {
  try {
    const collegeId = req.school.id;
    const requests = await AcademicMasterRequest.find({ collegeId })
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Get college requests error:', error);
    return res.status(500).json({ success: false, message: 'Server error loading requests list' });
  }
};


// ==========================================
// Super Admin Actions
// ==========================================

const getSuperAdminRequests = async (req, res) => {
  try {
    const requests = await AcademicMasterRequest.find({})
      .populate('collegeId', 'name code logo')
      .populate('departmentId', 'name code')
      .populate('courseId', 'name code')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: requests });
  } catch (error) {
    console.error('Super Admin requests error:', error);
    return res.status(550).json({ success: false, message: 'Server error loading all requests' });
  }
};

const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await AcademicMasterRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    // Auto-create Master record
    let masterItemName = '';
    if (request.requestType === 'Department') {
      const name = request.departmentName;
      const code = (name.substring(0, 4).toUpperCase()).trim();

      // Check exists
      const exists = await MasterDepartment.findOne({
        $or: [{ name }, { code }]
      });
      if (exists) {
        return res.status(400).json({ success: false, message: 'This master already exists.' });
      }

      const dept = new MasterDepartment({ name, code });
      await dept.save();
      masterItemName = name;

    } else if (request.requestType === 'Course') {
      const name = request.courseName;
      const code = request.courseCode ? request.courseCode.toUpperCase() : name.substring(0, 5).toUpperCase();
      const departmentId = request.departmentId;

      const exists = await MasterCourse.findOne({
        departmentId,
        $or: [{ name }, { code }]
      });
      if (exists) {
        return res.status(400).json({ success: false, message: 'This master already exists.' });
      }

      const course = new MasterCourse({ name, code, departmentId });
      await course.save();
      masterItemName = name;

    } else if (request.requestType === 'Specialization') {
      const name = request.specializationName;
      const courseId = request.courseId;

      const exists = await MasterSpecialization.findOne({ courseId, name });
      if (exists) {
        return res.status(400).json({ success: false, message: 'This master already exists.' });
      }

      const spec = new MasterSpecialization({ name, courseId });
      await spec.save();
      masterItemName = name;
    }

    request.status = 'Approved';
    await request.save();

    // Trigger Notification Log
    await createNotification(
      request.collegeId,
      'Academic Request Approved',
      `Your request to create the ${request.requestType} "${masterItemName}" has been approved by the Super Admin. You can now enable it in settings.`,
      'academic_request'
    );

    return res.json({ success: true, message: 'Request approved and master record created', data: request });
  } catch (error) {
    console.error('Approve request error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error approving request' });
  }
};

const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason for rejection is required' });
    }

    const request = await AcademicMasterRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'Rejected';
    request.adminRemarks = reason;
    await request.save();

    const name = request.requestType === 'Department' ? request.departmentName :
                 request.requestType === 'Course' ? request.courseName : request.specializationName;

    // Trigger Notification Log
    await createNotification(
      request.collegeId,
      'Academic Request Rejected',
      `Your request to create the ${request.requestType} "${name}" was rejected. Reason: ${reason}`,
      'academic_request'
    );

    return res.json({ success: true, message: 'Request rejected successfully', data: request });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ success: false, message: 'Server error rejecting request' });
  }
};

module.exports = {
  submitRequest,
  getCollegeRequests,
  getSuperAdminRequests,
  approveRequest,
  rejectRequest
};
