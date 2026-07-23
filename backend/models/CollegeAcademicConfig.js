const mongoose = require('mongoose');

const collegeAcademicConfigSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    unique: true
  },
  selectedDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterDepartment'
  }],
  selectedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterCourse'
  }],
  selectedSpecializations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterSpecialization'
  }],
  selectedSessions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterAdmissionSession'
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeAcademicConfig', collegeAcademicConfigSchema);
