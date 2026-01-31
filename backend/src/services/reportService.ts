/**
 * Report Service
 * Generates PDF tax reports in Schedule C format
 *
 * Sprint 4 Implementation:
 * - PDF generation using PDFKit
 * - Schedule C format report structure
 * - Income summary by platform
 * - Expense summary by IRS category
 * - Tax calculation summary
 */

import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { transactionService } from './transactionService';
import { expenseService } from './expenseService';
import { taxService } from './taxService';
import { NotFoundError } from '../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface ReportOptions {
  tax_year: number;
  quarter?: number; // If not provided, generates full year report
  include_transactions?: boolean; // Include line-item details
  include_mileage_log?: boolean;
}

export interface ReportMetadata {
  report_id: string;
  user_id: string;
  report_type: 'quarterly' | 'annual' | 'custom';
  tax_year: number;
  quarter: number | null;
  period_start: Date;
  period_end: Date;
  generated_at: Date;
  file_size_bytes: number;
}

interface UserReportData {
  user_id: string;
  full_name: string;
  email: string;
  tax_filing_status: string;
}

interface IncomeSummary {
  total_income: number;
  by_platform: Record<string, number>;
  transaction_count: number;
}

interface ExpenseSummary {
  total_expenses: number;
  by_category: Array<{
    category_name: string;
    irs_line: string | null;
    amount: number;
    deduction_rate: number;
    deductible_amount: number;
  }>;
  mileage_total: number;
  mileage_miles: number;
}

interface TaxSummary {
  gross_income: number;
  total_deductions: number;
  net_profit: number;
  self_employment_tax: number;
  se_tax_deduction: number;
  estimated_income_tax: number;
  total_tax_liability: number;
  quarterly_payment: number;
  effective_tax_rate: number;
}

// =============================================================================
// REPORT SERVICE CLASS
// =============================================================================

export class ReportService {
  /**
   * Generate a PDF tax report
   */
  async generateReport(
    userId: string,
    options: ReportOptions
  ): Promise<{ buffer: Buffer; metadata: ReportMetadata }> {
    // Get user data
    const user = await this.getUserData(userId);

    // Calculate period dates
    const { periodStart, periodEnd } = this.getPeriodDates(options.tax_year, options.quarter);

    // Gather report data
    const [incomeSummary, expenseSummary, taxSummary] = await Promise.all([
      this.getIncomeSummary(userId, periodStart, periodEnd),
      this.getExpenseSummary(userId, periodStart, periodEnd),
      this.getTaxSummary(userId, options.tax_year, options.quarter),
    ]);

    // Generate PDF
    const buffer = await this.createPDF(user, options, periodStart, periodEnd, incomeSummary, expenseSummary, taxSummary);

    // Create metadata
    const metadata: ReportMetadata = {
      report_id: uuidv4(),
      user_id: userId,
      report_type: options.quarter ? 'quarterly' : 'annual',
      tax_year: options.tax_year,
      quarter: options.quarter || null,
      period_start: periodStart,
      period_end: periodEnd,
      generated_at: new Date(),
      file_size_bytes: buffer.length,
    };

    // Save report record to database
    await this.saveReportRecord(metadata);

    return { buffer, metadata };
  }

