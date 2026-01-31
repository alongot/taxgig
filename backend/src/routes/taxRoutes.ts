/**
 * Tax Routes
 * API routes for tax calculations, threshold tracking, and payments
 *
 * Sprint 3 Implementation:
 * - GET /api/tax/estimate - Get quarterly tax estimate
 * - GET /api/tax/estimate/ytd - Get year-to-date estimate
 * - GET /api/tax/summary - Get comprehensive tax summary
 * - GET /api/tax/threshold - Get IRS $5K threshold status
 * - GET /api/tax/deadlines - Get all quarterly deadlines
 * - GET /api/tax/deadlines/next - Get next upcoming deadline
 * - POST /api/tax/payments - Record estimated tax payment
 * - GET /api/tax/payments - Get payment history
 * - GET /api/tax/saved-estimates - Get saved tax estimates
 */

import { Router } from 'express';
import { query } from 'express-validator';
import { taxController } from '../controllers/taxController';
import { authenticate } from '../middleware/auth';
import {
  recordPaymentValidation,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// TAX ESTIMATE ROUTES
// =============================================================================

/**
 * @route   GET /api/tax/estimate
 * @desc    Calculate quarterly tax estimate
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 * @query   quarter (optional) - Quarter 1-4 (default: current quarter)
 */
router.get(
  '/estimate',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
    query('quarter')
      .optional()
      .isInt({ min: 1, max: 4 })
      .withMessage('Quarter must be between 1 and 4'),
  ],
  handleValidationErrors,
  taxController.getQuarterlyEstimate.bind(taxController)
);

/**
 * @route   GET /api/tax/estimate/ytd
 * @desc    Get year-to-date tax estimate
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/estimate/ytd',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getYTDEstimate.bind(taxController)
);

/**
 * @route   GET /api/tax/summary
 * @desc    Get comprehensive tax summary for dashboard
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/summary',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getTaxSummary.bind(taxController)
);

/**
 * @route   GET /api/tax/saved-estimates
 * @desc    Get saved tax estimates for a year
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/saved-estimates',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getSavedEstimates.bind(taxController)
);

// =============================================================================
// THRESHOLD TRACKING ROUTES
// =============================================================================

/**
 * @route   GET /api/tax/threshold
 * @desc    Get IRS $5K reporting threshold status
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/threshold',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getThresholdStatus.bind(taxController)
);

// =============================================================================
// DEADLINE ROUTES
// =============================================================================

/**
 * @route   GET /api/tax/deadlines
 * @desc    Get all quarterly tax deadlines for a year
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/deadlines',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getDeadlines.bind(taxController)
);

/**
 * @route   GET /api/tax/deadlines/next
 * @desc    Get the next upcoming tax deadline
 * @access  Private
 */
router.get(
  '/deadlines/next',
  taxController.getNextDeadline.bind(taxController)
);

// =============================================================================
// PAYMENT ROUTES
// =============================================================================

/**
 * @route   POST /api/tax/payments
 * @desc    Record an estimated tax payment
 * @access  Private
 * @body    tax_year, quarter, amount, payment_date, payment_method, confirmation_number?, notes?
 */
router.post(
  '/payments',
  recordPaymentValidation,
  handleValidationErrors,
  taxController.recordPayment.bind(taxController)
);

/**
 * @route   GET /api/tax/payments
 * @desc    Get estimated payments for a tax year
 * @access  Private
 * @query   tax_year (optional) - Tax year (default: current year)
 */
router.get(
  '/payments',
  [
    query('tax_year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Tax year must be between 2020 and 2030'),
  ],
  handleValidationErrors,
  taxController.getPayments.bind(taxController)
);

export default router;
