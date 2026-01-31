/**
 * Tax Calculation Service
 * Handles quarterly tax estimates, SE tax calculation, and threshold tracking
 *
 * Sprint 3 Implementation:
 * - Self-employment tax calculation (15.3% on 92.35% of net earnings)
 * - Income tax calculation using federal brackets
 * - Quarterly estimate computation
 * - IRS $5K threshold tracking per platform
 * - Estimated payment recording
 *
 * Tax Calculation Formula:
 * Net Earnings = Gross Income - Business Expenses
 * SE Tax Base = Net Earnings * 0.9235
 * SE Tax = SE Tax Base * 0.153 (12.4% SS + 2.9% Medicare)
 * Taxable Income = Net Earnings - (SE Tax / 2)
 * Income Tax = Apply tax brackets to Taxable Income
 * Total Quarterly = (SE Tax + Income Tax) / 4
 */

import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database';
import { transactionService } from './transactionService';
import { expenseService } from './expenseService';
import {
  TaxEstimate,
  TaxFilingStatus,
  SE_TAX_RATE,
  SE_INCOME_MULTIPLIER,
  FEDERAL_TAX_BRACKETS_2026,
  IRS_REPORTING_THRESHOLD,
  IRS_WARNING_THRESHOLD,
} from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface TaxCalculationResult {
  tax_year: number;
  quarter: number;
  period_start: Date;
  period_end: Date;
  // Income
  gross_income: number;
  income_by_platform: Record<string, number>;
  // Deductions
  total_deductions: number;
  deductions_by_category: Record<string, number>;
  // Net
  net_profit: number;
  // Loss handling
  has_net_loss: boolean;
  loss_message: string | null;
  // Self-Employment Tax
  se_taxable_income: number;
  self_employment_tax: number;
  se_tax_deduction: number; // Half of SE tax (deductible)
  // Income Tax
  adjusted_gross_income: number;
  taxable_income: number;
  income_tax: number;
  effective_tax_rate: number;
  // Totals
  total_tax_liability: number;
  quarterly_payment_due: number;
  // W2 Adjustments
  w2_withholding_applied: number;
  net_quarterly_payment: number;
  // Quarterly requirement assessment
  quarterly_requirement: QuarterlyRequirementAssessment;
  // Status
  calculated_at: Date;
}

export interface ThresholdStatus {
  tax_year: number;
  total_1099_income: number;
  platforms: Array<{
    platform: string;
    income: number;
    threshold_reached: boolean;
    percent_of_threshold: number;
  }>;
  threshold_5000_reached: boolean;
  threshold_4000_warning: boolean;
  amount_until_threshold: number;
}

export interface EstimatedPayment {
  payment_id: string;
  user_id: string;
  tax_year: number;
  quarter: number;
  payment_date: Date;
  amount: number;
  payment_method: string;
  confirmation_number: string | null;
  notes: string | null;
  created_at: Date;
}

export interface TaxDeadlineInfo {
  tax_year: number;
  quarter: number;
  period_start: Date;
  period_end: Date;
  due_date: Date;
  days_until_due: number;
  is_overdue: boolean;
}

export interface QuarterlyRequirementAssessment {
  quarterly_payments_required: boolean;
  expected_annual_tax_liability: number;
  threshold_amount: number;
  assessment_message: string;
  disclaimer: string;
}

// Constant for quarterly payment threshold (IRS uses $1,000 tax liability, not income)
export const QUARTERLY_TAX_LIABILITY_THRESHOLD = 1000;

// =============================================================================
// TAX SERVICE CLASS
// =============================================================================

