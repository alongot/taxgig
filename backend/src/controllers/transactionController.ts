/**
 * Transaction Controller
 * Handles HTTP requests for transaction management
 *
 * Sprint 2 Implementation:
 * - Transaction listing with filters
 * - Single transaction retrieval
 * - Category and business flag updates
 * - Bulk operations
 * - Review queue management
 * - Statistics and reporting
 */

import { Response, NextFunction } from 'express';
import { AuthRequest, TransactionType } from '../types';
import { transactionService, TransactionFilters } from '../services/transactionService';
import { categorizationService } from '../services/categorizationService';
import { BadRequestError } from '../utils/errors';

/**
 * Get all transactions for the user with filtering and pagination
 * GET /api/v1/transactions
 */
export const getTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const filters: TransactionFilters = {};

    if (req.query.account_id) {
      filters.account_id = req.query.account_id as string;
    }

    if (req.query.transaction_type) {
      filters.transaction_type = req.query.transaction_type as TransactionType;
    }

    if (req.query.category_id) {
      filters.category_id = req.query.category_id as string;
    }

    if (req.query.is_business !== undefined) {
      filters.is_business = req.query.is_business === 'true';
    }

    if (req.query.review_required !== undefined) {
      filters.review_required = req.query.review_required === 'true';
    }

    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }

    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    if (req.query.min_amount) {
      filters.min_amount = parseFloat(req.query.min_amount as string);
    }

    if (req.query.max_amount) {
      filters.max_amount = parseFloat(req.query.max_amount as string);
    }

    if (req.query.search) {
      filters.search = req.query.search as string;
    }

    const result = await transactionService.getTransactions(userId, filters, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single transaction by ID
 * GET /api/v1/transactions/:transactionId
 */
export const getTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transactionId } = req.params;

    const transaction = await transactionService.getTransactionById(userId, transactionId);

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a transaction (category, business flag, notes)
 * PATCH /api/v1/transactions/:transactionId
 */
export const updateTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transactionId } = req.params;
    const updates = req.body;

    // Validate category_id if provided
    if (updates.category_id) {
      const category = await categorizationService.getCategoryById(updates.category_id);
      if (!category) {
        throw new BadRequestError('Invalid category ID');
      }
    }

    // Validate business_percentage if provided
    if (updates.business_percentage !== undefined) {
      if (updates.business_percentage < 0 || updates.business_percentage > 100) {
        throw new BadRequestError('Business percentage must be between 0 and 100');
      }
    }

    const transaction = await transactionService.updateTransaction(userId, transactionId, updates);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Bulk update transactions
 * PATCH /api/v1/transactions/bulk
 */
export const bulkUpdateTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transaction_ids, updates } = req.body;

    if (!Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      throw new BadRequestError('transaction_ids must be a non-empty array');
    }

    if (transaction_ids.length > 100) {
      throw new BadRequestError('Cannot update more than 100 transactions at once');
    }

    // Validate category_id if provided
    if (updates.category_id) {
      const category = await categorizationService.getCategoryById(updates.category_id);
      if (!category) {
        throw new BadRequestError('Invalid category ID');
      }
    }

    const result = await transactionService.bulkUpdateTransactions(userId, transaction_ids, updates);

    res.status(200).json({
      success: true,
      message: `Updated ${result.updated} transactions`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transactions that need review
 * GET /api/v1/transactions/review
 */
export const getTransactionsForReview = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);

    const result = await transactionService.getTransactionsForReview(userId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a transaction as reviewed
 * POST /api/v1/transactions/:transactionId/review
 */
export const markTransactionReviewed = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transactionId } = req.params;
    const { category_id, is_business, notes } = req.body;

    const updates: {
      reviewed_by_user: boolean;
      category_id?: string;
      is_business?: boolean;
      notes?: string;
    } = {
      reviewed_by_user: true,
    };

    if (category_id !== undefined) {
      // Validate category
      if (category_id) {
        const category = await categorizationService.getCategoryById(category_id);
        if (!category) {
          throw new BadRequestError('Invalid category ID');
        }
      }
      updates.category_id = category_id;
    }

    if (is_business !== undefined) {
      updates.is_business = is_business;
    }

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const transaction = await transactionService.updateTransaction(userId, transactionId, updates);

    res.status(200).json({
      success: true,
      message: 'Transaction marked as reviewed',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get transaction statistics
 * GET /api/v1/transactions/stats
 */
export const getTransactionStats = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    // Default to current year if not specified
    const now = new Date();
    const startDate = req.query.start_date
      ? new Date(req.query.start_date as string)
      : new Date(now.getFullYear(), 0, 1); // January 1st

    const endDate = req.query.end_date
      ? new Date(req.query.end_date as string)
      : new Date(now.getFullYear(), 11, 31); // December 31st

    const stats = await transactionService.getTransactionStats(userId, startDate, endDate);

    res.status(200).json({
      success: true,
      data: {
        period: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all expense categories
 * GET /api/v1/transactions/categories
 */
export const getCategories = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const categories = await categorizationService.getAllCategories();

    // Group by deductibility
    const deductible = categories.filter(c => c.deduction_rate > 0 && c.category_code !== 'personal');
    const nonDeductible = categories.filter(c => c.deduction_rate === 0 || c.category_code === 'personal');

    res.status(200).json({
      success: true,
      data: {
        all: categories,
        deductible,
        non_deductible: nonDeductible,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Exclude a transaction from calculations
 * POST /api/v1/transactions/:transactionId/exclude
 */
export const excludeTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await transactionService.updateTransaction(userId, transactionId, {
      is_excluded: true,
      exclude_reason: reason || 'Excluded by user',
    });

    res.status(200).json({
      success: true,
      message: 'Transaction excluded from calculations',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Include a previously excluded transaction
 * POST /api/v1/transactions/:transactionId/include
 */
export const includeTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { transactionId } = req.params;

    const transaction = await transactionService.updateTransaction(userId, transactionId, {
      is_excluded: false,
      exclude_reason: undefined,
    });

    res.status(200).json({
      success: true,
      message: 'Transaction included in calculations',
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};
