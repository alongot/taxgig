/**
 * Transaction Routes
 * API endpoints for transaction management
 *
 * Sprint 2 Implementation:
 * All routes require authentication
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getTransactions,
  getTransaction,
  updateTransaction,
  bulkUpdateTransactions,
  getTransactionsForReview,
  markTransactionReviewed,
  getTransactionStats,
  getCategories,
  excludeTransaction,
  includeTransaction,
} from '../controllers/transactionController';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// =============================================================================
// LISTING ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/transactions
 * @desc    Get all transactions with filtering and pagination
 * @access  Private
 * @query   page, limit, account_id, transaction_type, category_id, is_business,
 *          review_required, start_date, end_date, min_amount, max_amount, search
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('transaction_type').optional().isIn(['income', 'expense', 'transfer', 'refund', 'unknown']).withMessage('Invalid transaction type'),
    query('is_business').optional().isIn(['true', 'false']).withMessage('is_business must be true or false'),
    query('review_required').optional().isIn(['true', 'false']).withMessage('review_required must be true or false'),
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid date'),
    query('min_amount').optional().isFloat({ min: 0 }).withMessage('min_amount must be a positive number'),
    query('max_amount').optional().isFloat({ min: 0 }).withMessage('max_amount must be a positive number'),
  ],
  validate,
  getTransactions
);

/**
 * @route   GET /api/v1/transactions/review
 * @desc    Get transactions that need review
 * @access  Private
 */
router.get(
  '/review',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  ],
  validate,
  getTransactionsForReview
);

/**
 * @route   GET /api/v1/transactions/stats
 * @desc    Get transaction statistics for a date range
 * @access  Private
 */
router.get(
  '/stats',
  [
    query('start_date').optional().isISO8601().withMessage('start_date must be a valid date'),
    query('end_date').optional().isISO8601().withMessage('end_date must be a valid date'),
  ],
  validate,
  getTransactionStats
);

/**
 * @route   GET /api/v1/transactions/categories
 * @desc    Get all expense categories
 * @access  Private
 */
router.get('/categories', getCategories);

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * @route   PATCH /api/v1/transactions/bulk
 * @desc    Bulk update multiple transactions
 * @access  Private
 */
router.patch(
  '/bulk',
  [
    body('transaction_ids')
      .isArray({ min: 1, max: 100 })
      .withMessage('transaction_ids must be an array with 1-100 items'),
    body('transaction_ids.*')
      .isUUID()
      .withMessage('All transaction_ids must be valid UUIDs'),
    body('updates')
      .isObject()
      .withMessage('updates must be an object'),
    body('updates.category_id')
      .optional()
      .isUUID()
      .withMessage('category_id must be a valid UUID'),
    body('updates.is_business')
      .optional()
      .isBoolean()
      .withMessage('is_business must be a boolean'),
    body('updates.reviewed_by_user')
      .optional()
      .isBoolean()
      .withMessage('reviewed_by_user must be a boolean'),
  ],
  validate,
  bulkUpdateTransactions
);

// =============================================================================
// SINGLE TRANSACTION ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/transactions/:transactionId
 * @desc    Get a single transaction
 * @access  Private
 */
router.get(
  '/:transactionId',
  [
    param('transactionId').isUUID().withMessage('Invalid transaction ID'),
  ],
  validate,
  getTransaction
);

/**
 * @route   PATCH /api/v1/transactions/:transactionId
 * @desc    Update a transaction
 * @access  Private
 */
router.patch(
  '/:transactionId',
  [
    param('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID'),
    body('is_business').optional().isBoolean().withMessage('is_business must be a boolean'),
    body('business_percentage').optional().isFloat({ min: 0, max: 100 }).withMessage('business_percentage must be between 0 and 100'),
    body('notes').optional().isString().withMessage('notes must be a string'),
  ],
  validate,
  updateTransaction
);

/**
 * @route   POST /api/v1/transactions/:transactionId/review
 * @desc    Mark a transaction as reviewed
 * @access  Private
 */
router.post(
  '/:transactionId/review',
  [
    param('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID'),
    body('is_business').optional().isBoolean().withMessage('is_business must be a boolean'),
    body('notes').optional().isString().withMessage('notes must be a string'),
  ],
  validate,
  markTransactionReviewed
);

/**
 * @route   POST /api/v1/transactions/:transactionId/exclude
 * @desc    Exclude a transaction from calculations
 * @access  Private
 */
router.post(
  '/:transactionId/exclude',
  [
    param('transactionId').isUUID().withMessage('Invalid transaction ID'),
    body('reason').optional().isString().withMessage('reason must be a string'),
  ],
  validate,
  excludeTransaction
);

/**
 * @route   POST /api/v1/transactions/:transactionId/include
 * @desc    Include a previously excluded transaction
 * @access  Private
 */
router.post(
  '/:transactionId/include',
  [
    param('transactionId').isUUID().withMessage('Invalid transaction ID'),
  ],
  validate,
  includeTransaction
);

export default router;
