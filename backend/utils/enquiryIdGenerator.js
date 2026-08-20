const Enquiry = require('../models/Enquiry');

/**
 * Generates a unique sequential Enquiry ID for a school.
 * Format: ENQ-YYYY-XXXX (e.g., ENQ-2026-0001)
 */
const generateEnquiryId = async () => {
  const currentYear = new Date().getFullYear();
  const yearString = currentYear.toString();

  // Find all existing enquiry IDs for current year to calculate maximum sequence
  const enquiries = await Enquiry.find(
    { enquiryId: new RegExp(`^ENQ-${yearString}-`) },
    { enquiryId: 1 }
  ).lean();

  let maxSequence = 0;
  for (const enq of enquiries) {
    if (enq.enquiryId) {
      const parts = enq.enquiryId.split('-');
      if (parts.length === 3) {
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxSequence) {
          maxSequence = num;
        }
      }
    }
  }

  let nextSeq = maxSequence + 1;
  let candidateId = `ENQ-${yearString}-${String(nextSeq).padStart(4, '0')}`;

  // Ensure 100% collision-free ID generation
  while (await Enquiry.exists({ enquiryId: candidateId })) {
    nextSeq += 1;
    candidateId = `ENQ-${yearString}-${String(nextSeq).padStart(4, '0')}`;
  }

  return candidateId;
};

module.exports = generateEnquiryId;
