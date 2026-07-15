const Enquiry = require('../models/Enquiry');

/**
 * Generates a unique sequential Enquiry ID for a school.
 * Format: ENQ-YYYY-XXXX (e.g., ENQ-2026-0001)
 */
const generateEnquiryId = async () => {
  const currentYear = new Date().getFullYear();
  const yearString = currentYear.toString();

  // Find the latest enquiry for the current year
  const latestEnquiry = await Enquiry.findOne({
    enquiryId: new RegExp(`^ENQ-${yearString}-`)
  })
  .sort({ createdAt: -1 })
  .exec();

  let nextSequenceNum = 1;

  if (latestEnquiry) {
    // Extract the sequence number from the latest enquiryId (e.g. ENQ-2026-0012 -> 0012)
    const idParts = latestEnquiry.enquiryId.split('-');
    if (idParts.length === 3) {
      const lastSequence = parseInt(idParts[2], 10);
      if (!isNaN(lastSequence)) {
        nextSequenceNum = lastSequence + 1;
      }
    }
  }

  // Format the sequence number to 4 digits (e.g. 0001, 0012, 0123)
  const paddedSequence = String(nextSequenceNum).padStart(4, '0');
  return `ENQ-${yearString}-${paddedSequence}`;
};

module.exports = generateEnquiryId;
