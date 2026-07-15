const School = require('../models/School');
const { uploadFile, deleteFile } = require('../services/uploadService');
const bcrypt = require('bcryptjs');

// @desc    Update School Details Settings
// @route   PUT /api/v1/settings
// @access  Private (School Admin)
const updateSettings = async (req, res) => {
  try {
    const { name, phone, address, logo } = req.body;

    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // If logo has changed and there was an old logo, delete the old logo file
    if (logo !== undefined && school.logo && school.logo !== logo) {
      await deleteFile(school.logo);
    }

    if (name) school.name = name;
    if (phone) school.phone = phone;
    if (address) school.address = address;
    if (logo !== undefined) school.logo = logo;

    await school.save();

    return res.json({
      success: true,
      message: 'School settings updated successfully',
      school: {
        id: school._id,
        name: school.name,
        email: school.email,
        phone: school.phone,
        address: school.address,
        logo: school.logo,
        qrCodeUrl: school.qrCodeUrl,
        admissionFormLink: school.admissionFormLink,
        subscription: school.subscription,
        thankYouCms: school.thankYouCms,
        settings: school.settings,
        communicationTemplates: school.communicationTemplates,
      },
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating settings' });
  }
};

// @desc    Update Thank You Page CMS configurations
// @route   PUT /api/v1/settings/thankyou-cms
// @access  Private (School Admin)
const updateThankYouCms = async (req, res) => {
  try {
    const { socialLink1, socialLink2, pdfUrl, imageUrl } = req.body;

    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Clean up files if they are replaced or deleted
    if (pdfUrl !== undefined && school.thankYouCms.pdfUrl && school.thankYouCms.pdfUrl !== pdfUrl) {
      await deleteFile(school.thankYouCms.pdfUrl);
    }
    if (imageUrl !== undefined && school.thankYouCms.imageUrl && school.thankYouCms.imageUrl !== imageUrl) {
      await deleteFile(school.thankYouCms.imageUrl);
    }

    // Update object fields
    if (socialLink1 !== undefined) school.thankYouCms.socialLink1 = socialLink1;
    if (socialLink2 !== undefined) school.thankYouCms.socialLink2 = socialLink2;
    if (pdfUrl !== undefined) school.thankYouCms.pdfUrl = pdfUrl;
    if (imageUrl !== undefined) school.thankYouCms.imageUrl = imageUrl;

    await school.save();

    return res.json({
      success: true,
      message: 'Thank You CMS updated successfully',
      thankYouCms: school.thankYouCms,
    });
  } catch (error) {
    console.error('Update CMS error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating CMS' });
  }
};

// @desc    Upload file (Logo, ThankYou PDF, ThankYou image)
// @route   POST /api/v1/settings/upload
// @access  Private (School Admin)
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    // Upload using service
    const fileUrl = await uploadFile(req.file);

    return res.json({
      success: true,
      message: 'File uploaded successfully',
      fileUrl,
    });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ success: false, message: 'Server error during upload: ' + error.message });
  }
};

// @desc    Change admin password
// @route   PUT /api/v1/settings/password
// @access  Private (School Admin)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long' });
    }

    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    // Check current password
    const isMatch = await school.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // Set new password
    school.password = newPassword;
    await school.save();

    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating password' });
  }
};

// @desc    Update spelling validation preference
// @route   PUT /api/v1/settings/spelling
// @access  Private (School Admin)
const updateSpellingSetting = async (req, res) => {
  try {
    const { minorTypingValidation } = req.body;
    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    school.settings = school.settings || {};
    school.settings.minorTypingValidation = !!minorTypingValidation;
    await school.save();

    return res.json({
      success: true,
      message: 'Spelling validation settings updated successfully',
      settings: school.settings,
    });
  } catch (error) {
    console.error('Update spelling settings error:', error);
    return res.status(500).json({ success: false, message: 'Server error updating spelling settings' });
  }
};

// @desc    Save/Add a new communication template
// @route   POST /api/v1/settings/templates
// @access  Private (School Admin)
const addTemplate = async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;

    if (!name || !type || !body) {
      return res.status(400).json({ success: false, message: 'Template name, type, and body are required' });
    }

    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    school.communicationTemplates.push({ name, type, subject: subject || '', body });
    await school.save();

    return res.status(201).json({
      success: true,
      message: 'Template saved successfully',
      templates: school.communicationTemplates,
    });
  } catch (error) {
    console.error('Add template error:', error);
    return res.status(500).json({ success: false, message: 'Server error saving template' });
  }
};

// @desc    Delete a communication template
// @route   DELETE /api/v1/settings/templates/:templateId
// @access  Private (School Admin)
const deleteTemplate = async (req, res) => {
  try {
    const school = await School.findById(req.school.id);
    if (!school) {
      return res.status(404).json({ success: false, message: 'School not found' });
    }

    school.communicationTemplates = school.communicationTemplates.filter(
      t => t._id.toString() !== req.params.templateId
    );
    await school.save();

    return res.json({
      success: true,
      message: 'Template deleted successfully',
      templates: school.communicationTemplates,
    });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting template' });
  }
};

module.exports = {
  updateSettings,
  updateThankYouCms,
  uploadMedia,
  changePassword,
  updateSpellingSetting,
  addTemplate,
  deleteTemplate,
};
