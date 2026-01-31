import { Request, Response, NextFunction } from 'express';
import { body, validationResult, ValidationChain } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { EXPENSE_CATEGORIES } from '../types';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: 'path' in err ? err.path : 'unknown',
      message: err.msg,
    }));
    throw new ValidationError(formattedErrors);
  }

  next();
};

/**
 * Alias for handleValidationErrors for cleaner route definitions
 */
export const validate = handleValidationErrors;

/**
 * Validation rules for user registration
 */
export const registerValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('Email must be less than 255 characters'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),

  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),

  body('tax_filing_status')
    .optional()
    .isIn(['single', 'married_joint', 'married_separate', 'head_of_household'])
    .withMessage('Invalid tax filing status'),
];

/**
 * Validation rules for user login
 */
export const loginValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Validation rules for password reset request
 */
export const forgotPasswordValidation: ValidationChain[] = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
];

/**
 * Validation rules for password reset
 */
export const resetPasswordValidation: ValidationChain[] = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

/**
 * Validation rules for manual expense entry
 */
export const manualExpenseValidation: ValidationChain[] = [
  body('expense_date')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  body('merchant')
    .trim()
    .notEmpty()
    .withMessage('Merchant/description is required')
    .isLength({ max: 255 })
    .withMessage('Merchant must be less than 255 characters'),

  body('amount')
    .isFloat({ min: 0.01, max: 50000 })
    .withMessage('Amount must be between $0.01 and $50,000'),

  body('category')
    .isIn(EXPENSE_CATEGORIES)
    .withMessage('Please select a valid expense category'),

  body('is_business')
    .optional()
    .isBoolean()
    .withMessage('is_business must be a boolean'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  body('receipt_photo_url')
    .optional()
    .isURL({ protocols: ['https'] })
    .withMessage('Receipt photo URL must be a valid HTTPS URL'),
];

/**
 * Validation rules for updating user profile
 */
export const updateProfileValidation: ValidationChain[] = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),

  body('tax_filing_status')
    .optional()
    .isIn(['single', 'married_joint', 'married_separate', 'head_of_household'])
    .withMessage('Invalid tax filing status'),

  body('marginal_tax_rate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Marginal tax rate must be between 0 and 50'),

  body('w2_withholding_annual')
    .optional()
    .isFloat({ min: 0, max: 1000000 })
    .withMessage('W2 withholding must be between 0 and 1,000,000'),
];

/**
 * Validation rules for notification preferences update
 */
export const notificationPreferencesValidation: ValidationChain[] = [
  body('push_enabled')
    .optional()
    .isBoolean()
    .withMessage('push_enabled must be a boolean'),

  body('email_enabled')
    .optional()
    .isBoolean()
    .withMessage('email_enabled must be a boolean'),

  body('threshold_alerts')
    .optional()
    .isBoolean()
    .withMessage('threshold_alerts must be a boolean'),

  body('deadline_reminders')
    .optional()
    .isBoolean()
    .withMessage('deadline_reminders must be a boolean'),

  body('weekly_digest')
    .optional()
    .isBoolean()
    .withMessage('weekly_digest must be a boolean'),

  body('transaction_review')
    .optional()
    .isBoolean()
    .withMessage('transaction_review must be a boolean'),

  body('quiet_hours_start')
    .optional({ nullable: true })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('quiet_hours_start must be in HH:MM format (e.g., "22:00")'),

  body('quiet_hours_end')
    .optional({ nullable: true })
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('quiet_hours_end must be in HH:MM format (e.g., "08:00")'),
];

/**
 * Validation rules for onboarding status update
 */
export const onboardingValidation: ValidationChain[] = [
  body('onboarding_step')
    .optional()
    .isInt({ min: 0, max: 10 })
    .withMessage('onboarding_step must be an integer between 0 and 10'),

  body('onboarding_completed')
    .optional()
    .isBoolean()
    .withMessage('onboarding_completed must be a boolean'),

  body('primary_platform')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('primary_platform must be less than 50 characters'),
];

/**
 * Validation rules for transaction categorization update
 */