  /**
   * Get list of generated reports for a user
   */
  async getReportHistory(userId: string, limit: number = 20): Promise<ReportMetadata[]> {
    const result = await query(
      `SELECT * FROM generated_reports
       WHERE user_id = $1
       ORDER BY generated_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => ({
      report_id: row.report_id,
      user_id: row.user_id,
      report_type: row.report_type,
      tax_year: row.tax_year,
      quarter: row.quarter,
      period_start: new Date(row.period_start),
      period_end: new Date(row.period_end),
      generated_at: new Date(row.generated_at),
      file_size_bytes: row.file_size_bytes,
    }));
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Get user data for report
   */
  private async getUserData(userId: string): Promise<UserReportData> {
    const result = await query(
      'SELECT user_id, full_name, email, tax_filing_status FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return result.rows[0];
  }

  /**
   * Calculate period dates based on year and quarter
   */
  private getPeriodDates(year: number, quarter?: number): { periodStart: Date; periodEnd: Date } {
    if (quarter) {
      const quarterMonths = [
        { start: 0, end: 2 },
        { start: 3, end: 5 },
        { start: 6, end: 8 },
        { start: 9, end: 11 },
      ];
      const q = quarterMonths[quarter - 1];
      return {
        periodStart: new Date(year, q.start, 1),
        periodEnd: new Date(year, q.end + 1, 0),
      };
    }

    // Full year
    return {
      periodStart: new Date(year, 0, 1),
      periodEnd: new Date(year, 11, 31),
    };
  }

  /**
   * Get income summary from transactions
   */
  private async getIncomeSummary(userId: string, startDate: Date, endDate: Date): Promise<IncomeSummary> {
    const stats = await transactionService.getTransactionStats(userId, startDate, endDate);

    return {
      total_income: stats.business_income,
      by_platform: stats.income_by_platform,
      transaction_count: stats.transaction_count,
    };
  }

  /**
   * Get expense summary from transactions and manual expenses
   */
  private async getExpenseSummary(userId: string, startDate: Date, endDate: Date): Promise<ExpenseSummary> {
    // Get transaction-based expenses
    const transactionStats = await transactionService.getTransactionStats(userId, startDate, endDate);

    // Get manual expenses
    const expenseStats = await expenseService.getExpenseStats(userId, startDate, endDate);

    // Get expense categories with IRS line numbers
    const categories = await expenseService.getCategories();
    const categoryMap = new Map(categories.map(c => [c.category_code, c]));

    // Combine expenses by category
    const combinedExpenses: Record<string, number> = {};

    // Add transaction expenses
    for (const [cat, amount] of Object.entries(transactionStats.expenses_by_category)) {
      combinedExpenses[cat] = (combinedExpenses[cat] || 0) + amount;
    }

    // Add manual expenses
    for (const [cat, amount] of Object.entries(expenseStats.expenses_by_category)) {
      combinedExpenses[cat] = (combinedExpenses[cat] || 0) + amount;
    }

    // Build category summary with IRS info
    const byCategory = Object.entries(combinedExpenses)
      .map(([code, amount]) => {
        const catInfo = categoryMap.get(code);
        const deductionRate = catInfo?.deduction_rate || 100;
        return {
          category_name: catInfo?.category_name || code,
          irs_line: catInfo?.irs_line_number || null,
          amount,
          deduction_rate: deductionRate,
          deductible_amount: amount * (deductionRate / 100),
        };
      })
      .filter(c => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      total_expenses: transactionStats.business_expenses + expenseStats.total_expenses,
      by_category: byCategory,
      mileage_total: expenseStats.mileage_deductions,
      mileage_miles: expenseStats.total_miles,
    };
  }

  /**
   * Get tax calculation summary
   */
  private async getTaxSummary(userId: string, taxYear: number, quarter?: number): Promise<TaxSummary> {
    const calc = quarter
      ? await taxService.calculateQuarterlyEstimate(userId, taxYear, quarter)
      : await taxService.calculateYTDEstimate(userId, taxYear);

    return {
      gross_income: calc.gross_income,
      total_deductions: calc.total_deductions,
      net_profit: calc.net_profit,
      self_employment_tax: calc.self_employment_tax,
      se_tax_deduction: calc.se_tax_deduction,
      estimated_income_tax: calc.income_tax,
      total_tax_liability: calc.total_tax_liability,
      quarterly_payment: calc.net_quarterly_payment,
      effective_tax_rate: calc.effective_tax_rate,
    };
  }

  /**
   * Create the PDF document
   */
  private async createPDF(
    user: UserReportData,
    options: ReportOptions,
    periodStart: Date,
    periodEnd: Date,
    income: IncomeSummary,
    expenses: ExpenseSummary,
    tax: TaxSummary
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'LETTER' });

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Cover Page
      this.addCoverPage(doc, user, options, periodStart, periodEnd);

      // Part I: Income
      doc.addPage();
      this.addIncomePage(doc, income, periodStart, periodEnd);

      // Part II: Expenses
      doc.addPage();
      this.addExpensePage(doc, expenses);

      // Summary & Tax Calculation
      doc.addPage();
      this.addSummaryPage(doc, income, expenses, tax);

      // Disclaimer
      this.addDisclaimer(doc);

      doc.end();
    });
  }

  /**
   * Add cover page to PDF
   */
  private addCoverPage(
    doc: PDFKit.PDFDocument,
    user: UserReportData,
    options: ReportOptions,
    periodStart: Date,
    periodEnd: Date
  ): void {
    const title = options.quarter
      ? `Q${options.quarter} ${options.tax_year} Tax Report`
      : `${options.tax_year} Annual Tax Report`;

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Side Hustle Tax Tracker', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown(2);

    // Decorative line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown(2);

    // User Info
    doc.fontSize(14).font('Helvetica-Bold').text('Prepared For:');
    doc.fontSize(12).font('Helvetica');
    doc.text(user.full_name);
    doc.text(user.email);
    doc.moveDown();

    // Report Period
    doc.fontSize(14).font('Helvetica-Bold').text('Report Period:');
    doc.fontSize(12).font('Helvetica');
    doc.text(`${this.formatDate(periodStart)} - ${this.formatDate(periodEnd)}`);
    doc.moveDown();

    // Filing Status
    doc.fontSize(14).font('Helvetica-Bold').text('Filing Status:');
    doc.fontSize(12).font('Helvetica');
    doc.text(this.formatFilingStatus(user.tax_filing_status));
    doc.moveDown();

    // Generation Date
    doc.fontSize(14).font('Helvetica-Bold').text('Generated:');
    doc.fontSize(12).font('Helvetica');
    doc.text(this.formatDateTime(new Date()));
    doc.moveDown(3);

    // Table of Contents
    doc.fontSize(14).font('Helvetica-Bold').text('Contents:');
    doc.fontSize(12).font('Helvetica');
    doc.text('  Part I:   Gross Receipts or Sales (Income)', { indent: 20 });
    doc.text('  Part II:  Expenses', { indent: 20 });
    doc.text('  Summary:  Net Profit and Tax Calculation', { indent: 20 });
  }

  /**
   * Add income page to PDF
   */
  private addIncomePage(
    doc: PDFKit.PDFDocument,
    income: IncomeSummary,
    periodStart: Date,
    periodEnd: Date
  ): void {
    doc.fontSize(16).font('Helvetica-Bold').text('Part I: Gross Receipts or Sales');
    doc.fontSize(10).font('Helvetica').text(`Period: ${this.formatDate(periodStart)} - ${this.formatDate(periodEnd)}`);
    doc.moveDown();

    // Decorative line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown();

    // Income by Platform
    doc.fontSize(12).font('Helvetica-Bold').text('Income by Platform:');
    doc.moveDown(0.5);

    const platforms = Object.entries(income.by_platform).sort((a, b) => b[1] - a[1]);

    if (platforms.length === 0) {
      doc.fontSize(11).font('Helvetica').text('  No income recorded for this period.');
    } else {
      // Table header
      doc.fontSize(10).font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Platform', 70, tableTop);
      doc.text('Amount', 450, tableTop, { width: 80, align: 'right' });
      doc.moveDown(0.5);

      // Underline
      doc.moveTo(70, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(10);
      for (const [platform, amount] of platforms) {
        doc.text(this.formatPlatformName(platform), 70);
        doc.text(this.formatCurrency(amount), 450, doc.y - 12, { width: 80, align: 'right' });
        doc.moveDown(0.3);
      }

      // Total line
      doc.moveDown(0.5);
      doc.moveTo(70, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text('Total Gross Receipts', 70);
      doc.text(this.formatCurrency(income.total_income), 450, doc.y - 12, { width: 80, align: 'right' });
    }

    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').fillColor('#666666');
    doc.text(`Total Transactions: ${income.transaction_count}`);
    doc.fillColor('#000000');
  }

  /**
   * Add expenses page to PDF
   */
  private addExpensePage(doc: PDFKit.PDFDocument, expenses: ExpenseSummary): void {
    doc.fontSize(16).font('Helvetica-Bold').text('Part II: Expenses');
    doc.fontSize(10).font('Helvetica').text('Business expenses by IRS Schedule C category');
    doc.moveDown();

    // Decorative line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown();

    if (expenses.by_category.length === 0) {
      doc.fontSize(11).font('Helvetica').text('  No expenses recorded for this period.');
    } else {
      // Table header
      doc.fontSize(9).font('Helvetica-Bold');
      const tableTop = doc.y;
      doc.text('Line', 50, tableTop, { width: 30 });
      doc.text('Category', 85, tableTop, { width: 200 });
      doc.text('Amount', 340, tableTop, { width: 70, align: 'right' });
      doc.text('Rate', 415, tableTop, { width: 40, align: 'right' });
      doc.text('Deductible', 460, tableTop, { width: 70, align: 'right' });
      doc.moveDown(0.5);

      // Underline
      doc.moveTo(50, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.5);

      // Table rows
      doc.font('Helvetica').fontSize(9);
      let totalDeductible = 0;

      for (const cat of expenses.by_category) {
        totalDeductible += cat.deductible_amount;

        doc.text(cat.irs_line || '-', 50, doc.y, { width: 30 });
        doc.text(cat.category_name, 85, doc.y - 9, { width: 200 });
        doc.text(this.formatCurrency(cat.amount), 340, doc.y - 9, { width: 70, align: 'right' });
        doc.text(`${cat.deduction_rate}%`, 415, doc.y - 9, { width: 40, align: 'right' });
        doc.text(this.formatCurrency(cat.deductible_amount), 460, doc.y - 9, { width: 70, align: 'right' });
        doc.moveDown(0.4);
      }

      // Mileage section if applicable
      if (expenses.mileage_miles > 0) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').fontSize(9);
        doc.text('Mileage Deduction (included above):', 85);
        doc.font('Helvetica');
        doc.text(`${expenses.mileage_miles.toFixed(1)} miles @ IRS standard rate = ${this.formatCurrency(expenses.mileage_total)}`, 85);
        doc.moveDown(0.5);
      }

      // Total line
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(530, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Total Deductible Expenses', 85);
      doc.text(this.formatCurrency(totalDeductible), 460, doc.y - 10, { width: 70, align: 'right' });
    }
  }

  /**
   * Add summary and tax calculation page to PDF
   */
  private addSummaryPage(
    doc: PDFKit.PDFDocument,
    income: IncomeSummary,
    expenses: ExpenseSummary,
    tax: TaxSummary
  ): void {
    doc.fontSize(16).font('Helvetica-Bold').text('Summary: Net Profit & Tax Calculation');
    doc.moveDown();

    // Decorative line
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown();

    // Net Profit Calculation
    doc.fontSize(12).font('Helvetica-Bold').text('Net Profit Calculation');
    doc.moveDown(0.5);

    const summaryData = [
      { label: 'Gross Receipts (Income)', value: tax.gross_income },
      { label: 'Less: Total Deductions', value: -tax.total_deductions },
      { label: 'Net Profit (Loss)', value: tax.net_profit, bold: true },
    ];

    doc.fontSize(10).font('Helvetica');
    for (const item of summaryData) {
      if (item.bold) {
        doc.font('Helvetica-Bold');
        doc.moveTo(70, doc.y - 2).lineTo(400, doc.y - 2).stroke();
        doc.moveDown(0.3);
      }
      doc.text(item.label, 70);
      doc.text(this.formatCurrency(item.value), 300, doc.y - 10, { width: 100, align: 'right' });
      doc.moveDown(0.3);
      if (item.bold) doc.font('Helvetica');
    }

    doc.moveDown();

    // Self-Employment Tax Calculation
    doc.fontSize(12).font('Helvetica-Bold').text('Self-Employment Tax');
    doc.moveDown(0.5);

    const seTaxData = [
      { label: 'Net Profit', value: tax.net_profit },
      { label: 'SE Tax Base (92.35%)', value: tax.net_profit * 0.9235 },
      { label: 'Self-Employment Tax (15.3%)', value: tax.self_employment_tax, bold: true },
      { label: 'SE Tax Deduction (50%)', value: tax.se_tax_deduction },
    ];

    doc.fontSize(10).font('Helvetica');
    for (const item of seTaxData) {
      if (item.bold) doc.font('Helvetica-Bold');
      doc.text(item.label, 70);
      doc.text(this.formatCurrency(item.value), 300, doc.y - 10, { width: 100, align: 'right' });
      doc.moveDown(0.3);
      if (item.bold) doc.font('Helvetica');
    }

    doc.moveDown();

    // Estimated Tax Summary
    doc.fontSize(12).font('Helvetica-Bold').text('Estimated Tax Summary');
    doc.moveDown(0.5);

    const taxData = [
      { label: 'Self-Employment Tax', value: tax.self_employment_tax },
      { label: 'Estimated Income Tax', value: tax.estimated_income_tax },
      { label: 'Total Estimated Tax', value: tax.total_tax_liability, bold: true },
      { label: 'Quarterly Payment Due', value: tax.quarterly_payment, bold: true },
    ];

    doc.fontSize(10);
    for (const item of taxData) {
      if (item.bold) {
        doc.font('Helvetica-Bold');
        if (item.label === 'Quarterly Payment Due') {
          doc.moveDown(0.3);
          doc.fillColor('#1a5f2a');
        }
      } else {
        doc.font('Helvetica');
      }
      doc.text(item.label, 70);
      doc.text(this.formatCurrency(item.value), 300, doc.y - 10, { width: 100, align: 'right' });
      doc.moveDown(0.3);
    }
    doc.fillColor('#000000');

    doc.moveDown();

    // Effective Tax Rate
    doc.fontSize(10).font('Helvetica');
    doc.text(`Effective Tax Rate: ${tax.effective_tax_rate.toFixed(1)}%`, 70);
  }

  /**
   * Add disclaimer to PDF
   */
  private addDisclaimer(doc: PDFKit.PDFDocument): void {
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(562, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(8).font('Helvetica').fillColor('#666666');
    doc.text(
      'DISCLAIMER: This report is for informational purposes only and does not constitute tax advice. ' +
        'The calculations provided are estimates based on the data you have entered and may not reflect your ' +
        'actual tax liability. Tax laws are complex and subject to change. Consult a qualified tax professional ' +
        'for advice specific to your situation before making tax-related decisions or filing your tax return.',
      { align: 'justify' }
    );

    doc.moveDown();
    doc.text(
      'Side Hustle Tax Tracker is not a tax preparation service and does not file taxes on your behalf. ' +
        'This report is intended to help you organize your income and expenses for tax preparation purposes only.',
      { align: 'justify' }
    );

    doc.fillColor('#000000');
  }

  /**
   * Save report record to database
   */
  private async saveReportRecord(metadata: ReportMetadata): Promise<void> {
    await query(
      `INSERT INTO generated_reports (
        report_id, user_id, report_type, tax_year, quarter,
        period_start, period_end, generated_at, file_size_bytes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        metadata.report_id,
        metadata.user_id,
        metadata.report_type,
        metadata.tax_year,
        metadata.quarter,
        metadata.period_start,
        metadata.period_end,
        metadata.generated_at,
        metadata.file_size_bytes,
      ]
    );
  }

  // =============================================================================
  // FORMATTING HELPERS
  // =============================================================================

  private formatCurrency(amount: number): string {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(absAmount);
    return amount < 0 ? `(${formatted})` : formatted;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private formatDateTime(date: Date): string {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  private formatFilingStatus(status: string): string {
    const statusMap: Record<string, string> = {
      single: 'Single',
      married_joint: 'Married Filing Jointly',
      married_separate: 'Married Filing Separately',
      head_of_household: 'Head of Household',
    };
    return statusMap[status] || status;
  }

  private formatPlatformName(platform: string): string {
    // Capitalize first letter of each word
    return platform
      .split(/[_\s-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}

// Export singleton instance
export const reportService = new ReportService();
