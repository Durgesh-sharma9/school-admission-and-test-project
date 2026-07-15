const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['MCQ', 'One Word', 'True / False', 'Fill Blank', 'Descriptive'],
    required: [true, 'Question type is required'],
  },
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  options: {
    type: [String],
    default: undefined, // Only utilized for MCQ
  },
  correctAnswer: {
    type: String,
    trim: true,
  },
  marks: {
    type: Number,
    required: [true, 'Marks are required'],
    min: [1, 'Marks must be at least 1'],
  },
  referenceAnswer: {
    type: String,
    trim: true,
    default: '',
  },
});

const sectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true,
  },
  questions: [questionSchema],
});

const assessmentSchema = new mongoose.Schema({
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Assessment name is required'],
    trim: true,
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
  },
  duration: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  instructions: {
    type: String,
    default: '',
  },
  sections: [sectionSchema],
  totalMarks: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Auto-calculate summary totals before saving
assessmentSchema.pre('save', function (next) {
  let marks = 0;
  let questionsCount = 0;
  
  if (this.sections && this.sections.length > 0) {
    this.sections.forEach(sec => {
      if (sec.questions && sec.questions.length > 0) {
        questionsCount += sec.questions.length;
        sec.questions.forEach(q => {
          marks += q.marks || 0;
        });
      }
    });
  }
  
  this.totalMarks = marks;
  this.totalQuestions = questionsCount;
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
