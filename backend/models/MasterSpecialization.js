const mongoose = require('mongoose');

const masterSpecializationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Specialization name is required'],
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterCourse',
    required: [true, 'Course reference is required']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

masterSpecializationSchema.index({ name: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('MasterSpecialization', masterSpecializationSchema);