export const transactionUpdateValidation: ValidationChain[] = [
  body('category_id')
    .optional()
    .isUUID()
    .withMessage('category_id must be a valid UUID'),

  body('is_business')
    .optional()
    .isBoolean()
    .withMessage('is_business must be a boolean'),

  body('business_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('business_percentage must be between 0 and 100'),

  body('reviewed_by_user')
    .optional()
    .isBoolean()
    .withMessage('reviewed_by_user must be a boolean'),

  body('is_excluded')
    .optional()
    .isBoolean()
    .withMessage('is_excluded must be a boolean'),

  body('exclude_reason')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('exclude_reason must be less than 255 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('notes must be less than 1000 characters'),
];

// =============================================================================
// EXPENSE VALIDATIONS (Sprint 3)
// =============================================================================

/**
 * Validation rules for creating a manual expense
 */
export const createExpenseValidation: ValidationChain[] = [
  body('expense_date')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  body('merchant')
    .trim()
    .notEmpty()
    .withMessage('Merchant/description is required')
    .isLength({ max: 255 })
    .withMessage('Merchant must be less than 255 characters'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Amount must be between $0.01 and $100,000'),

  body('category_name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name must be less than 100 characters'),

  body('category_id')
    .optional()
    .isUUID()
    .withMessage('category_id must be a valid UUID'),

  body('is_business')
    .optional()
    .isBoolean()
    .withMessage('is_business must be a boolean'),

  body('business_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('business_percentage must be between 0 and 100'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  body('payment_method')
    .optional()
    .trim()
    .isIn(['cash', 'card', 'check', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),

  body('receipt_photo_url')
    .optional()
    .isURL()
    .withMessage('Receipt photo URL must be a valid URL'),
];

/**
 * Validation rules for creating a mileage expense
 */
export const createMileageExpenseValidation: ValidationChain[] = [
  body('expense_date')
    .notEmpty()
    .withMessage('Expense date is required')
    .isISO8601()
    .withMessage('Please provide a valid date')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (date > today) {
        throw new Error('Expense date cannot be in the future');
      }
      return true;
    }),

  body('miles')
    .notEmpty()
    .withMessage('Miles is required')
    .isFloat({ min: 0.1, max: 10000 })
    .withMessage('Miles must be between 0.1 and 10,000'),

  body('business_purpose')
    .trim()
    .notEmpty()
    .withMessage('Business purpose is required')
    .isLength({ max: 255 })
    .withMessage('Business purpose must be less than 255 characters'),

  body('start_location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Start location must be less than 255 characters'),

  body('end_location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('End location must be less than 255 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
];

/**
 * Validation rules for updating an expense
 */
export const updateExpenseValidation: ValidationChain[] = [
  body('expense_date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('merchant')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Merchant must be between 1 and 255 characters'),

  body('amount')
    .optional()
    .isFloat({ min: 0.01, max: 100000 })
    .withMessage('Amount must be between $0.01 and $100,000'),

  body('category_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category name must be less than 100 characters'),

  body('category_id')
    .optional()
    .isUUID()
    .withMessage('category_id must be a valid UUID'),

  body('is_business')
    .optional()
    .isBoolean()
    .withMessage('is_business must be a boolean'),

  body('business_percentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('business_percentage must be between 0 and 100'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),

  body('payment_method')
    .optional()
    .trim()
    .isIn(['cash', 'card', 'check', 'bank_transfer', 'other'])
    .withMessage('Invalid payment method'),

  body('receipt_photo_url')
    .optional()
    .isURL()
    .withMessage('Receipt photo URL must be a valid URL'),
];

/**
 * Validation rules for receipt data
 */
export const receiptDataValidation: ValidationChain[] = [
  body('receipt_photo_url')
    .notEmpty()
    .withMessage('Receipt photo URL is required')
    .isURL()
    .withMessage('Receipt photo URL must be a valid URL'),

  body('receipt_thumbnail_url')
    .optional()
    .isURL()
    .withMessage('Receipt thumbnail URL must be a valid URL'),

  body('ocr_raw_text')
    .optional()
    .isString()
    .withMessage('OCR raw text must be a string'),

  body('ocr_confidence')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('OCR confidence must be between 0 and 1'),

  body('ocr_extracted_data')
    .optional()
    .isObject()
    .withMessage('OCR extracted data must be an object'),

  body('ocr_extracted_data.merchant')
    .optional()
    .isString()
    .withMessage('Merchant must be a string'),

  body('ocr_extracted_data.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number'),

  body('ocr_extracted_data.date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid ISO date'),
];

// =============================================================================
// TAX VALIDATIONS (Sprint 3)
// =============================================================================

/**
 * Validation rules for tax calculation query parameters
 */
export const taxCalculationValidation: ValidationChain[] = [
  body('tax_year')
    .optional()
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Tax year must be between 2020 and 2030'),

  body('quarter')
    .optional()
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4'),
];

/**
 * Validation rules for recording estimated tax payment
 */
export const recordPaymentValidation: ValidationChain[] = [
  body('tax_year')
    .notEmpty()
    .withMessage('Tax year is required')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Tax year must be between 2020 and 2030'),

  body('quarter')
    .notEmpty()
    .withMessage('Quarter is required')
    .isInt({ min: 1, max: 4 })
    .withMessage('Quarter must be between 1 and 4'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 0.01, max: 1000000 })
    .withMessage('Amount must be between $0.01 and $1,000,000'),

  body('payment_date')
    .notEmpty()
    .withMessage('Payment date is required')
    .isISO8601()
    .withMessage('Please provide a valid date'),

  body('payment_method')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['eftps', 'direct_pay', 'check', 'credit_card', 'debit_card', 'other'])
    .withMessage('Invalid payment method'),

  body('confirmation_number')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Confirmation number must be less than 100 characters'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
];
