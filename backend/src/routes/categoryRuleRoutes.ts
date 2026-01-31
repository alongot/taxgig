/**
 * Category Rule Routes
 * API endpoints for user-defined categorization rules
 *
 * Sprint 2 Implementation:
 * All routes require authentication
 */

import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  getSuggestedRules,
  createRuleFromSuggestion,
} from '../controllers/categoryRuleController';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// LISTING & SUGGESTIONS
// =============================================================================

/**
 * @route   GET /api/v1/rules
 * @desc    Get all category rules for the user
 * @access  Private
 */
router.get(
  '/',
  [
    query('include_inactive').optional().isIn(['true', 'false']).withMessage('include_inactive must be true or false'),
  ],
  validate,
  getRules
);

/**
 * @route   GET /api/v1/rules/suggestions
 * @desc    Get suggested rules based on categorization patterns
 * @access  Private
 */
router.get('/suggestions', getSuggestedRules);

/**
 * @route   POST /api/v1/rules/from-suggestion
 * @desc    Create a rule from a suggestion
 * @access  Private
 */
router.post(
  '/from-suggestion',
  [
    body('merchant').notEmpty().withMessage('merchant is required'),
    body('category_id').isUUID().withMessage('category_id must be a valid UUID'),
    body('is_business').optional().isBoolean().withMessage('is_business must be a boolean'),
  ],
  validate,
  createRuleFromSuggestion
);

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * @route   POST /api/v1/rules
 * @desc    Create a new category rule
 * @access  Private
 */
router.post(
  '/',
  [
    body('rule_type')
      .isIn(['keyword', 'merchant', 'mcc', 'amount_range', 'combined'])
      .withMessage('rule_type must be keyword, merchant, mcc, amount_range, or combined'),
    body('rule_name').optional().isString().withMessage('rule_name must be a string'),
    body('keyword_pattern').optional().isString().withMessage('keyword_pattern must be a string'),
    body('merchant_pattern').optional().isString().withMessage('merchant_pattern must be a string'),
    body('mcc_codes').optional().isArray().withMessage('mcc_codes must be an array'),
    body('amount_min').optional().isFloat({ min: 0 }).withMessage('amount_min must be a positive number'),
    body('amount_max').optional().isFloat({ min: 0 }).withMessage('amount_max must be a positive number'),
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID'),
    body('is_business').optional().isBoolean().withMessage('is_business must be a boolean'),
    body('transaction_type').optional().isIn(['income', 'expense', 'transfer', 'refund', 'unknown']).withMessage('Invalid transaction type'),
    body('priority').optional().isInt().withMessage('priority must be an integer'),
  ],
  validate,
  createRule
);

/**
 * @route   GET /api/v1/rules/:ruleId
 * @desc    Get a single rule by ID
 * @access  Private
 */
router.get(
  '/:ruleId',
  [
    param('ruleId').isUUID().withMessage('Invalid rule ID'),
  ],
  validate,
  getRule
);

/**
 * @route   PATCH /api/v1/rules/:ruleId
 * @desc    Update a category rule
 * @access  Private
 */
router.patch(
  '/:ruleId',
  [
    param('ruleId').isUUID().withMessage('Invalid rule ID'),
    body('rule_name').optional().isString().withMessage('rule_name must be a string'),
    body('keyword_pattern').optional().isString().withMessage('keyword_pattern must be a string'),
    body('merchant_pattern').optional().isString().withMessage('merchant_pattern must be a string'),
    body('mcc_codes').optional().isArray().withMessage('mcc_codes must be an array'),
    body('amount_min').optional().isFloat({ min: 0 }).withMessage('amount_min must be a positive number'),
    body('amount_max').optional().isFloat({ min: 0 }).withMessage('amount_max must be a positive number'),
    body('category_id').optional().isUUID().withMessage('category_id must be a valid UUID'),
    body('is_business').optional().isBoolean().withMessage('is_business must be a boolean'),
    body('transaction_type').optional().isIn(['income', 'expense', 'transfer', 'refund', 'unknown']).withMessage('Invalid transaction type'),
    body('priority').optional().isInt().withMessage('priority must be an integer'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  ],
  validate,
  updateRule
);

/**
 * @route   DELETE /api/v1/rules/:ruleId
 * @desc    Delete a category rule
 * @access  Private
 */
router.delete(
  '/:ruleId',
  [
    param('ruleId').isUUID().withMessage('Invalid rule ID'),
  ],
  validate,
  deleteRule
);

export default router;
