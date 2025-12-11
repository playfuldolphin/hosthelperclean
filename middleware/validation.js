// Input Validation Middleware
// Using express-validator for comprehensive validation

const { body, param, validationResult } = require('express-validator');

/**
 * Middleware to check validation results
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

/**
 * Validation rules for creating a checkout session
 */
const validateCheckoutSession = [
  // Property validation
  body('propertyId')
    .notEmpty().withMessage('Property ID is required')
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage('Invalid property ID'),
  
  body('propertyName')
    .notEmpty().withMessage('Property name is required')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Property name must be between 1-255 characters')
    .escape(), // Prevent XSS
  
  // Cleaning type validation
  body('cleaningType')
    .notEmpty().withMessage('Cleaning type is required')
    .isIn(['quick', 'standard', 'deep', 'moveOut'])
    .withMessage('Invalid cleaning type. Must be: quick, standard, deep, or moveOut'),
  
  // Property size validation
  body('propertySize')
    .notEmpty().withMessage('Property size is required')
    .isIn(['studio', 'oneBed', 'twoBed', 'threeBed', 'fourBed', 'fivePlusBed'])
    .withMessage('Invalid property size'),
  
  // Date validation
  body('scheduledDate')
    .notEmpty().withMessage('Scheduled date is required')
    .isISO8601().withMessage('Invalid date format. Use ISO 8601 (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        throw new Error('Scheduled date cannot be in the past');
      }
      
      // Max 1 year in advance
      const maxDate = new Date();
      maxDate.setFullYear(maxDate.getFullYear() + 1);
      
      if (date > maxDate) {
        throw new Error('Scheduled date cannot be more than 1 year in advance');
      }
      
      return true;
    }),
  
  // Time validation (optional)
  body('scheduledTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Invalid time format. Use HH:MM (24-hour format)'),
  
  // User validation
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage('Invalid user ID'),
  
  body('userEmail')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  
  // Cleaner validation (optional)
  body('cleanerId')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 }).withMessage('Invalid cleaner ID'),
  
  // Addons validation
  body('addons')
    .optional()
    .isArray().withMessage('Addons must be an array')
    .custom((addons) => {
      if (addons.length > 20) {
        throw new Error('Maximum 20 addons allowed');
      }
      
      const validAddons = ['laundry', 'oven', 'fridge', 'windows', 'garage', 'patio', 'dishes'];
      
      for (const addon of addons) {
        if (!validAddons.includes(addon)) {
          throw new Error(`Invalid addon: ${addon}`);
        }
      }
      
      return true;
    }),
  
  // Pricing validation (optional checks)
  body('basePrice')
    .optional()
    .isFloat({ min: 0, max: 10000 }).withMessage('Base price must be between $0 and $10,000'),
  
  body('totalPrice')
    .optional()
    .isFloat({ min: 0, max: 10000 }).withMessage('Total price must be between $0 and $10,000'),
  
  handleValidationErrors
];

/**
 * Validation rules for verifying a session
 */
const validateSessionId = [
  param('sessionId')
    .notEmpty().withMessage('Session ID is required')
    .matches(/^cs_test_[a-zA-Z0-9]+$|^cs_live_[a-zA-Z0-9]+$/)
    .withMessage('Invalid Stripe session ID format'),
  
  handleValidationErrors
];

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  
  body('fullName')
    .notEmpty().withMessage('Full name is required')
    .trim()
    .isLength({ min: 2, max: 255 }).withMessage('Name must be between 2-255 characters')
    .escape(),
  
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  
  handleValidationErrors
];

/**
 * Validation rules for user login
 */
const validateUserLogin = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a property
 */
const validateProperty = [
  body('name')
    .notEmpty().withMessage('Property name is required')
    .trim()
    .isLength({ min: 1, max: 255 }).withMessage('Name must be between 1-255 characters')
    .escape(),
  
  body('address')
    .notEmpty().withMessage('Address is required')
    .trim()
    .isLength({ min: 5, max: 500 }).withMessage('Address must be between 5-500 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('City name too long')
    .escape(),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('State name too long')
    .escape(),
  
  body('zipCode')
    .optional()
    .matches(/^\d{5}(-\d{4})?$/)
    .withMessage('Invalid ZIP code format'),
  
  body('propertyType')
    .notEmpty().withMessage('Property type is required')
    .isIn(['studio', 'oneBed', 'twoBed', 'threeBed', 'fourBed', 'fivePlusBed'])
    .withMessage('Invalid property type'),
  
  body('bedrooms')
    .optional()
    .isInt({ min: 0, max: 20 }).withMessage('Bedrooms must be between 0-20'),
  
  body('bathrooms')
    .optional()
    .isFloat({ min: 0, max: 20 }).withMessage('Bathrooms must be between 0-20'),
  
  handleValidationErrors
];

/**
 * Validation rules for creating a review
 */
const validateReview = [
  body('bookingId')
    .notEmpty().withMessage('Booking ID is required'),
  
  body('rating')
    .notEmpty().withMessage('Rating is required')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1-5 stars'),
  
  body('reviewText')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Review must be less than 2000 characters')
    .escape(),
  
  handleValidationErrors
];

/**
 * Sanitize HTML to prevent XSS
 */
const sanitizeHtml = (html) => {
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Validate UUID format
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

module.exports = {
  validateCheckoutSession,
  validateSessionId,
  validateUserRegistration,
  validateUserLogin,
  validateProperty,
  validateReview,
  handleValidationErrors,
  sanitizeHtml,
  isValidUUID
};
