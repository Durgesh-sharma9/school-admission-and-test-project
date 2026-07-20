const mongoose = require('mongoose');

const ReadReceiptSchema = new mongoose.Schema({
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  readAt: {
    type: Date,
    default: Date.now,
  },
  acknowledgedAt: {
    type: Date,
  },
});

const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
    },
    category: {
      type: String,
      enum: ['Information', 'Update', 'Maintenance', 'Feature', 'Security', 'Billing', 'Emergency'],
      default: 'Information',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    targetType: {
      type: String,
      enum: ['all', 'selected'],
      default: 'all',
    },
    targetSchools: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
      },
    ],
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sent', 'expired'],
      default: 'sent',
    },
    sendType: {
      type: String,
      enum: ['now', 'later'],
      default: 'now',
    },
    scheduledAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    attachment: {
      url: String,
      filename: String,
      fileType: String,
    },
    requireAcknowledgement: {
      type: Boolean,
      default: false,
    },
    readReceipts: [ReadReceiptSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SuperAdmin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);
