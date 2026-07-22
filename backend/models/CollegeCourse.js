const mongoose = require('mongoose');

const collegeCourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true,
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeDepartment',
    required: [true, 'Department is required'],
  },
  duration: {
    type: Number,
    required: [true, 'Course duration in years is required'],
    default: 3,
  },
  eligibility: {
    type: String,
    default: '',
    trim: true,
  },
  feesPerYear: {
    type: Number,
    required: [true, 'Fees per year is required'],
    default: 0,
  },
  specializations: {
    type: [String],
    default: [],
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeCourse', collegeCourseSchema);
