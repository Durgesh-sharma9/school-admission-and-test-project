const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  enquiryId: {
    type: String,
    required: true,
    unique: true, // Must be unique across all enquiries
  },
  
  // Student Information
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: ['Male', 'Female', 'Other'],
  },
  dob: {
    type: Date,
    required: [true, 'Date of Birth is required'],
  },
  classSeeking: {
    type: String,
    required: [true, 'Class seeking admission is required'],
    trim: true,
  },
  currentSchool: {
    type: String,
    trim: true,
    default: '',
  },
  currentClass: {
    type: String,
    trim: true,
    default: '',
  },
  previousSchool: {
    type: String,
    required: [true, 'Previous school is required'],
    trim: true,
  },
  previousClass: {
    type: String,
    required: [true, 'Previous class is required'],
    trim: true,
  },

  // Parent Information
  parentName: {
    type: String,
    required: [true, 'Parent / Guardian name is required'],
    trim: true,
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
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

  // Address
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  area: {
    type: String,
    required: [true, 'Area / Locality is required'],
    trim: true,
  },
  localityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Locality',
    default: null,
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
  },

  // Expectations & Source
  source: {
    type: String,
    required: [true, 'Source (Where did you hear about us?) is required'],
    trim: true,
  },
  sourceOtherSpecify: {
    type: String,
    trim: true,
    default: '',
  },
  expectations: {
    type: String,
    trim: true,
    default: '',
  },

  // Additional Info
  notes: {
    type: String,
    trim: true,
    default: '',
  },

  // Metadata
  status: {
    type: String,
    enum: ['New Enquiry', 'Hold', 'Not Interested', 'Admission Confirmed'],
    default: 'New Enquiry',
  },
  
  // Date and Time saved as strings for reports/easy filtering
  saveDate: {
    type: String, // YYYY-MM-DD
    required: true,
  },
  saveTime: {
    type: String, // HH:mm:ss
    required: true,
  },

  // Conversion Architecture (Ready for Phase 2)
  isConvertedToAdmission: {
    type: Boolean,
    default: false,
  },
  convertedAt: {
    type: Date,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

enquirySchema.pre('validate', function(next) {
  if (this.currentSchool && !this.previousSchool) {
    this.previousSchool = this.currentSchool;
  }
  if (this.currentClass && !this.previousClass) {
    this.previousClass = this.currentClass;
  }
  if (this.source === 'Other' && (!this.sourceOtherSpecify || this.sourceOtherSpecify.trim() === '')) {
    this.invalidate('sourceOtherSpecify', 'Please specify details for other source');
  }
  next();
});

module.exports = mongoose.model('Enquiry', enquirySchema);
