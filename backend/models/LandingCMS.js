const mongoose = require('mongoose');

const landingCmsSchema = new mongoose.Schema({
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['hero', 'features', 'howItWorks', 'pricing', 'faq', 'testimonials', 'contact', 'footer'],
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LandingCMS', landingCmsSchema);
