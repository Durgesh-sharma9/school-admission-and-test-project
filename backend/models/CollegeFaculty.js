const mongoose = require('mongoose');

const collegeFacultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Faculty name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Faculty email is required'],
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    default: '',
    trim: true,
  },
  designation: {
    type: String,
    required: [true, 'Designation is required'],
    trim: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeDepartment',
    required: [true, 'Department is required'],
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeFaculty', collegeFacultySchema);
