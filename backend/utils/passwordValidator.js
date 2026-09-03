/**
 * Simplified Password Policy Validator:
 * - Minimum 8 characters
 * - Must contain alphabets (a-z, A-Z)
 * - Must contain numeric values (0-9)
 */
const validatePasswordPolicy = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain letters/alphabets (a-z, A-Z)'
    };
  }

  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number (0-9)'
    };
  }

  return {
    isValid: true
  };
};

module.exports = {
  validatePasswordPolicy
};