export class TaxService {
  /**
   * Calculate quarterly tax estimate for a user
   */
  async calculateQuarterlyEstimate(
    userId: string,
    taxYear: number,
    quarter: number
  ): Promise<TaxCalculationResult> {
    // Validate quarter
    if (quarter < 1 || quarter > 4) {
      throw new BadRequestError('Quarter must be between 1 and 4');
    }

    // Get user tax settings
    const userResult = await query(
      'SELECT tax_filing_status, marginal_tax_rate, w2_withholding_annual FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = userResult.rows[0];
    const filingStatus = user.tax_filing_status as TaxFilingStatus;
    const w2WithholdingAnnual = parseFloat(user.w2_withholding_annual) || 0;

    // Calculate period dates
    const { periodStart, periodEnd } = this.getQuarterDates(taxYear, quarter);

    // Get income from transactions (positive amounts are income)
    const transactionStats = await transactionService.getTransactionStats(userId, periodStart, periodEnd);

    // Get expenses from manual expenses
    const expenseStats = await expenseService.getExpenseStats(userId, periodStart, periodEnd);

    // Calculate totals
    const grossIncome = transactionStats.business_income;
    const transactionExpenses = transactionStats.business_expenses;
    const manualExpenses = expenseStats.business_deductions;
    const totalDeductions = transactionExpenses + manualExpenses;

    // Calculate raw net (can be negative for loss tracking)
    const rawNetProfit = grossIncome - totalDeductions;
    const hasNetLoss = rawNetProfit < 0;
    const lossMessage = hasNetLoss ? 'Net loss may offset other income' : null;

    // Net profit for tax calculation (cannot be negative)
    const netProfit = Math.max(0, rawNetProfit);

    // Self-Employment Tax Calculation using the validated formula
    const seCalc = this.calculateSelfEmploymentTax(netProfit);
    const seTaxableIncome = seCalc.se_taxable_income;
    const selfEmploymentTax = seCalc.self_employment_tax;
    const seTaxDeduction = seCalc.se_tax_deduction;

    // Income Tax Calculation
    const adjustedGrossIncome = netProfit - seTaxDeduction;
    const taxableIncome = Math.max(0, adjustedGrossIncome); // Simplified - no standard deduction applied here
    const incomeTax = this.calculateIncomeTax(taxableIncome, filingStatus);

    // Total annual tax liability
    const totalTaxLiability = selfEmploymentTax + incomeTax;

    // Quarterly payment (divide by 4)
    const quarterlyPaymentDue = totalTaxLiability / 4;

    // Apply W2 withholding - this reduces tax OWED, not income
    // W2 withholding is applied against the quarterly tax liability
    const w2QuarterlyWithholding = w2WithholdingAnnual / 4;
    const netQuarterlyPayment = Math.max(0, quarterlyPaymentDue - w2QuarterlyWithholding);

    // Effective tax rate
    const effectiveTaxRate = grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

    // Assess quarterly payment requirement based on TAX LIABILITY (not income)
    // IRS threshold is $1,000 tax owed, not $5,000 income
    const quarterlyRequirement = this.assessQuarterlyRequirement(totalTaxLiability);

    const result: TaxCalculationResult = {
      tax_year: taxYear,
      quarter,
      period_start: periodStart,
      period_end: periodEnd,
      gross_income: grossIncome,
      income_by_platform: transactionStats.income_by_platform,
      total_deductions: totalDeductions,
      deductions_by_category: {
        ...transactionStats.expenses_by_category,
        ...expenseStats.expenses_by_category,
      },
      net_profit: netProfit,
      has_net_loss: hasNetLoss,
      loss_message: lossMessage,
      se_taxable_income: seTaxableIncome,
      self_employment_tax: selfEmploymentTax,
      se_tax_deduction: seTaxDeduction,
      adjusted_gross_income: adjustedGrossIncome,
      taxable_income: taxableIncome,
      income_tax: incomeTax,
      effective_tax_rate: effectiveTaxRate,
      total_tax_liability: totalTaxLiability,
      quarterly_payment_due: quarterlyPaymentDue,
      w2_withholding_applied: w2QuarterlyWithholding,
      net_quarterly_payment: netQuarterlyPayment,
      quarterly_requirement: quarterlyRequirement,
      calculated_at: new Date(),
    };

    // Save or update tax estimate in database
    await this.saveTaxEstimate(userId, result);

    return result;
  }

  /**
   * Calculate YTD tax estimate (sum of all quarters up to current)
   */
  async calculateYTDEstimate(userId: string, taxYear?: number): Promise<TaxCalculationResult> {
    const year = taxYear || new Date().getFullYear();
    const currentQuarter = this.getCurrentQuarter();

    // Calculate YTD from start of year to end of current quarter
    const periodStart = new Date(year, 0, 1);
    const periodEnd = this.getQuarterDates(year, currentQuarter).periodEnd;

    // Get user tax settings
    const userResult = await query(
      'SELECT tax_filing_status, marginal_tax_rate, w2_withholding_annual FROM users WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const user = userResult.rows[0];
    const filingStatus = user.tax_filing_status as TaxFilingStatus;
    const w2WithholdingAnnual = parseFloat(user.w2_withholding_annual) || 0;

    // Get YTD transaction stats
    const transactionStats = await transactionService.getTransactionStats(userId, periodStart, periodEnd);

    // Get YTD expense stats
    const expenseStats = await expenseService.getExpenseStats(userId, periodStart, periodEnd);

    // Calculate totals
    const grossIncome = transactionStats.business_income;
    const totalDeductions = transactionStats.business_expenses + expenseStats.business_deductions;

    // Calculate raw net (can be negative for loss tracking)
    const rawNetProfit = grossIncome - totalDeductions;
    const hasNetLoss = rawNetProfit < 0;
    const lossMessage = hasNetLoss ? 'Net loss may offset other income' : null;

    // Net profit for tax calculation (cannot be negative)
    const netProfit = Math.max(0, rawNetProfit);

    // SE Tax using validated formula
    const seCalc = this.calculateSelfEmploymentTax(netProfit);
    const seTaxableIncome = seCalc.se_taxable_income;
    const selfEmploymentTax = seCalc.self_employment_tax;
    const seTaxDeduction = seCalc.se_tax_deduction;

    // Income Tax
    const adjustedGrossIncome = netProfit - seTaxDeduction;
    const taxableIncome = Math.max(0, adjustedGrossIncome);
    const incomeTax = this.calculateIncomeTax(taxableIncome, filingStatus);

    const totalTaxLiability = selfEmploymentTax + incomeTax;
    const quarterlyPaymentDue = totalTaxLiability / 4;

    // W2 withholding reduces tax OWED, not income
    const w2QuarterlyWithholding = w2WithholdingAnnual / 4;
    const netQuarterlyPayment = Math.max(0, quarterlyPaymentDue - w2QuarterlyWithholding);
    const effectiveTaxRate = grossIncome > 0 ? (totalTaxLiability / grossIncome) * 100 : 0;

    // Assess quarterly requirement based on tax liability ($1,000 threshold)
    const quarterlyRequirement = this.assessQuarterlyRequirement(totalTaxLiability);

    return {
      tax_year: year,
      quarter: currentQuarter,
      period_start: periodStart,
      period_end: periodEnd,
      gross_income: grossIncome,
      income_by_platform: transactionStats.income_by_platform,
      total_deductions: totalDeductions,
      deductions_by_category: {
        ...transactionStats.expenses_by_category,
        ...expenseStats.expenses_by_category,
      },
      net_profit: netProfit,
      has_net_loss: hasNetLoss,
      loss_message: lossMessage,
      se_taxable_income: seTaxableIncome,
      self_employment_tax: selfEmploymentTax,
      se_tax_deduction: seTaxDeduction,
      adjusted_gross_income: adjustedGrossIncome,
      taxable_income: taxableIncome,
      income_tax: incomeTax,
      effective_tax_rate: effectiveTaxRate,
      total_tax_liability: totalTaxLiability,
      quarterly_payment_due: quarterlyPaymentDue,
      w2_withholding_applied: w2QuarterlyWithholding,
      net_quarterly_payment: netQuarterlyPayment,
      quarterly_requirement: quarterlyRequirement,
      calculated_at: new Date(),
    };
  }

  /**
   * Get threshold status for 1099 reporting
   */
  async getThresholdStatus(userId: string, taxYear?: number): Promise<ThresholdStatus> {
    const year = taxYear || new Date().getFullYear();
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    // Get income by platform from transactions
    const transactionStats = await transactionService.getTransactionStats(userId, yearStart, yearEnd);

    const incomeByPlatform = transactionStats.income_by_platform;
    const total1099Income = Object.values(incomeByPlatform).reduce((sum, val) => sum + val, 0);

    // Build platform status array
    const platforms = Object.entries(incomeByPlatform).map(([platform, income]) => ({
      platform,
      income,
      threshold_reached: income >= IRS_REPORTING_THRESHOLD,
      percent_of_threshold: (income / IRS_REPORTING_THRESHOLD) * 100,
    }));

    // Sort by income descending
    platforms.sort((a, b) => b.income - a.income);

    const threshold5000Reached = total1099Income >= IRS_REPORTING_THRESHOLD;
    const threshold4000Warning = total1099Income >= IRS_WARNING_THRESHOLD && !threshold5000Reached;
    const amountUntilThreshold = Math.max(0, IRS_REPORTING_THRESHOLD - total1099Income);

    // Update or create threshold tracking record
    await this.updateThresholdTracking(userId, year, total1099Income, incomeByPlatform, threshold5000Reached);

    return {
      tax_year: year,
      total_1099_income: total1099Income,
      platforms,
      threshold_5000_reached: threshold5000Reached,
      threshold_4000_warning: threshold4000Warning,
      amount_until_threshold: amountUntilThreshold,
    };
  }

  /**
   * Record an estimated tax payment
   */
  async recordPayment(
    userId: string,
    taxYear: number,
    quarter: number,
    amount: number,
    paymentDate: Date,
    paymentMethod: string,
    confirmationNumber?: string,
    notes?: string
  ): Promise<EstimatedPayment> {
    const paymentId = uuidv4();

    await query(
      `INSERT INTO estimated_payments (
        payment_id, user_id, tax_year, quarter,
        payment_date, amount, payment_method, confirmation_number, notes,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        paymentId,
        userId,
        taxYear,
        quarter,
        paymentDate,
        amount,
        paymentMethod,
        confirmationNumber || null,
        notes || null,
      ]
    );

    return {
      payment_id: paymentId,
      user_id: userId,
      tax_year: taxYear,
      quarter,
      payment_date: paymentDate,
      amount,
      payment_method: paymentMethod,
      confirmation_number: confirmationNumber || null,
      notes: notes || null,
      created_at: new Date(),
    };
  }

  /**
   * Get payments for a tax year
   */
  async getPayments(userId: string, taxYear?: number): Promise<EstimatedPayment[]> {
    const year = taxYear || new Date().getFullYear();

    const result = await query(
      `SELECT * FROM estimated_payments
       WHERE user_id = $1 AND tax_year = $2
       ORDER BY quarter, payment_date`,
      [userId, year]
    );

    return result.rows.map(row => ({
      payment_id: row.payment_id,
      user_id: row.user_id,
      tax_year: row.tax_year,
      quarter: row.quarter,
      payment_date: new Date(row.payment_date),
      amount: parseFloat(row.amount),
      payment_method: row.payment_method,
      confirmation_number: row.confirmation_number,
      notes: row.notes,
      created_at: new Date(row.created_at),
    }));
  }

  /**
   * Get total payments made for a quarter
   */
  async getQuarterPayments(userId: string, taxYear: number, quarter: number): Promise<number> {
    const result = await query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM estimated_payments
       WHERE user_id = $1 AND tax_year = $2 AND quarter = $3`,
      [userId, taxYear, quarter]
    );

    return parseFloat(result.rows[0].total) || 0;
  }

  /**
   * Get upcoming tax deadline
   */
  async getNextDeadline(userId: string): Promise<TaxDeadlineInfo | null> {
    const now = new Date();
    const currentYear = now.getFullYear();

    const result = await query(
      `SELECT * FROM tax_deadlines
       WHERE due_date >= $1 AND tax_year >= $2
       ORDER BY due_date ASC
       LIMIT 1`,
      [now, currentYear - 1]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const deadline = result.rows[0];
    const dueDate = new Date(deadline.due_date);
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      tax_year: deadline.tax_year,
      quarter: deadline.quarter,
      period_start: new Date(deadline.period_start_date),
      period_end: new Date(deadline.period_end_date),
      due_date: dueDate,
      days_until_due: daysUntilDue,
      is_overdue: daysUntilDue < 0,
    };
  }

  /**
   * Get all deadlines for a tax year
   */
  async getDeadlines(taxYear?: number): Promise<TaxDeadlineInfo[]> {
    const year = taxYear || new Date().getFullYear();
    const now = new Date();

    const result = await query(
      `SELECT * FROM tax_deadlines WHERE tax_year = $1 ORDER BY quarter`,
      [year]
    );

    return result.rows.map(row => {
      const dueDate = new Date(row.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        tax_year: row.tax_year,
        quarter: row.quarter,
        period_start: new Date(row.period_start_date),
        period_end: new Date(row.period_end_date),
        due_date: dueDate,
        days_until_due: daysUntilDue,
        is_overdue: daysUntilDue < 0,
      };
    });
  }

  /**
   * Get saved tax estimates for a user
   */
  async getSavedEstimates(userId: string, taxYear?: number): Promise<TaxEstimate[]> {
    const year = taxYear || new Date().getFullYear();

    const result = await query(
      `SELECT * FROM tax_estimates
       WHERE user_id = $1 AND tax_year = $2
       ORDER BY quarter`,
      [userId, year]
    );

    return result.rows.map(row => this.mapToTaxEstimate(row));
  }

  // =============================================================================
  // QUARTERLY REQUIREMENT ASSESSMENT
  // =============================================================================

  /**
   * Assess whether quarterly tax payments are likely required
   * Based on IRS rules: quarterly payments generally required if tax liability >= $1,000
   *
   * IMPORTANT: This is based on TAX LIABILITY, not income threshold
   * The old $5,000 income threshold was incorrect - IRS uses $1,000 tax owed threshold
   */
  assessQuarterlyRequirement(expectedAnnualTaxLiability: number): QuarterlyRequirementAssessment {
    const quarterlyRequired = expectedAnnualTaxLiability >= QUARTERLY_TAX_LIABILITY_THRESHOLD;

    let assessmentMessage: string;
    if (quarterlyRequired) {
      assessmentMessage = 'Quarterly payments generally required';
    } else {
      assessmentMessage = 'No quarterly payment likely required';
    }

    return {
      quarterly_payments_required: quarterlyRequired,
      expected_annual_tax_liability: expectedAnnualTaxLiability,
      threshold_amount: QUARTERLY_TAX_LIABILITY_THRESHOLD,
      assessment_message: assessmentMessage,
      disclaimer: 'This assessment is based on current IRS guidance and your estimated tax liability. Consult a tax professional for personalized advice.',
    };
  }

  // =============================================================================
  // SELF-EMPLOYMENT TAX CALCULATIONS (Public for testing)
  // =============================================================================

  /**
   * Calculate self-employment tax using IRS formula
   *
   * Formula:
   * 1. SE taxable income = Net profit * 0.9235 (92.35%)
   * 2. SE tax = SE taxable income * 0.153 (15.3% = 12.4% SS + 2.9% Medicare)
   * 3. SE tax deduction = SE tax / 2 (half is deductible)
   *
   * Special cases:
   * - Net profit <= 0: SE tax = $0
   * - SE taxable income <= 0: SE tax = $0
   */
  calculateSelfEmploymentTax(netProfit: number): {
    se_taxable_income: number;
    self_employment_tax: number;
    se_tax_deduction: number;
  } {
    // No SE tax on zero or negative net profit
    if (netProfit <= 0) {
      return {
        se_taxable_income: 0,
        self_employment_tax: 0,
        se_tax_deduction: 0,
      };
    }

    // Step 1: Calculate SE taxable income (92.35% of net profit)
    const seTaxableIncome = netProfit * SE_INCOME_MULTIPLIER;

    // Step 2: Calculate SE tax (15.3% of SE taxable income)
    const selfEmploymentTax = seTaxableIncome * SE_TAX_RATE;

    // Step 3: Calculate deductible portion (half of SE tax)
    const seTaxDeduction = selfEmploymentTax / 2;

    return {
      se_taxable_income: seTaxableIncome,
      self_employment_tax: selfEmploymentTax,
      se_tax_deduction: seTaxDeduction,
    };
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  /**
   * Calculate income tax using federal brackets
   */
  private calculateIncomeTax(taxableIncome: number, _filingStatus: TaxFilingStatus): number {
    // Using single filer brackets for now
    // In production, would adjust brackets based on filing status
    let tax = 0;
    let remainingIncome = taxableIncome;

    for (const bracket of FEDERAL_TAX_BRACKETS_2026) {
      if (remainingIncome <= 0) break;

      const bracketSize = bracket.max - bracket.min;
      const taxableInBracket = Math.min(remainingIncome, bracketSize);
      tax += taxableInBracket * (bracket.rate / 100);
      remainingIncome -= taxableInBracket;
    }

    return tax;
  }

  /**
   * Get quarter start and end dates
   */
  private getQuarterDates(year: number, quarter: number): { periodStart: Date; periodEnd: Date } {
    const quarterMonths = [
      { start: 0, end: 2 },   // Q1: Jan-Mar
      { start: 3, end: 5 },   // Q2: Apr-Jun
      { start: 6, end: 8 },   // Q3: Jul-Sep
      { start: 9, end: 11 },  // Q4: Oct-Dec
    ];

    const q = quarterMonths[quarter - 1];
    const periodStart = new Date(year, q.start, 1);
    const periodEnd = new Date(year, q.end + 1, 0); // Last day of end month

    return { periodStart, periodEnd };
  }

  /**
   * Get current quarter (1-4)
   */
  private getCurrentQuarter(): number {
    const month = new Date().getMonth();
    return Math.floor(month / 3) + 1;
  }

  /**
   * Save or update tax estimate in database
   */
  private async saveTaxEstimate(userId: string, calc: TaxCalculationResult): Promise<void> {
    const estimateId = uuidv4();

    // Upsert tax estimate
    await query(
      `INSERT INTO tax_estimates (
        tax_estimate_id, user_id, tax_year, quarter,
        period_start_date, period_end_date,
        total_income, income_by_platform,
        total_deductions, deductions_by_category,
        net_profit, se_taxable_income, self_employment_tax, se_tax_deduction,
        taxable_income, income_tax, effective_tax_rate,
        w2_withholding_applied, total_tax_owed, quarterly_payment_amount,
        calculation_status, calculated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW()
      )
      ON CONFLICT (user_id, tax_year, quarter)
      DO UPDATE SET
        total_income = EXCLUDED.total_income,
        income_by_platform = EXCLUDED.income_by_platform,
        total_deductions = EXCLUDED.total_deductions,
        deductions_by_category = EXCLUDED.deductions_by_category,
        net_profit = EXCLUDED.net_profit,
        se_taxable_income = EXCLUDED.se_taxable_income,
        self_employment_tax = EXCLUDED.self_employment_tax,
        se_tax_deduction = EXCLUDED.se_tax_deduction,
        taxable_income = EXCLUDED.taxable_income,
        income_tax = EXCLUDED.income_tax,
        effective_tax_rate = EXCLUDED.effective_tax_rate,
        w2_withholding_applied = EXCLUDED.w2_withholding_applied,
        total_tax_owed = EXCLUDED.total_tax_owed,
        quarterly_payment_amount = EXCLUDED.quarterly_payment_amount,
        calculation_status = 'current',
        calculated_at = NOW()`,
      [
        estimateId,
        userId,
        calc.tax_year,
        calc.quarter,
        calc.period_start,
        calc.period_end,
        calc.gross_income,
        JSON.stringify(calc.income_by_platform),
        calc.total_deductions,
        JSON.stringify(calc.deductions_by_category),
        calc.net_profit,
        calc.se_taxable_income,
        calc.self_employment_tax,
        calc.se_tax_deduction,
        calc.taxable_income,
        calc.income_tax,
        calc.effective_tax_rate,
        calc.w2_withholding_applied,
        calc.total_tax_liability,
        calc.net_quarterly_payment,
        'current',
      ]
    );
  }

  /**
   * Update threshold tracking record
   */
  private async updateThresholdTracking(
    userId: string,
    taxYear: number,
    total1099Income: number,
    incomeByPlatform: Record<string, number>,
    thresholdReached: boolean
  ): Promise<void> {
    const thresholdId = uuidv4();

    await query(
      `INSERT INTO income_thresholds (
        threshold_id, user_id, tax_year,
        total_1099_income, total_platform_income,
        threshold_5000_reached, threshold_5000_reached_at,
        last_calculated_at, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW()
      )
      ON CONFLICT (user_id, tax_year)
      DO UPDATE SET
        total_1099_income = EXCLUDED.total_1099_income,
        total_platform_income = EXCLUDED.total_platform_income,
        threshold_5000_reached = EXCLUDED.threshold_5000_reached,
        threshold_5000_reached_at = CASE
          WHEN income_thresholds.threshold_5000_reached = FALSE AND EXCLUDED.threshold_5000_reached = TRUE
          THEN NOW()
          ELSE income_thresholds.threshold_5000_reached_at
        END,
        last_calculated_at = NOW(),
        updated_at = NOW()`,
      [
        thresholdId,
        userId,
        taxYear,
        total1099Income,
        JSON.stringify(incomeByPlatform),
        thresholdReached,
        thresholdReached ? new Date() : null,
      ]
    );
  }

  /**
   * Map database row to TaxEstimate
   */
  private mapToTaxEstimate(row: Record<string, unknown>): TaxEstimate {
    return {
      tax_estimate_id: row.tax_estimate_id as string,
      user_id: row.user_id as string,
      tax_year: row.tax_year as number,
      quarter: row.quarter as number,
      period_start_date: new Date(row.period_start_date as string),
      period_end_date: new Date(row.period_end_date as string),
      total_income: parseFloat(row.total_income as string),
      income_by_platform: typeof row.income_by_platform === 'string'
        ? JSON.parse(row.income_by_platform)
        : row.income_by_platform as Record<string, number>,
      total_deductions: parseFloat(row.total_deductions as string),
      deductions_by_category: typeof row.deductions_by_category === 'string'
        ? JSON.parse(row.deductions_by_category)
        : row.deductions_by_category as Record<string, number>,
      net_profit: parseFloat(row.net_profit as string),
      se_taxable_income: parseFloat(row.se_taxable_income as string),
      self_employment_tax: parseFloat(row.self_employment_tax as string),
      se_tax_deduction: parseFloat(row.se_tax_deduction as string),
      taxable_income: parseFloat(row.taxable_income as string),
      income_tax: parseFloat(row.income_tax as string),
      effective_tax_rate: row.effective_tax_rate ? parseFloat(row.effective_tax_rate as string) : null,
      w2_withholding_applied: parseFloat(row.w2_withholding_applied as string),
      total_tax_owed: parseFloat(row.total_tax_owed as string),
      quarterly_payment_amount: parseFloat(row.quarterly_payment_amount as string),
      calculation_status: row.calculation_status as 'current' | 'stale' | 'manual_override',
      calculated_at: new Date(row.calculated_at as string),
    };
  }
}

// Export singleton instance
export const taxService = new TaxService();
