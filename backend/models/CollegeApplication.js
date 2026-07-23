const mongoose = require('mongoose');

const collegeApplicationSchema = new mongoose.Schema({
  applicationId: {
    type: String,
    unique: true,
    required: true,
  },
  // Student Information
  studentName: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  dob: {
    type: Date,
    required: [true, 'Date of birth is required'],
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required'],
  },
  mobile: {
    type: String,
    required: [true, 'Student mobile number is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Student email is required'],
    trim: true,
    lowercase: true,
  },
  aadhaar: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    trim: true,
  },
  nationality: {
    type: String,
    default: 'Indian',
    trim: true,
  },

  // Parent Information
  fatherName: {
    type: String,
    trim: true,
  },
  motherName: {
    type: String,
    trim: true,
  },
  parentName: {
    type: String,
    required: [true, 'Guardian name is required'],
    trim: true,
  },
  parentMobile: {
    type: String,
    required: [true, 'Parent contact number is required'],
    trim: true,
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true,
  },
  parentOccupation: {
    type: String,
    trim: true,
  },

  // Address
  state: {
    type: String,
    trim: true,
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
  },
  pinCode: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  area: {
    type: String,
    default: '',
    trim: true,
  },

  // Academic History
  tenthBoard: {
    type: String,
    required: [true, '10th Board is required'],
    trim: true,
  },
  tenthPercentage: {
    type: Number,
    required: [true, '10th Percentage is required'],
  },
  tenthYear: {
    type: Number,
    required: [true, '10th passing year is required'],
  },
  twelfthBoard: {
    type: String,
    required: [true, '12th Board is required'],
    trim: true,
  },
  twelfthPercentage: {
    type: Number,
    required: [true, '12th Percentage is required'],
  },
  twelfthYear: {
    type: Number,
    required: [true, '12th passing year is required'],
  },
  graduationPercentage: {
    type: Number,
  },
  graduationDegree: {
    type: String,
    trim: true,
  },
  graduationYear: {
    type: Number,
  },
  entranceExam: {
    type: String,
    trim: true,
  },
  entranceScore: {
    type: Number,
  },

  // Admission details
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterDepartment',
    required: [true, 'Department selection is required'],
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MasterCourse',
    required: [true, 'Course selection is required'],
  },
  specialization: {
    type: String,
    default: '',
    trim: true,
  },
  session: {
    type: String,
    default: '2026-2027',
    trim: true,
  },
  modeOfStudy: {
    type: String,
    enum: ['Regular', 'Distance'],
    default: 'Regular',
  },
  hostelRequired: {
    type: Boolean,
    default: false,
  },
  transportRequired: {
    type: Boolean,
    default: false,
  },
  scholarshipApplied: {
    type: Boolean,
    default: false,
  },
  referralSource: {
    type: String,
    trim: true,
  },

  // Document Uploads
  documents: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    }
  }],

  // Fee Details
  feeAmountPaid: {
    type: Number,
    default: 0,
  },
  discountApplied: {
    type: Number,
    default: 0,
  },
  scholarshipAmount: {
    type: Number,
    default: 0,
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Online', 'Demand Draft', 'Bank Transfer'],
    default: 'Online',
  },
  transactionId: {
    type: String,
    default: '',
  },
  receiptUrl: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Failed'],
    default: 'Pending',
  },
  paymentDate: {
    type: Date,
  },

  // Pipeline Stages
  stage: {
    type: String,
    enum: [
      'Counselling Assigned',
      'Call Scheduled',
      'Call Completed',
      'Campus Visit',
      'Documents Pending',
      'Documents Verified',
      'Selected',
      'Rejected',
      'Admission Confirmed'
    ],
    default: 'Counselling Assigned',
  },
  notes: [{
    note: { type: String, required: true },
    date: { type: Date, default: Date.now },
    counselorName: { type: String, default: 'System' }
  }],
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CollegeApplication', collegeApplicationSchema);
