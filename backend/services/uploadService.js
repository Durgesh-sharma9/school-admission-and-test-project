const ImageKit = require('imagekit');
const fs = require('fs');
const path = require('path');

const isImageKitConfigured = () => {
  return !!(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
  );
};

let imagekit = null;
if (isImageKitConfigured()) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}

/**
 * Uploads a file either to ImageKit (if configured) or saves it locally.
 * @param {Object} file - The file object from multer
 * @returns {Promise<string>} - The url to access the file
 */
const uploadFile = async (file) => {
  if (!file) return '';

  const filePath = file.path;

  if (isImageKitConfigured() && imagekit) {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = file.originalname || path.basename(filePath);

      const result = await imagekit.upload({
        file: fileBuffer,
        fileName: fileName,
        folder: '/school_admission_crm',
      });

      // Delete temporary local file after successful upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return result.url;
    } catch (error) {
      console.error('ImageKit upload error, falling back to local storage:', error);
      // Fallback: If ImageKit upload fails, keep local path
    }
  }

  // Fallback / Default: Return server-relative static path
  const port = process.env.PORT || 5000;
  const serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
  return `${serverUrl}/uploads/${path.basename(filePath)}`;
};

/**
 * Deletes a file if stored on ImageKit or locally.
 * @param {string} fileUrl - The url of the file
 */
const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  if (isImageKitConfigured() && imagekit && (fileUrl.includes('imagekit.io') || fileUrl.includes('ik.imagekit.io'))) {
    try {
      const filename = path.basename(fileUrl.split('?')[0]);
      const files = await imagekit.listFiles({
        searchQuery: `name = "${filename}"`,
      });

      if (files && files.length > 0) {
        await imagekit.deleteFile(files[0].fileId);
      }
    } catch (error) {
      console.error('ImageKit delete error:', error);
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
