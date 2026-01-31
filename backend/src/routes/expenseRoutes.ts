/**
 * Expense Routes
 * API routes for manual expense management
 *
 * Sprint 3 Implementation:
 * - POST /api/expenses - Create manual expense
 * - POST /api/expenses/mileage - Create mileage expense
 * - POST /api/expenses/from-receipt - Create expense from receipt OCR
 * - GET /api/expenses - List expenses with filters
 * - GET /api/expenses/stats - Get expense statistics
 * - GET /api/expenses/categories - Get expense categories
 * - GET /api/expenses/mileage-rate - Get current IRS mileage rate
 * - GET /api/expenses/:id - Get single expense
 * - PUT /api/expenses/:id - Update expense
 * - DELETE /api/expenses/:id - Delete expense
 * - POST /api/expenses/:id/receipt - Add receipt data to expense
 */

import { Router } from 'express';
import { expenseController } from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';
import {
  createExpenseValidation,
  createMileageExpenseValidation,
  updateExpenseValidation,
  receiptDataValidation,
  handleValidationErrors,
} from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

// =============================================================================
// EXPENSE CREATION ROUTES
// =============================================================================

/**
 * @route   POST /api/expenses
 * @desc    Create a new manual expense
 * @access  Private
 */
router.post(
  '/',
  createExpenseValidation,
  handleValidationErrors,
  expenseController.createExpense.bind(expenseController)
);

/**
 * @route   POST /api/expenses/mileage
 * @desc    Create a mileage expense entry
 * @access  Private
 */
router.post(
  '/mileage',
  createMileageExpenseValidation,
  handleValidationErrors,
  expenseController.createMileageExpense.bind(expenseController)
);

/**
 * @route   POST /api/expenses/from-receipt
 * @desc    Create an expense from OCR receipt data
 * @access  Private
 */
router.post(
  '/from-receipt',
  receiptDataValidation,
  handleValidationErrors,
  expenseController.createFromReceipt.bind(expenseController)
);

// =============================================================================
// EXPENSE RETRIEVAL ROUTES
// =============================================================================

/**
 * @route   GET /api/expenses
 * @desc    Get expenses for authenticated user with filtering and pagination
 * @access  Private
 */
router.get('/', expenseController.getExpenses.bind(expenseController));

/**
 * @route   GET /api/expenses/stats
 * @desc    Get expense statistics for a date range
 * @access  Private
 */
router.get('/stats', expenseController.getExpenseStats.bind(expenseController));

/**
 * @route   GET /api/expenses/categories
 * @desc    Get all expense categories
 * @access  Private
 */
router.get('/categories', expenseController.getCategories.bind(expenseController));

/**
 * @route   GET /api/expenses/mileage-rate
 * @desc    Get current IRS mileage rate
 * @access  Private
 */
router.get('/mileage-rate', expenseController.getMileageRate.bind(expenseController));

/**
 * @route   GET /api/expenses/:id
 * @desc    Get a single expense by ID
 * @access  Private
 */
router.get('/:id', expenseController.getExpenseById.bind(expenseController));

// =============================================================================
// EXPENSE UPDATE ROUTES
// =============================================================================

/**
 * @route   PUT /api/expenses/:id
 * @desc    Update an expense
 * @access  Private
 */
router.put(
  '/:id',
  updateExpenseValidation,
  handleValidationErrors,
  expenseController.updateExpense.bind(expenseController)
);

/**
 * @route   POST /api/expenses/:id/receipt
 * @desc    Add receipt data to an expense
 * @access  Private
 */
router.post(
  '/:id/receipt',
  receiptDataValidation,
  handleValidationErrors,
  expenseController.addReceiptData.bind(expenseController)
);

// =============================================================================
// EXPENSE DELETE ROUTE
// =============================================================================

/**
 * @route   DELETE /api/expenses/:id
 * @desc    Delete an expense
 * @access  Private
 */
router.delete('/:id', expenseController.deleteExpense.bind(expenseController));

export default router;
