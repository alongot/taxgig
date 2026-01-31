/**
 * Report Controller
 * Handles PDF report generation and delivery
 */

import { Response, NextFunction } from 'express';
import { reportService, ReportOptions } from '../services/reportService';
import { emailService } from '../services/emailService';
import { AuthRequest } from '../types';
import { BadRequestError } from '../utils/errors';
import { query } from '../config/database';

/**
 * Generate and download a PDF tax report
 * GET /api/reports/generate
 */
export async function generateReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;

    // Parse query parameters
    const taxYear = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const quarter = req.query.quarter ? parseInt(req.query.quarter as string, 10) : undefined;

    // Validate
    if (taxYear < 2020 || taxYear > new Date().getFullYear() + 1) {
      throw new BadRequestError('Invalid tax year');
    }

    if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
      throw new BadRequestError('Quarter must be between 1 and 4');
    }

    const options: ReportOptions = {
      tax_year: taxYear,
      quarter,
    };

    // Generate report
    const { buffer, metadata } = await reportService.generateReport(userId, options);

    // Set headers for PDF download
    const filename = quarter
      ? `tax-report-${taxYear}-Q${quarter}.pdf`
      : `tax-report-${taxYear}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('X-Report-Id', metadata.report_id);

    res.send(buffer);
  } catch (error) {
    next(error);
  }
}

/**
 * Generate report and return metadata (without downloading)
 * POST /api/reports/generate
 */
export async function createReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { tax_year, quarter } = req.body;

    // Validate
    const year = tax_year || new Date().getFullYear();
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      throw new BadRequestError('Invalid tax year');
    }

    if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
      throw new BadRequestError('Quarter must be between 1 and 4');
    }

    const options: ReportOptions = {
      tax_year: year,
      quarter,
    };

    // Generate report
    const { buffer, metadata } = await reportService.generateReport(userId, options);

    // Store buffer temporarily (in production, would upload to S3/cloud storage)
    // For now, return metadata only - client can use GET endpoint to download

    res.status(201).json({
      success: true,
      data: {
        ...metadata,
        download_url: `/api/reports/${metadata.report_id}/download`,
      },
      message: 'Report generated successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get report history for user
 * GET /api/reports/history
 */
export async function getReportHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const limit = parseInt(req.query.limit as string, 10) || 20;

    const reports = await reportService.getReportHistory(userId, limit);

    res.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Generate report and send via email
 * POST /api/reports/email
 */
export async function emailReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { tax_year, quarter, recipient_email } = req.body;

    // Validate
    const year = tax_year || new Date().getFullYear();
    if (year < 2020 || year > new Date().getFullYear() + 1) {
      throw new BadRequestError('Invalid tax year');
    }

    if (quarter !== undefined && (quarter < 1 || quarter > 4)) {
      throw new BadRequestError('Quarter must be between 1 and 4');
    }

    // Get user info
    const userResult = await query(
      'SELECT full_name, email FROM users WHERE user_id = $1',
      [userId]
    );
    const user = userResult.rows[0];
    const toEmail = recipient_email || user.email;

    const options: ReportOptions = {
      tax_year: year,
      quarter,
    };

    // Generate report
    const { buffer, metadata } = await reportService.generateReport(userId, options);

    // Get tax calculation for email summary
    const { taxService } = await import('../services/taxService');
    const taxCalc = quarter
      ? await taxService.calculateQuarterlyEstimate(userId, year, quarter)
      : await taxService.calculateYTDEstimate(userId, year);

    // Send email
    const emailSent = await emailService.sendReportEmail(toEmail, buffer, {
      user_name: user.full_name,
      tax_year: year,
      quarter,
      period_start: metadata.period_start,
      period_end: metadata.period_end,
      gross_income: taxCalc.gross_income,
      total_deductions: taxCalc.total_deductions,
      net_profit: taxCalc.net_profit,
      estimated_tax: taxCalc.total_tax_liability,
    });

    // Log email
    await emailService.logEmailSent(
      userId,
      'tax_report',
      toEmail,
      `${quarter ? `Q${quarter} ` : ''}${year} Tax Report`,
      emailSent
    );

    // Update report record with email info
    await query(
      `UPDATE generated_reports
       SET email_sent_to = $1, email_sent_at = NOW()
       WHERE report_id = $2`,
      [toEmail, metadata.report_id]
    );

    res.json({
      success: true,
      data: {
        report_id: metadata.report_id,
        email_sent: emailSent,
        recipient: toEmail,
      },
      message: emailSent
        ? `Report sent to ${toEmail}`
        : 'Report generated but email delivery failed. Check email configuration.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Quick preview - generate report summary without full PDF
 * GET /api/reports/preview
 */
export async function previewReport(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const taxYear = parseInt(req.query.year as string, 10) || new Date().getFullYear();
    const quarter = req.query.quarter ? parseInt(req.query.quarter as string, 10) : undefined;

    // Use tax service to get summary data without generating PDF
    const { taxService } = await import('../services/taxService');
    const { transactionService } = await import('../services/transactionService');
    const { expenseService } = await import('../services/expenseService');

    // Calculate period
    let periodStart: Date;
    let periodEnd: Date;

    if (quarter) {
      const quarterMonths = [
        { start: 0, end: 2 },
        { start: 3, end: 5 },
        { start: 6, end: 8 },
        { start: 9, end: 11 },
      ];
      const q = quarterMonths[quarter - 1];
      periodStart = new Date(taxYear, q.start, 1);
      periodEnd = new Date(taxYear, q.end + 1, 0);
    } else {
      periodStart = new Date(taxYear, 0, 1);
      periodEnd = new Date(taxYear, 11, 31);
    }

    // Get summary data
    const [taxCalc, transactionStats, expenseStats] = await Promise.all([
      quarter
        ? taxService.calculateQuarterlyEstimate(userId, taxYear, quarter)
        : taxService.calculateYTDEstimate(userId, taxYear),
      transactionService.getTransactionStats(userId, periodStart, periodEnd),
      expenseService.getExpenseStats(userId, periodStart, periodEnd),
    ]);

    res.json({
      success: true,
      data: {
        period: {
          tax_year: taxYear,
          quarter: quarter || null,
          start_date: periodStart,
          end_date: periodEnd,
        },
        income: {
          total: taxCalc.gross_income,
          by_platform: taxCalc.income_by_platform,
          transaction_count: transactionStats.transaction_count,
        },
        expenses: {
          total: taxCalc.total_deductions,
          by_category: taxCalc.deductions_by_category,
          mileage_total: expenseStats.mileage_deductions,
          mileage_miles: expenseStats.total_miles,
        },
        tax_summary: {
          net_profit: taxCalc.net_profit,
          self_employment_tax: taxCalc.self_employment_tax,
          estimated_income_tax: taxCalc.income_tax,
          total_tax_liability: taxCalc.total_tax_liability,
          quarterly_payment: taxCalc.net_quarterly_payment,
          effective_tax_rate: taxCalc.effective_tax_rate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
