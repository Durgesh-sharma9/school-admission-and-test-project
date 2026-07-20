const mongoose = require('mongoose');

const localitySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: [true, 'Locality name is required'],
    trim: true,
  },
  nameLower: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
  },
  isApproved: {
    type: Boolean,
    default: true, // true for Admin created, false for Parent/Auto suggested
  },
  createdBy: {
    type: String,
    enum: ['admin', 'parent'],
    default: 'admin',
  },
  timesUsed: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Ensure duplicate locality names are prevented per school (case-insensitive)
localitySchema.index({ schoolId: 1, nameLower: 1 }, { unique: true });

module.exports = mongoose.model('Locality', localitySchema);
