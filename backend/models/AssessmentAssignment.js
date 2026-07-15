const mongoose = require('mongoose');

const studentAnswerSchema = new mongoose.Schema({
  sectionIndex: {
    type: Number,
    required: true,
  },
  questionIndex: {
    type: Number,
    required: true,
  },
  questionId: {
    type: String,
    required: true,
  },
  answerText: {
    type: String,
    default: '',
  },
  isCorrect: {
    type: Boolean,
  },
  marksAwarded: {
    type: Number,
    default: 0,
  },
  adminComments: {
    type: String,
    default: '',
  },
});

const assessmentAssignmentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  enquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Enquiry',
    required: true,
  },
  assessmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assessment',
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed'],
    default: 'Pending',
  },
  startTime: {
    type: Date,
  },
  submittedAt: {
    type: Date,
  },
  timeTaken: {
    type: Number, // duration of exam in seconds
    default: 0,
  },
  answers: [studentAnswerSchema],
  totalScore: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  isEvaluated: {
    type: Boolean,
    default: false, // will turn true when descriptive answers are graded (or if there are none)
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('AssessmentAssignment', assessmentAssignmentSchema);
