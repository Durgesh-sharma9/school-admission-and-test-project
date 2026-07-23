const mongoose = require('mongoose');

const masterAdmissionSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Session name is required'],
    trim: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MasterAdmissionSession', masterAdmissionSessionSchema);
