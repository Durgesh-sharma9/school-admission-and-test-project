const mongoose = require('mongoose');

const academicMasterRequestSchema = new mongoose.Schema({
  collegeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  requestedBy: {
    type: String,
    required: true,
    trim: true
  },
  requestType: {
    type: String,
    enum: ['Department', 'Course', 'Specialization'],
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterDepartment',
    default: null
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterCourse',
    default: null
  },
  departmentName: {
    type: String,
    trim: true,
    default: ''
  },
  courseName: {
    type: String,
    trim: true,
    default: ''
  },
  courseCode: {
    type: String,
    trim: true,
    default: ''
  },
  specializationName: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: String,
    trim: true,
    default: ''
  },
  reason: {
    type: String,
    required: [true, 'Reason for requesting master record is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  adminRemarks: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AcademicMasterRequest', academicMasterRequestSchema);
