/**
 * Tax Controller
 * Handles HTTP requests for tax calculations, threshold tracking, and payments
 *
 * Sprint 3 Implementation:
 * - Quarterly tax estimate calculations
 * - YTD tax summary
 * - IRS $5K threshold tracking
 * - Estimated payment recording
 * - Tax deadline information
 */

import { Response, NextFunction } from 'express';
import { taxService } from '../services/taxService';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import { AuthRequest, ApiResponse } from '../types';

export class TaxController {
  /**
   * GET /api/tax/estimate
   * Get quarterly tax estimate for the current or specified quarter
   */
  async getQuarterlyEstimate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year, quarter } = req.query;

      // Default to current year and quarter
      const now = new Date();
      const year = tax_year ? parseInt(tax_year as string, 10) : now.getFullYear();
      const qtr = quarter ? parseInt(quarter as string, 10) : Math.floor(now.getMonth() / 3) + 1;

      const estimate = await taxService.calculateQuarterlyEstimate(req.user.user_id, year, qtr);

      const response: ApiResponse<typeof estimate> = {
        success: true,
        data: estimate,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/estimate/ytd
   * Get year-to-date tax estimate
   */
  async getYTDEstimate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : undefined;

      const estimate = await taxService.calculateYTDEstimate(req.user.user_id, year);

      const response: ApiResponse<typeof estimate> = {
        success: true,
        data: estimate,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/threshold
   * Get IRS reporting threshold status ($5K threshold tracking)
   */
  async getThresholdStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : undefined;

      const status = await taxService.getThresholdStatus(req.user.user_id, year);

      const response: ApiResponse<typeof status> = {
        success: true,
        data: status,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/deadlines
   * Get all quarterly tax deadlines for a year
   */
  async getDeadlines(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : undefined;

      const deadlines = await taxService.getDeadlines(year);

      const response: ApiResponse<typeof deadlines> = {
        success: true,
        data: deadlines,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/deadlines/next
   * Get the next upcoming tax deadline
   */
  async getNextDeadline(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const deadline = await taxService.getNextDeadline(req.user.user_id);

      const response: ApiResponse<typeof deadline> = {
        success: true,
        data: deadline,
        message: deadline
          ? deadline.is_overdue
            ? `Payment for Q${deadline.quarter} is overdue!`
            : `Next payment due in ${deadline.days_until_due} days`
          : 'No upcoming deadlines found',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/tax/payments
   * Record an estimated tax payment
   */
  async recordPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const {
        tax_year,
        quarter,
        amount,
        payment_date,
        payment_method,
        confirmation_number,
        notes,
      } = req.body;

      const payment = await taxService.recordPayment(
        req.user.user_id,
        parseInt(tax_year, 10),
        parseInt(quarter, 10),
        parseFloat(amount),
        new Date(payment_date),
        payment_method,
        confirmation_number,
        notes
      );

      const response: ApiResponse<typeof payment> = {
        success: true,
        data: payment,
        message: `Payment of $${parseFloat(amount).toFixed(2)} recorded for Q${quarter} ${tax_year}`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/payments
   * Get all estimated payments for a tax year
   */
  async getPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : undefined;

      const payments = await taxService.getPayments(req.user.user_id, year);

      // Calculate totals
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const paymentsByQuarter = payments.reduce((acc, p) => {
        acc[`Q${p.quarter}`] = (acc[`Q${p.quarter}`] || 0) + p.amount;
        return acc;
      }, {} as Record<string, number>);

      const response: ApiResponse<{
        payments: typeof payments;
        summary: {
          total_paid: number;
          by_quarter: Record<string, number>;
          payment_count: number;
        };
      }> = {
        success: true,
        data: {
          payments,
          summary: {
            total_paid: totalPaid,
            by_quarter: paymentsByQuarter,
            payment_count: payments.length,
          },
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/saved-estimates
   * Get all saved tax estimates for a year
   */
  async getSavedEstimates(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : undefined;

      const estimates = await taxService.getSavedEstimates(req.user.user_id, year);

      const response: ApiResponse<typeof estimates> = {
        success: true,
        data: estimates,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/tax/summary
   * Get a comprehensive tax summary for the dashboard
   */
  async getTaxSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Not authenticated' });
        return;
      }

      const { tax_year } = req.query;
      const year = tax_year ? parseInt(tax_year as string, 10) : new Date().getFullYear();

      // Get all relevant data in parallel
      const [ytdEstimate, thresholdStatus, nextDeadline, payments, reviewTransactions, accountSummary] = await Promise.all([
        taxService.calculateYTDEstimate(req.user.user_id, year),
        taxService.getThresholdStatus(req.user.user_id, year),
        taxService.getNextDeadline(req.user.user_id),
        taxService.getPayments(req.user.user_id, year),
        transactionService.getTransactions(req.user.user_id, { review_required: true }, 1, 1),
        accountService.getUserAccounts(req.user.user_id),
      ]);

      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);

      // Get quarterly deadlines for the year
      const deadlines = await taxService.getDeadlines(year);

      // Build quarterly array with payment status
      const quarterly = deadlines.map(d => {
        const quarterPayments = payments.filter(p => p.quarter === d.quarter);
        const quarterPaid = quarterPayments.reduce((sum, p) => sum + p.amount, 0);
        return {
          quarter: d.quarter,
          estimatedPayment: ytdEstimate.net_quarterly_payment,
          dueDate: d.due_date.toISOString(),
          isPaid: quarterPaid > 0,
        };
      });

      // Format response to match frontend TaxSummary type
      const summary = {
        currentQuarter,
        taxYear: year,
        ytd: {
          totalIncome: ytdEstimate.gross_income,
          totalDeductions: ytdEstimate.total_deductions,
          netProfit: ytdEstimate.net_profit,
          selfEmploymentTax: ytdEstimate.self_employment_tax,
          incomeTax: ytdEstimate.income_tax,
          totalTaxOwed: ytdEstimate.total_tax_liability,
        },
        quarterly,
        thresholdStatus: {
          total1099Income: thresholdStatus.total_1099_income,
          thresholdReached: thresholdStatus.threshold_5000_reached,
          percentToThreshold: (thresholdStatus.total_1099_income / 5000) * 100,
        },
        nextDeadline: nextDeadline
          ? {
              deadline_id: '',
              tax_year: nextDeadline.tax_year,
              quarter: nextDeadline.quarter,
              period_start_date: nextDeadline.period_start.toISOString(),
              period_end_date: nextDeadline.period_end.toISOString(),
              due_date: nextDeadline.due_date.toISOString(),
            }
          : null,
        daysUntilDeadline: nextDeadline?.days_until_due ?? null,
        // Also include flat data for backwards compatibility
        totalPaidYTD: totalPaid,
        remainingOwed: Math.max(0, ytdEstimate.total_tax_liability - totalPaid),
        effectiveRate: ytdEstimate.effective_tax_rate,
        calculatedAt: ytdEstimate.calculated_at,
        // Dashboard-specific data
        transactionsNeedingReview: reviewTransactions.pagination.total,
        connectedAccounts: accountSummary.connected_accounts,
      };

      const response: ApiResponse<typeof summary> = {
        success: true,
        data: summary,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const taxController = new TaxController();
