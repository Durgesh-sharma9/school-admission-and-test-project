const mongoose = require('mongoose');

const masterCourseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Course code is required'],
    trim: true,
    uppercase: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterDepartment',
    required: [true, 'Department reference is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound unique key to allow same course code across different departments if needed, but otherwise unique
masterCourseSchema.index({ code: 1, departmentId: 1 }, { unique: true });

module.exports = mongoose.model('MasterCourse', masterCourseSchema);
