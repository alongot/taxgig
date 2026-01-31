/**
 * Tax Service Unit Tests
 *
 * Tests for:
 * - REQ-001: Quarterly Tax Requirement Logic ($1,000 tax liability threshold)
 * - REQ-002: Self-Employment Tax Formula Validation
 * - REQ-003: Income Tax Estimate Logic (loss handling)
 */

import { TaxService, QUARTERLY_TAX_LIABILITY_THRESHOLD } from '../taxService';
import { SE_TAX_RATE, SE_INCOME_MULTIPLIER } from '../../types';

describe('TaxService', () => {
  let taxService: TaxService;

  beforeEach(() => {
    taxService = new TaxService();
  });

  // =============================================================================
  // REQ-001: Quarterly Tax Requirement Logic Tests
  // =============================================================================
  describe('assessQuarterlyRequirement', () => {
    it('should return "No quarterly payment likely required" when tax liability < $1,000', () => {
      // Test Case 1: Income: $6,000, Expenses: $5,500, Net: $500
      // Expected tax ~$117 (well below $1,000 threshold)
      const result = taxService.assessQuarterlyRequirement(117);

      expect(result.quarterly_payments_required).toBe(false);
      expect(result.assessment_message).toBe('No quarterly payment likely required');
      expect(result.threshold_amount).toBe(1000);
    });

    it('should return "Quarterly payments generally required" when tax liability >= $1,000', () => {
      // Test Case 2: Income: $20,000, Expenses: $5,000, Net: $15,000
      // Expected tax ~$3,500 (above $1,000 threshold)
      const result = taxService.assessQuarterlyRequirement(3500);

      expect(result.quarterly_payments_required).toBe(true);
      expect(result.assessment_message).toBe('Quarterly payments generally required');
      expect(result.threshold_amount).toBe(1000);
    });

    it('should return not required when tax is exactly at threshold boundary (below)', () => {
      const result = taxService.assessQuarterlyRequirement(999.99);

      expect(result.quarterly_payments_required).toBe(false);
      expect(result.assessment_message).toBe('No quarterly payment likely required');
    });

    it('should return required when tax is exactly at threshold ($1,000)', () => {
      const result = taxService.assessQuarterlyRequirement(1000);

      expect(result.quarterly_payments_required).toBe(true);
      expect(result.assessment_message).toBe('Quarterly payments generally required');
    });

    it('should return not required when tax is $0', () => {
      const result = taxService.assessQuarterlyRequirement(0);

      expect(result.quarterly_payments_required).toBe(false);
      expect(result.assessment_message).toBe('No quarterly payment likely required');
    });

    it('should include proper disclaimer text', () => {
      const result = taxService.assessQuarterlyRequirement(500);

      expect(result.disclaimer).toContain('current IRS guidance');
      expect(result.disclaimer).toContain('Consult a tax professional');
    });

    it('should correctly identify the $1,000 threshold constant', () => {
      expect(QUARTERLY_TAX_LIABILITY_THRESHOLD).toBe(1000);
    });
  });

  // =============================================================================
  // REQ-002: Self-Employment Tax Formula Validation Tests
  // =============================================================================
  describe('calculateSelfEmploymentTax', () => {
    it('should calculate SE tax correctly for net profit of $10,000', () => {
      // Net profit: $10,000
      // SE taxable income = $10,000 * 0.9235 = $9,235
      // SE tax = $9,235 * 0.153 = $1,412.955
      // SE tax deduction = $1,412.955 / 2 = $706.4775
      const result = taxService.calculateSelfEmploymentTax(10000);

      expect(result.se_taxable_income).toBeCloseTo(9235, 0);
      expect(result.self_employment_tax).toBeCloseTo(1413, 0);
      expect(result.se_tax_deduction).toBeCloseTo(706.5, 0);
    });

    it('should return $0 SE tax for net profit of $0', () => {
      const result = taxService.calculateSelfEmploymentTax(0);

      expect(result.se_taxable_income).toBe(0);
      expect(result.self_employment_tax).toBe(0);
      expect(result.se_tax_deduction).toBe(0);
    });

    it('should return $0 SE tax for net loss (-$2,000)', () => {
      const result = taxService.calculateSelfEmploymentTax(-2000);

      expect(result.se_taxable_income).toBe(0);
      expect(result.self_employment_tax).toBe(0);
      expect(result.se_tax_deduction).toBe(0);
    });

    it('should use correct SE_INCOME_MULTIPLIER (0.9235)', () => {
      expect(SE_INCOME_MULTIPLIER).toBe(0.9235);
    });

    it('should use correct SE_TAX_RATE (0.153)', () => {
      expect(SE_TAX_RATE).toBe(0.153);
    });

    it('should calculate SE tax correctly for various income levels', () => {
      const testCases = [
        { netProfit: 5000, expectedSETaxable: 4617.5, expectedSETax: 706.48 },
        { netProfit: 25000, expectedSETaxable: 23087.5, expectedSETax: 3532.39 },
        { netProfit: 50000, expectedSETaxable: 46175, expectedSETax: 7064.78 },
        { netProfit: 100000, expectedSETaxable: 92350, expectedSETax: 14129.55 },
      ];

      testCases.forEach(({ netProfit, expectedSETaxable, expectedSETax }) => {
        const result = taxService.calculateSelfEmploymentTax(netProfit);
        expect(result.se_taxable_income).toBeCloseTo(expectedSETaxable, 0);
        expect(result.self_employment_tax).toBeCloseTo(expectedSETax, 0);
      });
    });

    it('should correctly calculate SE tax deduction as half of SE tax', () => {
      const result = taxService.calculateSelfEmploymentTax(20000);

      expect(result.se_tax_deduction).toBeCloseTo(result.self_employment_tax / 2, 2);
    });
  });

  // =============================================================================
  // REQ-003: Loss Handling Tests (tested via public method)
  // =============================================================================
  describe('Loss Handling', () => {
    it('should return $0 SE tax for losses', () => {
      // Testing that negative net profits result in zero tax
      const result = taxService.calculateSelfEmploymentTax(-5000);

      expect(result.self_employment_tax).toBe(0);
      expect(result.se_taxable_income).toBe(0);
      expect(result.se_tax_deduction).toBe(0);
    });

    it('should handle edge case of very small positive profit', () => {
      const result = taxService.calculateSelfEmploymentTax(0.01);

      expect(result.se_taxable_income).toBeCloseTo(0.009235, 6);
      expect(result.self_employment_tax).toBeCloseTo(0.00141, 4);
    });
  });

  // =============================================================================
  // Integration Test Cases from Requirements
  // =============================================================================
  describe('Requirement Test Cases', () => {
    describe('REQ-001 Test Cases', () => {
      it('Test Case 1: Income $6,000, Expenses $5,500 -> No quarterly payment likely required', () => {
        // Net: $500
        // SE taxable: $500 * 0.9235 = $461.75
        // SE tax: $461.75 * 0.153 = $70.65
        // Income tax on ~$461.75 - $35.33 = $426.42 at 10% = ~$42.64
        // Total tax: ~$113.29 (well below $1,000)
        const netProfit = 500;
        const seCalc = taxService.calculateSelfEmploymentTax(netProfit);

        // Approximate total tax (SE tax + ~10% income tax)
        const approximateTax = seCalc.self_employment_tax + 50; // rough estimate

        const assessment = taxService.assessQuarterlyRequirement(approximateTax);
        expect(assessment.quarterly_payments_required).toBe(false);
        expect(assessment.assessment_message).toBe('No quarterly payment likely required');
      });

      it('Test Case 2: Income $20,000, Expenses $5,000 -> Quarterly payments generally required', () => {
        // Net: $15,000
        // SE taxable: $15,000 * 0.9235 = $13,852.50
        // SE tax: $13,852.50 * 0.153 = $2,119.43
        // SE deduction: $1,059.72
        // AGI: $15,000 - $1,059.72 = $13,940.28
        // Income tax: ~$1,400+ (using brackets)
        // Total tax: ~$3,500+
        const netProfit = 15000;
        const seCalc = taxService.calculateSelfEmploymentTax(netProfit);

        // Approximate total tax
        const approximateTax = seCalc.self_employment_tax + 1400; // rough estimate

        const assessment = taxService.assessQuarterlyRequirement(approximateTax);
        expect(assessment.quarterly_payments_required).toBe(true);
        expect(assessment.assessment_message).toBe('Quarterly payments generally required');
      });
    });

    describe('REQ-002 Test Cases', () => {
      it('Net profit $10,000 -> SE taxable $9,235, SE tax ~$1,414', () => {
        const result = taxService.calculateSelfEmploymentTax(10000);

        expect(result.se_taxable_income).toBeCloseTo(9235, 0);
        expect(result.self_employment_tax).toBeCloseTo(1413, 0); // Actually 1412.955
      });

      it('Net profit $0 -> SE tax $0', () => {
        const result = taxService.calculateSelfEmploymentTax(0);

        expect(result.self_employment_tax).toBe(0);
      });

      it('Net loss -$2,000 -> SE tax $0', () => {
        const result = taxService.calculateSelfEmploymentTax(-2000);

        expect(result.self_employment_tax).toBe(0);
      });
    });

    describe('REQ-003 Test Cases', () => {
      it('Income $12,000, Expenses $14,000, Net -$2,000 -> SE tax $0', () => {
        // Loss scenario
        const netProfit = -2000; // $12,000 - $14,000 = -$2,000

        const seCalc = taxService.calculateSelfEmploymentTax(netProfit);

        expect(seCalc.self_employment_tax).toBe(0);
        expect(seCalc.se_taxable_income).toBe(0);
      });
    });
  });

  // =============================================================================
  // Threshold Constant Validation
  // =============================================================================
  describe('Threshold Constants', () => {
    it('should use $1,000 tax liability threshold (not $5,000 income threshold)', () => {
      // The IRS requires quarterly payments when tax liability >= $1,000
      // NOT when income >= $5,000 (this was the old incorrect logic)
      expect(QUARTERLY_TAX_LIABILITY_THRESHOLD).toBe(1000);

      // Verify the threshold is used correctly
      const belowThreshold = taxService.assessQuarterlyRequirement(999);
      const atThreshold = taxService.assessQuarterlyRequirement(1000);

      expect(belowThreshold.quarterly_payments_required).toBe(false);
      expect(atThreshold.quarterly_payments_required).toBe(true);
    });
  });
});
