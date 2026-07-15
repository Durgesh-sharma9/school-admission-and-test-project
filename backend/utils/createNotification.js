const Notification = require('../models/Notification');

/**
 * Creates and saves an admin notification alert.
 * @param {string} schoolId - School owner ID
 * @param {string} title - Short alert title
 * @param {string} message - Descriptive log content
 * @param {string} type - Notification category type
 */
const createNotification = async (schoolId, title, message, type) => {
  try {
    const notification = new Notification({
      schoolId,
      title,
      message,
      type,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to register notification log:', error);
  }
};

module.exports = createNotification;
