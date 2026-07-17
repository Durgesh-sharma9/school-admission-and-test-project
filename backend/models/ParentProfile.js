const mongoose = require('mongoose');

const parentProfileSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
  },
  parentName: {
    type: String,
    required: true,
    trim: true,
  },
  whatsapp: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  state: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  area: {
    type: String,
    trim: true,
    default: '',
  },
  society: {
    type: String,
    trim: true,
    default: '',
  },
  fullAddress: {
    type: String,
    trim: true,
    default: '',
  }
}, {
  timestamps: true,
});

// Ensure compound index for unique parent mobile under each school
parentProfileSchema.index({ schoolId: 1, mobile: 1 }, { unique: true });

module.exports = mongoose.model('ParentProfile', parentProfileSchema);
