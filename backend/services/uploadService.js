const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configure Cloudinary if available
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file either to Cloudinary (if credentials are present) or saves it locally.
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - The url to access the file
 */
const uploadFile = async (file) => {
  if (!file) return '';

  const filePath = file.path;

  if (isCloudinaryConfigured()) {
    try {
      const isPdf = path.extname(file.originalname).toLowerCase() === '.pdf';
      const options = {
        folder: 'school_admission_crm',
        resource_type: isPdf ? 'raw' : 'image',
      };

      const result = await cloudinary.uploader.upload(filePath, options);
      
      // Delete temporary local file
      fs.unlinkSync(filePath);
      
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error, falling back to local storage:', error);
      // Fallback: If Cloudinary fails, use the local path instead of crashing
    }
  }

  // Fallback / Default: Return server-relative static path
  // In Express, we'll serve the '../public' folder as static files
  // e.g. http://localhost:5000/uploads/file.png
  const port = process.env.PORT || 5000;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
  return `${serverUrl}/uploads/${path.basename(filePath)}`;
};

/**
 * Deletes a file if stored locally or on Cloudinary.
 * @param {string} fileUrl - The url of the file
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (isCloudinaryConfigured() && fileUrl.includes('cloudinary.com')) {
    try {
      // Extract public_id from Cloudinary URL
      // Format: .../upload/v1234567/folder/public_id.ext
      const parts = fileUrl.split('/');
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      const filenameWithoutExt = lastPart.split('.')[0];
      const publicId = `school_admission_crm/${filenameWithoutExt}`;

      // Check resource type
      const isPdf = fileUrl.endsWith('.pdf');
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isPdf ? 'raw' : 'image',
      });
    } catch (error) {
      console.error('Cloudinary delete error:', error);
    }
  } else {
    // Local delete
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(__dirname, '../public/uploads', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Local file delete error:', error);
    }
  }
};

module.exports = {
  uploadFile,
  deleteFile,
};
