const QRCode = require('qrcode');

/**
 * Generates a permanent QR code data URL pointing to the school's public admission form.
 * @param {string} schoolId - The unique school ID.
 * @returns {Promise<{ qrCodeUrl: string, admissionFormLink: string }>}
 */
const generateSchoolQrCode = async (schoolId) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const admissionFormLink = `${frontendUrl}/public/admission/${schoolId}`;

  try {
    // Generate base64 data URI of the QR Code
    const qrCodeUrl = await QRCode.toDataURL(admissionFormLink, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 400,
      color: {
        dark: '#4f46e5', // indigo-600 color theme
        light: '#ffffff'
      }
    });

    return { qrCodeUrl, admissionFormLink };
  } catch (error) {
    console.error('Error generating QR Code:', error);
    throw new Error('Failed to generate permanent QR Code');
  }
};

module.exports = { generateSchoolQrCode };
