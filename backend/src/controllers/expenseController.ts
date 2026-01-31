/**
 * Expense Controller
 * Handles HTTP requests for manual expense management
 *
 * Sprint 3 Implementation:
 * - CRUD operations for manual expenses
 * - Mileage expense creation
 * - Receipt data management
 * - Expense statistics and categories
 */

import { Response, NextFunction } from 'express';
import { expenseService, ExpenseFilters } from '../services/expenseService';
import { AuthRequest, ApiResponse, IRS_MILEAGE_RATE_2026 } from '../types';

export class ExpenseController {
  /**
   * POST /api/expenses
   * Create a new manual expense
   */
  async createExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        expense_date,
        merchant,
        amount,
        category_id,
        category_name,
        is_business,
        business_percentage,
        notes,
        payment_method,
        receipt_photo_url,
      } = req.body;

      const expense = await expenseService.createExpense(req.user.user_id, {
        expense_date: new Date(expense_date),
        merchant,
        amount: parseFloat(amount),
        category_id,
        category_name,
        is_business,
        business_percentage,
        notes,
        payment_method,
        receipt_photo_url,
      });

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
        message: 'Expense created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/expenses/mileage
   * Create a mileage expense entry
   */
  async createMileageExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        expense_date,
        miles,
        start_location,
        end_location,
        business_purpose,
        notes,
      } = req.body;

      const expense = await expenseService.createMileageExpense(req.user.user_id, {
        expense_date: new Date(expense_date),
        miles: parseFloat(miles),
        start_location,
        end_location,
        business_purpose,
        notes,
      });

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
        message: `Mileage expense created: ${miles} miles at $${IRS_MILEAGE_RATE_2026}/mile`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses
   * Get expenses for the authenticated user with filtering and pagination
   */
  async getExpenses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        page = '1',
        limit = '50',
        start_date,
        end_date,
        category_id,
        is_business,
        is_mileage,
        min_amount,
        max_amount,
        search,
      } = req.query;

      const filters: ExpenseFilters = {};

      if (start_date) filters.start_date = new Date(start_date as string);
      if (end_date) filters.end_date = new Date(end_date as string);
      if (category_id) filters.category_id = category_id as string;
      if (is_business !== undefined) filters.is_business = is_business === 'true';
      if (is_mileage !== undefined) filters.is_mileage = is_mileage === 'true';
      if (min_amount) filters.min_amount = parseFloat(min_amount as string);
      if (max_amount) filters.max_amount = parseFloat(max_amount as string);
      if (search) filters.search = search as string;

      const result = await expenseService.getExpenses(
        req.user.user_id,
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.expenses,
        pagination: result.pagination,
        summary: result.summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/:id
   * Get a single expense by ID
   */
  async getExpenseById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      const expense = await expenseService.getExpenseById(req.user.user_id, id);

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/expenses/:id
   * Update an expense
   */
  async updateExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      const updates = req.body;

      // Convert date string to Date object if present
      if (updates.expense_date) {
        updates.expense_date = new Date(updates.expense_date);
      }

      // Parse amount if present
      if (updates.amount !== undefined) {
        updates.amount = parseFloat(updates.amount);
      }

      const expense = await expenseService.updateExpense(req.user.user_id, id, updates);

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
        message: 'Expense updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/expenses/:id
   * Delete an expense
   */
  async deleteExpense(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      await expenseService.deleteExpense(req.user.user_id, id);

      const response: ApiResponse = {
        success: true,
        message: 'Expense deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/expenses/:id/receipt
   * Add receipt data to an expense
   */
  async addReceiptData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { id } = req.params;
      const {
        receipt_photo_url,
        receipt_thumbnail_url,
        ocr_raw_text,
        ocr_confidence,
        ocr_extracted_data,
      } = req.body;

      const expense = await expenseService.addReceiptData(req.user.user_id, id, {
        receipt_photo_url,
        receipt_thumbnail_url,
        ocr_raw_text,
        ocr_confidence,
        ocr_extracted_data,
      });

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
        message: 'Receipt data added successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/expenses/from-receipt
   * Create an expense from OCR receipt data
   */
  async createFromReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        receipt_photo_url,
        receipt_thumbnail_url,
        ocr_raw_text,
        ocr_confidence,
        ocr_extracted_data,
      } = req.body;

      const expense = await expenseService.createExpenseFromReceipt(req.user.user_id, {
        receipt_photo_url,
        receipt_thumbnail_url,
        ocr_raw_text,
        ocr_confidence,
        ocr_extracted_data,
      });

      const response: ApiResponse<typeof expense> = {
        success: true,
        data: expense,
        message: 'Expense created from receipt. Please review and confirm details.',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/stats
   * Get expense statistics for a date range
   */
  async getExpenseStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { start_date, end_date } = req.query;

      // Default to current year if not specified
      const now = new Date();
      const defaultStart = new Date(now.getFullYear(), 0, 1);
      const defaultEnd = new Date(now.getFullYear(), 11, 31);

      const startDate = start_date ? new Date(start_date as string) : defaultStart;
      const endDate = end_date ? new Date(end_date as string) : defaultEnd;

      const stats = await expenseService.getExpenseStats(req.user.user_id, startDate, endDate);

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/categories
   * Get all expense categories
   */
  async getCategories(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const categories = await expenseService.getCategories();

      const response: ApiResponse<typeof categories> = {
        success: true,
        data: categories,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/expenses/mileage-rate
   * Get current IRS mileage rate
   */
  async getMileageRate(_req: AuthRequest, res: Response): Promise<void> {
    const response: ApiResponse<{
      rate: number;
      year: number;
      description: string;
    }> = {
      success: true,
      data: {
        rate: IRS_MILEAGE_RATE_2026,
        year: 2026,
        description: 'IRS Standard Mileage Rate for business use of a vehicle',
      },
    };

    res.status(200).json(response);
  }
}

export const expenseController = new ExpenseController();
