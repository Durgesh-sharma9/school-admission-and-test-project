const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'platform_settings'
  },
  applicationName: {
    type: String,
    default: 'School Admission CRM'
  },
  applicationLogo: {
    type: String,
    default: ''
  },
  smtpHost: {
    type: String,
    default: 'smtp.gmail.com'
  },
  smtpPort: {
    type: String,
    default: '587'
  },
  smtpUser: {
    type: String,
    default: 'noreply@schoolcrm.com'
  },
  smtpPassword: {
    type: String,
    default: ''
  },
  smtpFrom: {
    type: String,
    default: 'noreply@schoolcrm.com'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
