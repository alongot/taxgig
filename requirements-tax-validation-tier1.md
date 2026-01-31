# Tax Validation Tier 1 Requirements - CRITICAL FIXES

**Document Version:** 1.0
**Created:** January 30, 2026
**Requirements Architect:** Claude (Ajay's Requirements Team)
**Priority Level:** TIER 1 - SHOWSTOPPERS
**Approval Status:** IMMEDIATE EXECUTION AUTHORIZED BY ISAAC
**Timeline:** Specifications due within 24 hours (COMPLETE)

---

## Executive Summary

This document provides detailed specifications for five critical tax logic corrections that must be implemented before the app can safely launch. These issues represent potential regulatory compliance risks and incorrect tax calculations that could expose users and the company to IRS penalties.

**Ship-Blocking Status:** These requirements MUST be completed before public release.

**Affected Components:**
- Backend tax calculation service (taxService.ts)
- Frontend tax display page (tax/page.tsx)
- Notification messaging (notificationService.ts)
- Blog content (blog-data.ts)
- All user-facing tax messaging

---

## Problem-to-Requirement Mapping

| Problem ID | Problem Description | Requirement ID | Assigned To |
|------------|-------------------|---------------|-------------|
| PROB-001 | Incorrect quarterly tax threshold messaging ($5K income vs. $1K tax owed) | REQ-001 | Rishi |
| PROB-002 | Self-employment tax formula potentially incorrect or misapplied | REQ-002 | Rishi |
| PROB-003 | Income tax estimate logic oversimplified or incorrect | REQ-003 | Rishi |
| PROB-004 | Overconfident/non-compliant language throughout app | REQ-004 | Fronty |
| PROB-005 | Missing disclaimers on all tax calculations | REQ-005 | Fronty |

---

## REQ-001: Quarterly Tax Requirement Logic Correction

### Requirement ID
REQ-001

### Priority
CRITICAL (P0 - Must Fix)

### Assigned To
Rishi (Backend)

### Problem Statement
The application currently contains incorrect messaging stating "Quarterly taxes are mandatory after $5,000 income." This is factually incorrect. Quarterly estimated tax payments are based on expected tax liability, not gross income thresholds.

**Current Incorrect Behavior:**
- Threshold notification at line 299 of notificationService.ts states: "Quarterly tax payments may be required" when $5K is reached
- Blog content at line 547 states: "Once you cross $5,000 in annual side hustle income, start taking quarterly taxes seriously"
- UI may imply that $5K income = mandatory quarterly payments

**Correct IRS Rule:**
Quarterly estimated tax payments are generally required when:
1. Expected federal tax liability ≥ $1,000 for the tax year, AND
2. Withholding + credits < smaller of:
   - 90% of current year tax, OR
   - 100% of prior year tax (110% if AGI > $150K)

### User Story
As a side hustler using TaxGig, I want to receive accurate guidance about when quarterly tax payments are required so that I comply with IRS rules without overpaying or facing penalties.

### Acceptance Criteria

#### GIVEN a user has income and expense data
#### WHEN the system calculates whether quarterly payments are required
#### THEN the system MUST:

1. **Calculate actual expected tax liability** (SE tax + income tax - W2 withholding)
2. **Apply the $1,000 threshold test** to tax owed, not gross income
3. **Display conditional messaging** using "generally required" language, not "mandatory"
4. **Consider W2 withholding** when determining if payments are needed
5. **Account for net profit** (income minus expenses), not gross income

### Technical Specification

#### Backend Changes (taxService.ts)

**File:** `backend/src/services/taxService.ts`

**New Method to Add:**
```typescript
/**
 * Determine if quarterly payments are likely required
 * Based on IRS Publication 505
 */
private assessQuarterlyRequirement(
  totalTaxLiability: number,
  w2WithholdingAnnual: number,
  priorYearTax?: number
): {
  likely_required: boolean;
  reason: string;
  threshold_amount: number;
  estimated_underpayment: number;
} {
  const netLiability = totalTaxLiability - w2WithholdingAnnual;

  // Test 1: Expected to owe < $1,000
  if (netLiability < 1000) {
    return {
      likely_required: false,
      reason: 'Expected tax liability after withholding is less than $1,000',
      threshold_amount: 1000,
      estimated_underpayment: Math.max(0, netLiability)
    };
  }

  // Test 2: W2 withholding covers 90% of current year
  const currentYearSafeHarbor = totalTaxLiability * 0.90;
  if (w2WithholdingAnnual >= currentYearSafeHarbor) {
    return {
      likely_required: false,
      reason: 'W-2 withholding covers at least 90% of estimated tax liability',
      threshold_amount: currentYearSafeHarbor,
      estimated_underpayment: 0
    };
  }

  // Test 3: W2 withholding covers 100% of prior year (if available)
  if (priorYearTax && w2WithholdingAnnual >= priorYearTax) {
    return {
      likely_required: false,
      reason: 'W-2 withholding covers 100% of prior year tax liability (safe harbor)',
      threshold_amount: priorYearTax,
      estimated_underpayment: 0
    };
  }

  // Quarterly payments likely required
  return {
    likely_required: true,
    reason: 'Expected to owe $1,000 or more after withholding and safe harbor tests',
    threshold_amount: 1000,
    estimated_underpayment: netLiability
  };
}
```

**Update TaxCalculationResult Interface:**
Add new fields to the return type:
```typescript
export interface TaxCalculationResult {
  // ... existing fields ...

  // NEW: Quarterly requirement assessment
  quarterly_payment_required: boolean;
  quarterly_requirement_reason: string;
  quarterly_threshold_met: number; // Amount that triggered requirement
}
```

**Update calculateQuarterlyEstimate method:**
- Call `assessQuarterlyRequirement()` before returning result
- Include assessment in returned data
- Store assessment in database (tax_estimates table)

#### API Response Changes

**Endpoint:** `GET /api/tax/estimate`

**Add to response:**
```json
{
  "quarterly_payment_required": boolean,
  "quarterly_requirement_reason": string,
  "quarterly_threshold_met": number
}
```

### Test Cases

#### Test Case 1: High Income, High Expenses, Low Tax
**Input:**
- Gross Income: $6,000
- Business Expenses: $5,500
- Net Profit: $500
- W2 Withholding: $0
- Filing Status: Single

**Expected Calculation:**
- SE Taxable Income: $500 × 0.9235 = $461.75
- SE Tax: $461.75 × 0.153 = $70.65
- SE Tax Deduction: $70.65 / 2 = $35.33
- Adjusted Gross Income: $500 - $35.33 = $464.67
- Income Tax (10% bracket): $464.67 × 0.10 = $46.47
- Total Tax Liability: $70.65 + $46.47 = $117.12

**Expected Output:**
```json
{
  "quarterly_payment_required": false,
  "quarterly_requirement_reason": "Expected tax liability after withholding is less than $1,000",
  "net_quarterly_payment": 29.28,
  "message": "Based on current estimates, quarterly payments may not be required. Your estimated annual tax liability ($117) is below the $1,000 threshold."
}
```

#### Test Case 2: Moderate Income, W2 Coverage
**Input:**
- Gross Income: $15,000
- Business Expenses: $3,000
- Net Profit: $12,000
- W2 Withholding Annual: $3,000
- Filing Status: Single

**Expected Calculation:**
- SE Taxable Income: $12,000 × 0.9235 = $11,082
- SE Tax: $11,082 × 0.153 = $1,695.55
- SE Tax Deduction: $847.77
- AGI: $11,152.23
- Income Tax: ~$1,198
- Total Tax: $2,893.55
- After W2 Withholding: $2,893.55 - $3,000 = -$106.45

**Expected Output:**
```json
{
  "quarterly_payment_required": false,
  "quarterly_requirement_reason": "W-2 withholding covers at least 90% of estimated tax liability",
  "net_quarterly_payment": 0,
  "message": "Your W-2 withholding appears sufficient to cover your side hustle taxes. Quarterly payments may not be required."
}
```

#### Test Case 3: Net Loss Scenario
**Input:**
- Gross Income: $12,000
- Business Expenses: $14,000
- Net Profit: -$2,000
- W2 Withholding: $0

**Expected Calculation:**
- Net Profit (capped at 0): $0
- SE Tax: $0
- Income Tax: $0
- Total Tax: $0

**Expected Output:**
```json
{
  "quarterly_payment_required": false,
  "quarterly_requirement_reason": "Expected tax liability after withholding is less than $1,000",
  "net_quarterly_payment": 0,
  "message": "You have a net loss for this period. This may offset other income on your tax return. Quarterly payments are not required for this side hustle income."
}
```

#### Test Case 4: High Net Profit, Payments Required
**Input:**
- Gross Income: $25,000
- Business Expenses: $5,000
- Net Profit: $20,000
- W2 Withholding: $0

**Expected Calculation:**
- SE Tax: ~$2,826
- Income Tax: ~$1,897
- Total Tax: ~$4,723
- Net After Withholding: $4,723

**Expected Output:**
```json
{
  "quarterly_payment_required": true,
  "quarterly_requirement_reason": "Expected to owe $1,000 or more after withholding and safe harbor tests",
  "quarterly_threshold_met": 1000,
  "net_quarterly_payment": 1180.75,
  "message": "Based on current estimates, quarterly tax payments are generally required. Your estimated annual tax liability ($4,723) exceeds the $1,000 threshold."
}
```

### Edge Cases to Handle

1. **Zero income scenario:** Return `quarterly_payment_required: false` with appropriate messaging
2. **Negative net profit:** Treat as $0 for tax calculation, inform user about loss carryforward
3. **Very high W2 withholding:** Recognize safe harbor and avoid suggesting unnecessary payments
4. **Prior year data unavailable:** Skip safe harbor test #3, document assumption
5. **Mid-year user signup:** Pro-rate thresholds or calculate YTD accurately

### Out of Scope

- State tax quarterly requirements (future enhancement)
- Alternative minimum tax (AMT) calculations
- Tax credit calculations beyond W2 withholding
- Multi-year loss carryforward tracking
- Partnership/S-corp income treatment

### Success Metrics

1. **Accuracy:** Tax liability calculation matches manual computation within $5
2. **Messaging accuracy:** No instances of "$5K = mandatory quarterly taxes"
3. **User clarity:** Beta users understand when/why quarterly payments are needed (survey)
4. **Compliance:** Logic aligns with IRS Publication 505 rules

### Dependencies

- User must have W2 withholding data in profile (or assume $0)
- Prior year tax data (optional, improves accuracy)
- Accurate income and expense data for the period

### Risks and Assumptions

**Assumptions:**
- User's marginal tax rate doesn't dramatically change mid-year
- No significant non-W2 withholding (estimated payments already made)
- Standard deduction applies (not itemizing)
- No dependents or credits beyond standard

**Risks:**
- Oversimplification may still produce inaccurate estimates for complex tax situations
- Users may misunderstand "generally required" as optional when it's not for them

**Mitigation:**
- Add disclaimer: "This is an estimate. Consult a tax professional for your specific situation."
- Provide link to IRS Publication 505 for users who want official guidance

---

## REQ-002: Self-Employment Tax Formula Validation

### Requirement ID
REQ-002

### Priority
CRITICAL (P0 - Must Fix)

### Assigned To
Rishi (Backend)

### Problem Statement
The current self-employment tax calculation must be validated for correctness. Common bugs in SE tax calculations include applying 15.3% directly to net profit without the 92.35% adjustment, or incorrectly handling the deductible portion.

**Current Implementation Location:**
- File: `backend/src/services/taxService.ts`
- Lines 158-160 (calculateQuarterlyEstimate)
- Lines 250-252 (calculateYTDEstimate)

**Current Code:**
```typescript
const seTaxableIncome = netProfit * SE_INCOME_MULTIPLIER; // 92.35% of net
const selfEmploymentTax = seTaxableIncome * SE_TAX_RATE; // 15.3%
const seTaxDeduction = selfEmploymentTax / 2; // Deductible portion
```

**Potential Issues to Verify:**
1. Is SE_INCOME_MULTIPLIER correctly set to 0.9235?
2. Is SE_TAX_RATE correctly set to 0.153?
3. Is the deductible portion correctly applied when calculating income tax?
4. Are losses handled correctly (SE tax should be $0 on negative income)?

### User Story
As a side hustler using TaxGig, I want my self-employment tax calculated correctly according to IRS rules so that I set aside the right amount and avoid surprises at tax time.

### Acceptance Criteria

#### GIVEN a user has self-employment income
#### WHEN the system calculates self-employment tax
#### THEN the system MUST:

1. **Apply 92.35% adjustment** to net self-employment income before calculating SE tax
2. **Apply 15.3% rate** (12.4% Social Security + 2.9% Medicare) to the adjusted amount
3. **Calculate deductible portion** as exactly 50% of SE tax
4. **Subtract SE tax deduction** from net profit before calculating income tax
5. **Handle negative income** by returning $0 SE tax (not negative)
6. **Handle SE income > $168,600** by applying SS cap (2026 limit - FUTURE ENHANCEMENT, document as known limitation)

### Technical Specification

#### Constants Validation

**File:** `backend/src/types/index.ts` (lines 628-629)

**Current Values - VERIFY THESE ARE CORRECT:**
```typescript
export const SE_TAX_RATE = 0.153; // 15.3% ✓ CORRECT
export const SE_INCOME_MULTIPLIER = 0.9235; // 92.35% ✓ CORRECT
```

**Action Required:** Code review confirms these are correct. No changes needed.

#### Formula Implementation Review

**File:** `backend/src/services/taxService.ts`

**Current Implementation:**
```typescript
// Line 155-165
const netProfit = Math.max(0, grossIncome - totalDeductions);

// Self-Employment Tax Calculation
const seTaxableIncome = netProfit * SE_INCOME_MULTIPLIER; // 92.35% of net
const selfEmploymentTax = seTaxableIncome * SE_TAX_RATE; // 15.3%
const seTaxDeduction = selfEmploymentTax / 2; // Deductible portion

// Income Tax Calculation
const adjustedGrossIncome = netProfit - seTaxDeduction;
const taxableIncome = Math.max(0, adjustedGrossIncome);
```

**STATUS:** Formula is CORRECT as implemented.

**Verification Needed:**
1. ✓ Net profit is correctly capped at 0 (line 155)
2. ✓ SE taxable income applies 92.35% multiplier
3. ✓ SE tax applies 15.3% rate
4. ✓ Deductible portion is 50% of SE tax
5. ✓ Deduction is subtracted before income tax calculation

#### Required Changes

**ADD INLINE DOCUMENTATION:**

Update lines 157-165 with detailed comments:

```typescript
/**
 * Self-Employment Tax Calculation (IRS Schedule SE)
 *
 * Step 1: Calculate SE taxable income
 * - Net profit is reduced by 7.65% to account for employer-equivalent portion
 * - Formula: Net Profit × 92.35% (which is 100% - 7.65%)
 *
 * Step 2: Calculate SE tax
 * - 12.4% for Social Security (on income up to $168,600 in 2026)
 * - 2.9% for Medicare (no income limit)
 * - Total: 15.3%
 * - Note: SS wage base limit NOT currently implemented (assumes income < $168,600)
 *
 * Step 3: Calculate deductible portion
 * - Exactly half of SE tax is deductible when calculating income tax
 * - This represents the "employer" portion
 */
const netProfit = Math.max(0, grossIncome - totalDeductions);

// Step 1: SE Taxable Income = Net Profit × 92.35%
const seTaxableIncome = netProfit * SE_INCOME_MULTIPLIER;

// Step 2: SE Tax = SE Taxable Income × 15.3%
const selfEmploymentTax = seTaxableIncome * SE_TAX_RATE;

// Step 3: Deductible Portion = SE Tax ÷ 2
const seTaxDeduction = selfEmploymentTax / 2;

// Income Tax Calculation uses AGI after SE tax deduction
const adjustedGrossIncome = netProfit - seTaxDeduction;
const taxableIncome = Math.max(0, adjustedGrossIncome);
```

**ADD UNIT TESTS:**

Create new test file: `backend/src/services/__tests__/taxService.test.ts`

```typescript
describe('Self-Employment Tax Calculation', () => {

  test('should calculate SE tax correctly for standard income', () => {
    const netProfit = 10000;
    const expectedSETaxableIncome = 10000 * 0.9235; // 9235
    const expectedSETax = 9235 * 0.153; // 1412.955
    const expectedDeduction = 1412.955 / 2; // 706.4775

    // Call service method and assert
    expect(result.se_taxable_income).toBeCloseTo(9235, 2);
    expect(result.self_employment_tax).toBeCloseTo(1412.96, 2);
    expect(result.se_tax_deduction).toBeCloseTo(706.48, 2);
  });

  test('should return zero SE tax for zero income', () => {
    const netProfit = 0;
    // Assert all SE values are 0
  });

  test('should return zero SE tax for negative income', () => {
    const grossIncome = 5000;
    const expenses = 7000;
    const netProfit = -2000;
    // Assert SE tax = 0, not negative
  });

  test('should correctly reduce AGI by SE tax deduction', () => {
    const netProfit = 10000;
    const seTax = 1412.96;
    const seDeduction = 706.48;
    const expectedAGI = 10000 - 706.48; // 9293.52

    // Assert AGI calculation is correct
  });
});
```

### Test Cases

#### Test Case 1: Standard SE Tax Calculation
**Input:**
- Net Profit: $10,000

**Step-by-Step Calculation:**
1. SE Taxable Income = $10,000 × 0.9235 = $9,235
2. SE Tax = $9,235 × 0.153 = $1,412.96
3. SE Tax Deduction = $1,412.96 ÷ 2 = $706.48
4. Adjusted Gross Income = $10,000 - $706.48 = $9,293.52

**Expected Output:**
```json
{
  "net_profit": 10000.00,
  "se_taxable_income": 9235.00,
  "self_employment_tax": 1412.96,
  "se_tax_deduction": 706.48,
  "adjusted_gross_income": 9293.52
}
```

#### Test Case 2: Zero Income
**Input:**
- Net Profit: $0

**Expected Output:**
```json
{
  "net_profit": 0.00,
  "se_taxable_income": 0.00,
  "self_employment_tax": 0.00,
  "se_tax_deduction": 0.00,
  "adjusted_gross_income": 0.00
}
```

#### Test Case 3: Negative Income (Loss)
**Input:**
- Gross Income: $5,000
- Expenses: $7,000
- Net Profit: -$2,000

**Expected Behavior:**
- Net profit floored at $0 (line 155: `Math.max(0, grossIncome - totalDeductions)`)
- All SE tax values = $0

**Expected Output:**
```json
{
  "net_profit": 0.00,
  "se_taxable_income": 0.00,
  "self_employment_tax": 0.00,
  "se_tax_deduction": 0.00,
  "adjusted_gross_income": 0.00
}
```

#### Test Case 4: High Income (Verify No Double-Counting)
**Input:**
- Q1 Net Profit: $10,000
- Q2 Net Profit: $10,000
- Q3 Net Profit: $10,000
- Q4 Net Profit: $10,000
- YTD Net Profit: $40,000

**Expected Behavior:**
- YTD SE Tax = ($40,000 × 0.9235 × 0.153) = $5,651.82
- NOT: (Q1 SE Tax + Q2 SE Tax + Q3 SE Tax + Q4 SE Tax) - this would be incorrect

**Verification:**
- Confirm `calculateYTDEstimate` recalculates from scratch, doesn't sum quarterly estimates
- Confirm no double-counting occurs

### Edge Cases to Handle

1. **Very small income ($1):** Should calculate correctly, not round to zero
2. **Exactly $168,600 (SS wage base):** Document that cap is not implemented (FUTURE)
3. **Income > $168,600:** Document known limitation, add to backlog
4. **Penny rounding:** Ensure calculations round to nearest cent consistently

### Common Bugs to Prevent

**BUG #1: Applying 15.3% directly to net profit**
```typescript
// ❌ WRONG
const selfEmploymentTax = netProfit * 0.153;

// ✅ CORRECT
const seTaxableIncome = netProfit * 0.9235;
const selfEmploymentTax = seTaxableIncome * 0.153;
```

**BUG #2: Forgetting to deduct SE tax before calculating income tax**
```typescript
// ❌ WRONG
const taxableIncome = netProfit; // Missing SE tax deduction

// ✅ CORRECT
const adjustedGrossIncome = netProfit - seTaxDeduction;
const taxableIncome = adjustedGrossIncome;
```

**BUG #3: Allowing negative SE tax**
```typescript
// ❌ WRONG
const netProfit = grossIncome - expenses; // Could be negative
const seTax = netProfit * 0.9235 * 0.153; // Would be negative

// ✅ CORRECT
const netProfit = Math.max(0, grossIncome - expenses);
const seTax = netProfit * 0.9235 * 0.153; // Always >= 0
```

**BUG #4: Double-counting SE tax across quarters**
```typescript
// ❌ WRONG (if summing quarterly SE taxes for annual total)
const annualSETax = q1SETax + q2SETax + q3SETax + q4SETax;

// ✅ CORRECT (recalculate from YTD totals)
const ytdNetProfit = ytdIncome - ytdExpenses;
const annualSETax = ytdNetProfit * 0.9235 * 0.153;
```

### Out of Scope

- Social Security wage base cap ($168,600 in 2026) - document as known limitation
- Additional Medicare Tax (0.9% on income > $200K single / $250K married)
- Net Investment Income Tax (3.8% on certain passive income)

### Success Metrics

1. **Formula accuracy:** Manual verification of 10 sample calculations = 100% match
2. **Unit test coverage:** 100% of SE tax calculation paths covered
3. **No rounding errors:** All calculations within $0.01 of expected value
4. **Documentation clarity:** Tax professional can verify correctness from code comments

### Dependencies

- Constants in types/index.ts must remain accurate
- Net profit calculation (income - expenses) must be accurate
- Database must store SE tax breakdown for reporting

### Risks and Assumptions

**Assumptions:**
- User income is below Social Security wage base ($168,600 in 2026)
- User has no other self-employment income being tracked elsewhere
- All income is subject to SE tax (no statutory employee exceptions)

**Risks:**
- High earners (> $168,600) will overpay SE tax until cap is implemented
- Users with multiple self-employment sources may double-count

**Mitigation:**
- Document SS wage base limitation in FAQ
- Add warning if YTD SE income > $150,000 (approaching cap)
- Future: Add input for "other SE income" to track total for cap purposes

---

## REQ-003: Income Tax Estimate Logic Specification

### Requirement ID
REQ-003

### Priority
CRITICAL (P0 - Must Fix)

### Assigned To
Rishi (Backend)

### Problem Statement
The current income tax calculation uses simplified federal tax brackets but must be validated for:
1. Correct marginal rate application (not applying full bracket rates to all income)
2. Proper treatment of W2 withholding (reduces tax owed, NOT taxable income)
3. Correct handling of losses and edge cases

**Current Implementation Location:**
- File: `backend/src/services/taxService.ts`
- Lines 509-525 (calculateIncomeTax method)
- Lines 163-165 (AGI and taxable income calculation)

### User Story
As a side hustler with both W2 income and 1099 income, I want my estimated income tax calculated correctly using marginal rates so that I set aside the right amount for quarterly payments.

### Acceptance Criteria

#### GIVEN a user has taxable income from self-employment
#### WHEN the system calculates income tax
#### THEN the system MUST:

1. **Apply marginal tax rates progressively** (not flat rate to all income)
2. **Use correct 2026 federal tax brackets** for single filer (other statuses = future enhancement)
3. **Reduce tax owed (not income)** by W2 withholding amount
4. **Handle zero/negative taxable income** by returning $0 income tax
5. **Include clear messaging** when simplified assumptions are being used
6. **Calculate effective tax rate** accurately based on actual tax owed

### Technical Specification

#### Current Implementation Review

**File:** `backend/src/services/taxService.ts`

**Current calculateIncomeTax Method (lines 509-525):**
```typescript
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
```

**STATUS:** Formula appears CORRECT for marginal rate application.

**Current Brackets (types/index.ts lines 637-645):**
```typescript
export const FEDERAL_TAX_BRACKETS_2026 = [
  { min: 0, max: 11600, rate: 10 },
  { min: 11600, max: 47150, rate: 12 },
  { min: 47150, max: 100525, rate: 22 },
  { min: 100525, max: 191950, rate: 24 },
  { min: 191950, max: 243725, rate: 32 },
  { min: 243725, max: 609350, rate: 35 },
  { min: 609350, max: Infinity, rate: 37 },
];
```

**VERIFICATION REQUIRED:** Are these the correct 2026 brackets? (Placeholder values)

#### Required Changes

**CHANGE #1: Validate and Document Tax Brackets**

Add comment to `types/index.ts`:
```typescript
/**
 * Federal Tax Brackets for 2026 (Single Filer)
 * SOURCE: IRS Revenue Procedure 2025-XX (PLACEHOLDER - UPDATE WHEN PUBLISHED)
 *
 * IMPORTANT: These are ESTIMATED brackets based on 2025 inflation adjustments.
 * Update with actual 2026 brackets when IRS publishes them (typically Nov 2025).
 *
 * Last Verified: January 30, 2026
 * Verification Status: PLACEHOLDER - REQUIRES IRS CONFIRMATION
 */
export const FEDERAL_TAX_BRACKETS_2026 = [
  { min: 0, max: 11600, rate: 10 },      // Placeholder
  { min: 11600, max: 47150, rate: 12 },  // Placeholder
  { min: 47150, max: 100525, rate: 22 }, // Placeholder
  { min: 100525, max: 191950, rate: 24 },// Placeholder
  { min: 191950, max: 243725, rate: 32 },// Placeholder
  { min: 243725, max: 609350, rate: 35 },// Placeholder
  { min: 609350, max: Infinity, rate: 37 },
];
```

**Action Item:** Research actual 2026 brackets before launch. Use IRS.gov or tax professional.

**CHANGE #2: Add Standard Deduction Handling**

Currently, the code does NOT apply standard deduction. This is acceptable for side hustle estimates (since W2 job typically uses standard deduction), but must be documented.

Add to calculateQuarterlyEstimate method:
```typescript
// Income Tax Calculation
// NOTE: Standard deduction is NOT applied here because:
// 1. Most users with W2 jobs already use standard deduction on their W2 income
// 2. Side hustle income is additional income taxed at marginal rate
// 3. Applying it again would double-count the deduction
// For users with ONLY self-employment income, this may underestimate deductions.
const adjustedGrossIncome = netProfit - seTaxDeduction;
const taxableIncome = Math.max(0, adjustedGrossIncome);
const incomeTax = this.calculateIncomeTax(taxableIncome, filingStatus);
```

**CHANGE #3: Improve W2 Withholding Logic**

Current implementation (lines 174-175) is CORRECT but needs clarification:
```typescript
// Apply W2 withholding (quarterly portion)
const w2QuarterlyWithholding = w2WithholdingAnnual / 4;
const netQuarterlyPayment = Math.max(0, quarterlyPaymentDue - w2QuarterlyWithholding);
```

**Status:** This is correct (withholding reduces tax owed, not income). Add comment:
```typescript
/**
 * W2 Withholding Reduces Tax Owed (Not Taxable Income)
 *
 * W2 withholding is a PAYMENT toward your total tax liability, not a deduction.
 * It reduces the amount you still owe, calculated as:
 *
 * Net Quarterly Payment = (Total Tax Owed / 4) - (W2 Withholding / 4)
 *
 * If W2 withholding is sufficient, net quarterly payment may be $0.
 */
const w2QuarterlyWithholding = w2WithholdingAnnual / 4;
const netQuarterlyPayment = Math.max(0, quarterlyPaymentDue - w2QuarterlyWithholding);
```

**CHANGE #4: Add Loss Carryforward Messaging**

When net profit < 0, add to response:
```typescript
if (netProfit <= 0) {
  // Add informational message
  result.tax_notes = "You have a net loss from this side hustle. This loss may offset other income on your tax return, potentially reducing your overall tax liability. Consult Schedule C instructions or a tax professional for details on loss limitations.";
}
```

#### Unit Tests to Add

```typescript
describe('Income Tax Calculation', () => {

  test('should apply 10% rate to first $11,600', () => {
    const taxableIncome = 10000;
    const expectedTax = 10000 * 0.10; // $1,000
    // Assert
  });

  test('should apply marginal rates correctly across brackets', () => {
    const taxableIncome = 50000;
    // $11,600 at 10% = $1,160
    // $35,550 at 12% = $4,266
    // $2,850 at 22% = $627
    const expectedTax = 1160 + 4266 + 627; // $6,053
    // Assert within $1 due to rounding
  });

  test('should handle income in top bracket', () => {
    const taxableIncome = 700000;
    // Calculate manually and assert
  });

  test('should return zero tax for zero income', () => {
    const taxableIncome = 0;
    const expectedTax = 0;
    // Assert
  });

  test('should reduce tax owed by W2 withholding, not income', () => {
    const totalTax = 5000;
    const w2Withholding = 3000;
    const expectedNetOwed = 2000; // NOT: tax on (income - 3000)
    // Assert
  });
});
```

### Test Cases

#### Test Case 1: Simple Marginal Rate Application
**Input:**
- Taxable Income: $20,000
- Filing Status: Single

**Manual Calculation:**
1. First $11,600 at 10%: $1,160
2. Remaining $8,400 at 12%: $1,008
3. Total Income Tax: $2,168

**Expected Output:**
```json
{
  "taxable_income": 20000.00,
  "income_tax": 2168.00,
  "effective_tax_rate": 10.84
}
```

#### Test Case 2: Loss Scenario
**Input:**
- Gross Income: $12,000
- Expenses: $14,000
- Net Profit: -$2,000
- W2 Withholding: $0

**Expected Behavior:**
- Net profit capped at $0
- SE tax = $0
- Income tax = $0
- Message about loss carryforward

**Expected Output:**
```json
{
  "net_profit": 0.00,
  "self_employment_tax": 0.00,
  "income_tax": 0.00,
  "total_tax_liability": 0.00,
  "quarterly_payment_due": 0.00,
  "tax_notes": "You have a net loss from this side hustle. This loss may offset other income on your tax return..."
}
```

#### Test Case 3: W2 Withholding Coverage
**Input:**
- Side Hustle Net Profit: $10,000
- SE Tax: $1,413
- Income Tax: $1,000
- Total Tax: $2,413
- W2 Withholding Annual: $8,000
- Quarterly: $2,000

**Expected Calculation:**
- Quarterly Payment Due: $2,413 / 4 = $603.25
- W2 Quarterly Withholding: $8,000 / 4 = $2,000
- Net Quarterly Payment: $603.25 - $2,000 = $0 (floored at 0)

**Expected Output:**
```json
{
  "quarterly_payment_due": 603.25,
  "w2_withholding_applied": 2000.00,
  "net_quarterly_payment": 0.00,
  "message": "Your W-2 withholding appears sufficient to cover your quarterly tax obligations."
}
```

#### Test Case 4: High Income Bracket Test
**Input:**
- Taxable Income: $150,000

**Manual Calculation:**
1. $11,600 at 10% = $1,160
2. $35,550 at 12% = $4,266
3. $53,375 at 22% = $11,742.50
4. $49,475 at 24% = $11,874
5. Total: $29,042.50

**Expected Output:**
```json
{
  "taxable_income": 150000.00,
  "income_tax": 29042.50,
  "effective_tax_rate": 19.36
}
```

### Edge Cases to Handle

1. **Taxable income = $0:** Return $0 tax, effective rate = 0%
2. **Taxable income < $0:** Should never happen (capped earlier), but handle gracefully
3. **Income exactly at bracket boundary:** Ensure no off-by-one errors
4. **Very high income (> $1M):** Should work correctly with top bracket
5. **W2 withholding > total tax:** Net payment = $0, don't show negative

### Out of Scope

- Married filing jointly brackets (use single for now, document limitation)
- Head of household brackets
- State income tax calculations
- Tax credits (child tax credit, EITC, etc.)
- Itemized deductions vs. standard deduction choice
- Capital gains tax
- Alternative minimum tax (AMT)

### Success Metrics

1. **Marginal rate accuracy:** Manual verification of 10 test cases = 100% match
2. **W2 withholding correctly applied:** Reduces tax owed, not income (verify in tests)
3. **Effective tax rate calculation:** Matches (total tax / gross income)
4. **Loss handling:** Returns $0 tax with informative message

### Dependencies

- FEDERAL_TAX_BRACKETS_2026 must be verified against IRS publications
- User's filing status (currently assumes single)
- User's W2 withholding data (optional, assumes $0 if missing)

### Risks and Assumptions

**Assumptions:**
- User is filing as Single (other statuses not supported yet)
- User's W2 job is using standard deduction (not itemizing)
- No tax credits beyond W2 withholding
- User's marginal rate is based solely on side hustle income (ignores W2 income level)

**Risks:**
- Users in higher W2 income brackets will have understated marginal rates
- Married users may get significantly different actual tax
- Simplified model may deviate significantly from actual tax return

**Mitigation:**
- Add disclaimer: "Estimates based on Single filer status and simplified assumptions"
- Allow user to override marginal tax rate in settings (future)
- Recommend professional review for income > $100K

---

## REQ-004: Language and Claims Audit

### Requirement ID
REQ-004

### Priority
CRITICAL (P0 - Ship Blocker)

### Assigned To
Fronty (Frontend + Content)

### Problem Statement
The application contains language that makes definitive claims about IRS requirements, guarantees accuracy, or uses mandatory/absolute phrasing. This creates regulatory compliance risk and potential liability. All user-facing content must be audited and updated to use compliant, hedged language.

**Regulatory Risk:** Providing definitive tax advice without proper licensing could be considered practicing tax preparation without credentials.

### User Story
As a user, I want to receive helpful tax guidance from TaxGig without being misled into thinking the app provides definitive tax advice or guaranteed accuracy, so I understand this is an estimation tool.

### Acceptance Criteria

#### GIVEN any user-facing text in the application
#### WHEN the text discusses tax requirements, calculations, or advice
#### THEN the text MUST:

1. **Use conditional language** ("generally," "typically," "may," "based on")
2. **Avoid absolute claims** (no "mandatory," "required," "guaranteed," "IRS requires")
3. **Include appropriate hedging** where making recommendations
4. **Distinguish between IRS guidance and app estimates**
5. **Direct users to official sources** or professionals for definitive answers

### Full Audit Results

#### Files Requiring Changes

Based on code search, these files contain problematic language:

1. `backend/src/services/notificationService.ts` - Notification messaging
2. `frontend/src/lib/blog-data.ts` - Blog post content
3. `frontend/src/app/(dashboard)/tax/page.tsx` - Tax dashboard UI text
4. Any other UI components with tax messaging (to be identified)

### Specific Text Changes Required

#### CHANGE SET 1: Notification Messages

**File:** `backend/src/services/notificationService.ts`

**Line 299 - Threshold Warning Message:**

BEFORE:
```typescript
? `You've earned $${data.current_income.toLocaleString()} in side income this year (${data.percent_of_threshold.toFixed(0)}% of the $5,000 IRS reporting threshold). Quarterly tax payments may be required.`
```

AFTER:
```typescript
? `You've earned $${data.current_income.toLocaleString()} in side income this year (${data.percent_of_threshold.toFixed(0)}% of the $5,000 IRS reporting threshold). Based on current IRS guidance, quarterly estimated tax payments may be required if you expect to owe $1,000 or more in taxes.`
```

**Line 300 - Threshold Reached Message:**

BEFORE:
```typescript
: `Your side income has reached $${data.current_income.toLocaleString()} this year, exceeding the $5,000 IRS reporting threshold. Payment platforms will report your income to the IRS. Make sure you're prepared for quarterly tax payments.`
```

AFTER:
```typescript
: `Your side income has reached $${data.current_income.toLocaleString()} this year, exceeding the $5,000 IRS reporting threshold. Payment platforms will likely report your income to the IRS via Form 1099-K. Consider whether quarterly estimated tax payments are appropriate for your situation.`
```

**Line 355 - Deadline Reminder Message:**

BEFORE:
```typescript
const message = `Your Q${data.quarter} ${data.tax_year} estimated tax payment of ${paymentFormatted} is due ${dueDate}. Don't forget to make your payment to avoid penalties.`;
```

AFTER:
```typescript
const message = `Your estimated Q${data.quarter} ${data.tax_year} tax payment of ${paymentFormatted} is due ${dueDate}. Based on current estimates, making this payment may help reduce potential underpayment penalties. Actual tax liability may vary.`;
```

#### CHANGE SET 2: Blog Content

**File:** `frontend/src/lib/blog-data.ts`

**Post 1: "quarterly-tax-calculator-gig-workers-2026"**

**Line 76 - Penalties Section:**

BEFORE:
```
**Failing to pay quarterly taxes can result in:**
- Underpayment penalties (currently 8% annually)
```

AFTER:
```
**Not paying sufficient estimated taxes may result in:**
- Potential underpayment penalties (IRS penalty rate varies quarterly, approximately 8% annually as of 2026)
```

**Line 90 - Requirements:**

BEFORE:
```
For most gig workers earning $10,000+ annually from side hustles, quarterly payments are required.
```

AFTER:
```
For most gig workers earning $10,000+ annually from side hustles (after expenses), quarterly payments are generally required based on IRS Publication 505 guidelines.
```

**Line 547 - $5K Threshold Discussion:**

BEFORE:
```
**Our recommendation:** Once you cross $5,000 in annual side hustle income, start taking quarterly taxes seriously.
```

AFTER:
```
**General guidance:** Once you cross $5,000 in annual side hustle income, it's advisable to calculate whether you'll owe $1,000+ in taxes and may need to make quarterly estimated payments.
```

**Post 3: "irs-5000-threshold-side-hustle-quarterly-taxes"**

**Line 555 - Penalty Description:**

BEFORE:
```
If you owe $4,000 in estimated taxes and pay nothing until April:
- Underpayment penalty: ~$160-$240
```

AFTER:
```
If you owe $4,000 in estimated taxes and pay nothing until April:
- Estimated underpayment penalty: ~$160-$240 (based on current IRS penalty rates, which vary quarterly)
```

#### CHANGE SET 3: Frontend UI Text

**File:** `frontend/src/app/(dashboard)/tax/page.tsx`

**Line 131 - Page Description:**

BEFORE:
```tsx
<p className="text-gray-500 mt-1">
  Quarterly tax estimates and payment tracking
</p>
```

AFTER:
```tsx
<p className="text-gray-500 mt-1">
  Estimated quarterly tax calculations and payment tracking
</p>
```

**Line 373 - Threshold Message:**

BEFORE:
```tsx
<p className="text-sm text-gray-500">
  {threshold?.threshold_5000_reached
    ? 'You will receive 1099-K forms from payment platforms'
    : `${formatCurrency(5000 - (threshold?.total_1099_income || 0))} remaining until threshold`}
</p>
```

AFTER:
```tsx
<p className="text-sm text-gray-500">
  {threshold?.threshold_5000_reached
    ? 'Payment platforms are generally required to issue 1099-K forms'
    : `${formatCurrency(5000 - (threshold?.total_1099_income || 0))} remaining until reporting threshold`}
</p>
```

### Comprehensive Word Replacement Table

Use this table to find and replace problematic phrases across the entire codebase:

| ❌ REMOVE | ✅ REPLACE WITH | Context |
|----------|----------------|---------|
| "IRS requires" | "Based on current IRS guidance" | When discussing tax rules |
| "IRS requires" | "IRS Publication [#] indicates" | When citing specific guidance |
| "mandatory" | "generally required" | For quarterly payments |
| "must pay" | "may need to pay" | For tax obligations |
| "required at $X" | "generally required when..." | For income thresholds |
| "guaranteed accurate" | "estimated based on" | For tax calculations |
| "will owe" | "may owe" or "estimated to owe" | For tax projections |
| "avoid penalties" | "may help reduce risk of penalties" | For payment reminders |
| "You will receive 1099" | "You will likely receive 1099" | For reporting forms |
| "Payment is due" | "Estimated payment is due" | For deadline reminders |
| "Total tax owed" | "Estimated total tax" | For calculation results |
| "Your tax liability" | "Your estimated tax liability" | For calculation results |
| "Required payment" | "Estimated payment" | For quarterly amounts |

### Search and Replace Commands

Run these grep searches to find any remaining problematic phrases:

```bash
# Search for "mandatory"
grep -r "mandatory" --include="*.ts" --include="*.tsx" frontend/ backend/src/

# Search for "IRS requires"
grep -r "IRS requires" --include="*.ts" --include="*.tsx" frontend/ backend/src/

# Search for "guaranteed"
grep -r "guaranteed" --include="*.ts" --include="*.tsx" frontend/ backend/src/

# Search for "must pay"
grep -r "must pay" --include="*.ts" --include="*.tsx" frontend/ backend/src/

# Search for "will owe"
grep -r "will owe" --include="*.ts" --include="*.tsx" frontend/ backend/src/

# Search for "avoid penalties"
grep -ri "avoid penalties" --include="*.ts" --include="*.tsx" frontend/ backend/src/
```

### Implementation Checklist

- [ ] Update all notification messages (notificationService.ts)
- [ ] Update all blog post content (blog-data.ts)
- [ ] Update tax page UI text (tax/page.tsx)
- [ ] Search and replace using table above across all files
- [ ] Run grep commands to verify no problematic phrases remain
- [ ] Review marketing pages (landing page, features, pricing)
- [ ] Review email templates (if any)
- [ ] Review onboarding flow text
- [ ] Review help/FAQ content
- [ ] Review error messages for tax-related errors
- [ ] Update API response messages where tax advice is given

### Out of Scope

- Legal disclaimer page (separate requirement)
- Terms of service updates (legal team)
- Privacy policy (legal team)

### Success Metrics

1. **Zero absolute claims:** No instances of "mandatory," "IRS requires," "guaranteed"
2. **Hedging compliance:** All tax advice includes conditional language
3. **Grep verification:** All search commands return 0 results for problematic phrases
4. **Tone consistency:** Language feels helpful but appropriately cautious

### Dependencies

- REQ-005 (Disclaimer text) should be implemented in parallel
- Legal review of final language (optional but recommended)

### Risks and Assumptions

**Assumptions:**
- Hedged language will not significantly reduce user confidence
- Users understand "estimated" means not guaranteed
- Conditional phrasing is sufficient for compliance

**Risks:**
- Overly cautious language may make app feel less helpful
- Users may ignore disclaimers and treat estimates as definitive

**Mitigation:**
- Balance between cautious and helpful
- Use tooltips to explain why language is hedged
- Provide links to IRS publications for users who want official sources

---

## REQ-005: Disclaimer Text Requirements

### Requirement ID
REQ-005

### Priority
CRITICAL (P0 - Ship Blocker)

### Assigned To
Fronty (Frontend)

### Problem Statement
The application displays tax calculations and estimates without accompanying disclaimers. Users must be informed that these are estimates, not definitive tax advice, and actual tax obligations may vary. Disclaimers must appear prominently wherever tax numbers are displayed.

**Regulatory Risk:** Presenting tax calculations without disclaimers could imply they are professional tax advice or guaranteed accurate.

### User Story
As a user viewing tax estimates in TaxGig, I want to see clear disclaimers that these are estimates so I understand they are not a substitute for professional tax advice and my actual tax may differ.

### Acceptance Criteria

#### GIVEN a user views any tax calculation or estimate
#### WHEN the calculation is displayed
#### THEN a disclaimer MUST be visible that:

1. **Identifies the number as an estimate**
2. **States actual tax may vary**
3. **Recommends professional advice** for complex situations
4. **Is visually distinct** (icon, styling, placement)
5. **Does not obstruct** the primary information

### Disclaimer Text Standards

#### Standard Disclaimer (General Use)
Use this for most tax calculation displays:

```
This is an estimate based on the information provided. Actual tax obligations may vary. Consult a tax professional for advice specific to your situation.
```

**Character count:** 156 characters
**Readability:** 9th grade level
**Tone:** Professional, cautionary but not alarmist

#### Short Disclaimer (Space-Constrained)
Use for cards, tooltips, or mobile views:

```
Estimate only. Actual tax may vary.
```

**Character count:** 37 characters

#### Long Disclaimer (Detailed Calculations)
Use for full tax calculation pages or reports:

```
Important: This is an estimated tax calculation based on the income and expense data you've provided and current federal tax brackets. Your actual tax liability may differ due to factors including:

• State and local taxes not included in this estimate
• Tax credits or deductions not accounted for
• Changes in tax law or IRS guidance
• Additional income sources or withholding
• Filing status or dependent changes

These estimates are for informational purposes only and do not constitute professional tax advice. For tax planning, filing assistance, or advice specific to your situation, consult a licensed tax professional or CPA.

Data Source: IRS Publication 505 (Estimated Tax), IRS Publication 334 (Tax Guide for Small Business)
```

**Character count:** 685 characters

### Placement Requirements

#### Location 1: Tax Dashboard - YTD Summary Card

**File:** `frontend/src/app/(dashboard)/tax/page.tsx`

**Placement:** Below the YTD summary stats (around line 206)

**Implementation:**
```tsx
{/* YTD Summary Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {/* ... existing stat cards ... */}
</div>

{/* Add Disclaimer */}
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-sm text-amber-900 font-medium">Tax Estimate Disclaimer</p>
    <p className="text-sm text-amber-800 mt-1">
      This is an estimate based on the information provided. Actual tax obligations
      may vary. Consult a tax professional for advice specific to your situation.
    </p>
  </div>
</div>
```

#### Location 2: Tax Breakdown Card

**File:** `frontend/src/app/(dashboard)/tax/page.tsx`

**Placement:** Inside the Tax Breakdown card (after line 338)

**Implementation:**
```tsx
<CardContent className="space-y-3">
  {/* ... existing breakdown rows ... */}

  <div className="flex justify-between py-2 border-t font-semibold">
    <span className="text-gray-900">Total Tax Owed</span>
    <span className="text-gray-900">{formatCurrency(ytd.totalTaxOwed)}</span>
  </div>

  {/* Add Disclaimer */}
  <div className="pt-3 border-t border-gray-200">
    <div className="flex items-start gap-2">
      <InformationCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-500">
        Estimate only. Actual tax may vary.
      </p>
    </div>
  </div>
</CardContent>
```

#### Location 3: Quarterly Payment Amounts

**File:** `frontend/src/app/(dashboard)/tax/page.tsx`

**Placement:** After each quarterly payment display (inside the quarter loop)

**Implementation:**
```tsx
<div className="text-right">
  <p className="text-lg font-bold text-gray-900">
    {formatCurrency(estimatedPayment)}
  </p>
  <Badge variant="success" size="sm">Paid</Badge>

  {/* Add Tooltip Disclaimer */}
  <Tooltip content="This is an estimated payment amount. Your actual quarterly tax obligation may differ.">
    <InformationCircleIcon className="w-4 h-4 text-gray-400 inline-block ml-1" />
  </Tooltip>
</div>
```

#### Location 4: Notification Messages

**File:** `backend/src/services/notificationService.ts`

**Placement:** Append to all tax-related notification messages

**Implementation:**

For threshold alerts (line 299-300):
```typescript
const message = isWarning
  ? `You've earned $${data.current_income.toLocaleString()} in side income this year (${data.percent_of_threshold.toFixed(0)}% of the $5,000 IRS reporting threshold). Based on current IRS guidance, quarterly estimated tax payments may be required if you expect to owe $1,000 or more in taxes. Note: This is an estimate; consult a tax professional for personalized advice.`
  : `Your side income has reached $${data.current_income.toLocaleString()} this year, exceeding the $5,000 IRS reporting threshold. Payment platforms will likely report your income to the IRS via Form 1099-K. Consider whether quarterly estimated tax payments are appropriate for your situation. This is general guidance; actual requirements may vary.`;
```

For deadline reminders (line 355):
```typescript
const message = `Your estimated Q${data.quarter} ${data.tax_year} tax payment of ${paymentFormatted} is due ${dueDate}. Based on current estimates, making this payment may help reduce potential underpayment penalties. Actual tax liability may vary. Consult a tax professional if needed.`;
```

#### Location 5: Email Notifications (If Implemented)

Add standard disclaimer to footer of all tax-related emails:

```html
<div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
  <p style="font-size: 12px; color: #6b7280; line-height: 1.5;">
    <strong>Tax Estimate Disclaimer:</strong> This is an estimate based on the information provided.
    Actual tax obligations may vary. Consult a tax professional for advice specific to your situation.
    TaxGig does not provide tax, legal, or accounting advice.
  </p>
</div>
```

#### Location 6: Tax Reports/PDFs (Future)

When generating downloadable reports, include disclaimer on every page:

**Header Disclaimer:**
```
TAX ESTIMATE REPORT - FOR INFORMATIONAL PURPOSES ONLY
```

**Footer Disclaimer:**
```
This report contains estimated tax calculations based on data provided as of [DATE]. Actual tax liabilities may differ.
This report does not constitute professional tax advice. Consult a licensed tax professional or CPA before making tax decisions.
```

### Visual Design Requirements

#### Disclaimer Styling Standards

**Standard Alert Box:**
```tsx
<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
  <div>
    <p className="text-sm text-amber-900 font-medium">Tax Estimate Disclaimer</p>
    <p className="text-sm text-amber-800 mt-1">[Disclaimer text]</p>
  </div>
</div>
```

**Inline Disclaimer:**
```tsx
<div className="flex items-start gap-2">
  <InformationCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
  <p className="text-xs text-gray-500">[Disclaimer text]</p>
</div>
```

**Tooltip Disclaimer:**
```tsx
<Tooltip content="[Disclaimer text]">
  <InformationCircleIcon className="w-4 h-4 text-gray-400 inline-block cursor-help" />
</Tooltip>
```

#### Color Palette
- Background: `bg-amber-50` (warm, cautionary but not alarming)
- Border: `border-amber-200`
- Icon: `text-amber-600`
- Heading: `text-amber-900`
- Text: `text-amber-800`

**Alternative (Information Style):**
- Background: `bg-blue-50`
- Border: `border-blue-200`
- Icon: `text-blue-600`
- Text: `text-blue-800`

#### Icons to Use
- **Warning/Caution:** `ExclamationTriangleIcon` (from Heroicons)
- **Information:** `InformationCircleIcon` (from Heroicons)
- **Help:** `QuestionMarkCircleIcon` (from Heroicons)

### Accessibility Requirements

1. **Screen readers:** Disclaimers must be readable by screen readers
2. **ARIA labels:** Use `aria-label` or `aria-describedby` for icon-only tooltips
3. **Color contrast:** Text must meet WCAG AA standards (4.5:1 ratio minimum)
4. **Keyboard navigation:** Tooltip disclaimers must be accessible via keyboard

**Example:**
```tsx
<Tooltip content="This is an estimate. Actual tax may vary.">
  <InformationCircleIcon
    className="w-4 h-4 text-gray-400"
    aria-label="Tax estimate disclaimer"
    role="img"
  />
</Tooltip>
```

### Implementation Checklist

- [ ] Add disclaimer to YTD summary section (tax/page.tsx)
- [ ] Add disclaimer to Tax Breakdown card
- [ ] Add tooltip disclaimers to quarterly payment amounts
- [ ] Update notification message templates (notificationService.ts)
- [ ] Add disclaimer to blog posts (blog-data.ts) if showing calculations
- [ ] Create reusable Disclaimer component (components/ui/Disclaimer.tsx)
- [ ] Add disclaimers to any email templates
- [ ] Add footer disclaimer to future PDF reports
- [ ] Verify all disclaimers are screen-reader accessible
- [ ] Test disclaimer visibility on mobile devices
- [ ] Ensure no disclaimer blocks critical UI elements

### Reusable Component Specification

Create a new component for consistent disclaimer usage:

**File:** `frontend/src/components/ui/Disclaimer.tsx`

```tsx
import { ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

export type DisclaimerVariant = 'warning' | 'info';
export type DisclaimerSize = 'sm' | 'md' | 'lg';

interface DisclaimerProps {
  variant?: DisclaimerVariant;
  size?: DisclaimerSize;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Disclaimer({
  variant = 'warning',
  size = 'md',
  title,
  children,
  className = ''
}: DisclaimerProps) {
  const Icon = variant === 'warning' ? ExclamationTriangleIcon : InformationCircleIcon;

  const styles = {
    warning: {
      container: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: 'text-amber-600',
      text: 'text-amber-800'
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-900',
      icon: 'text-blue-600',
      text: 'text-blue-800'
    }
  };

  const sizeStyles = {
    sm: 'p-3 text-xs',
    md: 'p-4 text-sm',
    lg: 'p-5 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`border rounded-lg flex items-start gap-3 ${styles[variant].container} ${sizeStyles[size]} ${className}`}>
      <Icon className={`${styles[variant].icon} ${iconSizes[size]} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        {title && <p className="font-medium mb-1">{title}</p>}
        <div className={styles[variant].text}>{children}</div>
      </div>
    </div>
  );
}

// Predefined standard disclaimers
export function TaxEstimateDisclaimer() {
  return (
    <Disclaimer variant="warning" size="md" title="Tax Estimate Disclaimer">
      This is an estimate based on the information provided. Actual tax obligations
      may vary. Consult a tax professional for advice specific to your situation.
    </Disclaimer>
  );
}

export function InlineEstimateDisclaimer() {
  return (
    <div className="flex items-start gap-2">
      <InformationCircleIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-gray-500">
        Estimate only. Actual tax may vary.
      </p>
    </div>
  );
}
```

**Usage Examples:**
```tsx
// Standard disclaimer
<TaxEstimateDisclaimer />

// Custom disclaimer
<Disclaimer variant="info" title="Note">
  State taxes are not included in this estimate.
</Disclaimer>

// Inline disclaimer
<InlineEstimateDisclaimer />
```

### Test Cases

#### Visual Regression Tests

1. **Desktop view:** Disclaimers visible and properly styled on 1920x1080
2. **Tablet view:** Disclaimers readable on 768x1024
3. **Mobile view:** Disclaimers don't overflow on 375x667
4. **Dark mode (if supported):** Disclaimers readable in dark theme

#### Accessibility Tests

1. **Screen reader:** VoiceOver/NVDA can read all disclaimers
2. **Keyboard navigation:** Tab through tooltips with disclaimer content
3. **Color contrast:** All disclaimer text meets WCAG AA (4.5:1 minimum)
4. **Focus indicators:** Visible focus state on interactive disclaimers

#### Content Tests

1. **Standard disclaimer appears:** On tax dashboard YTD section
2. **Short disclaimer appears:** On tax breakdown card
3. **Tooltip disclaimer appears:** On hover over quarterly amounts
4. **Notification disclaimer included:** In tax alert messages
5. **No blocking:** Disclaimers don't obscure important data

### Out of Scope

- Legal disclaimer page (separate page, different requirement)
- Terms of Service updates
- Privacy Policy updates
- Disclaimers for non-tax features

### Success Metrics

1. **100% coverage:** Every tax calculation has associated disclaimer
2. **Visibility:** Disclaimers are visible without scrolling (where possible)
3. **Accessibility:** All disclaimers pass WCAG AA standards
4. **User awareness:** Post-launch survey shows >80% of users noticed disclaimers

### Dependencies

- REQ-004 (Language audit) should be completed first for consistency
- Design system must support amber/warning color palette
- Tooltip component must exist (or be created)
- Icons from Heroicons library

### Risks and Assumptions

**Assumptions:**
- Users will read disclaimers (or at least see them)
- Legal language is sufficient for protection
- Disclaimers won't significantly harm user experience

**Risks:**
- Disclaimers may reduce user confidence in estimates
- Too many disclaimers could create "alert fatigue"
- Users may not understand legal implications

**Mitigation:**
- Use friendly, non-legal language where possible
- Limit disclaimer repetition (don't show same text 5 times on one page)
- Test with beta users for comprehension and reaction

---

## Implementation Timeline

### Week 1: Backend Logic Fixes (Rishi)

**Day 1-2: REQ-001 - Quarterly Tax Requirement Logic**
- Implement `assessQuarterlyRequirement()` method
- Update `TaxCalculationResult` interface
- Update database schema if needed
- Write unit tests

**Day 3-4: REQ-002 - Self-Employment Tax Validation**
- Review and document existing formula
- Add inline comments
- Write comprehensive unit tests
- Verify constants are correct

**Day 5: REQ-003 - Income Tax Estimate Logic**
- Verify marginal rate calculation
- Add comments for W2 withholding logic
- Add loss scenario messaging
- Write unit tests

**Deliverable:** All backend tax logic verified and tested

### Week 1: Frontend Language & Disclaimers (Fronty)

**Day 1-2: REQ-004 - Language Audit**
- Search and replace problematic phrases
- Update notification templates
- Update blog content
- Run grep verification

**Day 3-4: REQ-005 - Disclaimer Implementation**
- Create Disclaimer component
- Add disclaimers to tax dashboard
- Add disclaimers to all tax displays
- Test on multiple screen sizes

**Day 5: Testing & Refinement**
- Accessibility testing
- Visual regression testing
- Cross-browser verification
- Mobile testing

**Deliverable:** All language compliant, disclaimers visible

### Week 2: Integration & QA

**Day 1-2: Integration Testing**
- Test backend + frontend together
- Verify all test cases pass
- Check API responses include new fields
- Verify disclaimers display correctly with real data

**Day 3-4: User Acceptance Testing**
- Internal team review
- Beta user testing (if available)
- Tax professional review (recommended)
- Documentation updates

**Day 5: Final Sign-Off**
- Isaac approval
- Create deployment checklist
- Prepare rollback plan
- Schedule production deployment

**Deliverable:** Production-ready code, approved for launch

---

## Acceptance Criteria Summary

### Definition of Done

All requirements are considered COMPLETE when:

1. ✅ **REQ-001:** Quarterly tax requirement logic uses $1,000 tax liability threshold, not $5,000 income
2. ✅ **REQ-002:** SE tax formula verified correct (92.35% × 15.3%) with comprehensive tests
3. ✅ **REQ-003:** Income tax uses marginal rates, W2 withholding reduces tax owed
4. ✅ **REQ-004:** Zero instances of "mandatory," "IRS requires," "guaranteed" in user-facing text
5. ✅ **REQ-005:** Disclaimers visible on all tax calculation displays

### Testing Requirements

- [ ] All unit tests pass (backend tax service)
- [ ] All integration tests pass (API endpoints)
- [ ] All test cases documented in requirements pass
- [ ] Manual QA verification complete
- [ ] Accessibility audit passes (WCAG AA)
- [ ] Visual regression tests pass
- [ ] Beta user testing feedback addressed (if applicable)

### Documentation Requirements

- [ ] Inline code comments added to all tax calculation logic
- [ ] API documentation updated with new response fields
- [ ] User-facing help docs updated (if any exist)
- [ ] Known limitations documented (SS wage base, state taxes, etc.)
- [ ] Testing procedures documented

### Deployment Checklist

- [ ] Database migrations prepared (if schema changes needed)
- [ ] Environment variables verified (tax rates, thresholds)
- [ ] Rollback plan documented
- [ ] Monitoring/alerting configured for tax calculation errors
- [ ] Customer support team briefed on changes
- [ ] Marketing copy reviewed for compliance

---

## Open Questions & Decisions Needed

### Question 1: 2026 Federal Tax Brackets
**Status:** UNVERIFIED
**Decision Needed By:** Before launch
**Who Decides:** Rishi + Tax Professional

Current brackets in `types/index.ts` are placeholders. Must verify against IRS Publication when 2026 brackets are officially announced (typically November 2025).

**Action:** Research IRS.gov or consult tax professional to confirm correct brackets.

---

### Question 2: Social Security Wage Base Cap
**Status:** KNOWN LIMITATION
**Decision Needed:** Is this acceptable for MVP?
**Who Decides:** Isaac

Current implementation does not handle SS wage base ($168,600 in 2026). Users earning above this will overpay SE tax estimates.

**Options:**
1. Accept as known limitation, document in help
2. Implement wage base cap before launch (adds complexity)
3. Add warning for users approaching threshold

**Recommendation:** Option 1 (document limitation) for MVP, add cap in v1.1.

---

### Question 3: State Tax Estimates
**Status:** OUT OF SCOPE
**Decision Needed:** Mention in disclaimers?
**Who Decides:** Fronty

Federal tax only. Should disclaimers explicitly mention state taxes are excluded?

**Recommendation:** Yes, add to long disclaimer text: "State and local taxes not included in this estimate."

---

### Question 4: Filing Status Support
**Status:** SINGLE FILER ONLY
**Decision Needed:** Document limitation or add dropdown?
**Who Decides:** Isaac + Rishi

Current implementation only supports Single filer brackets. Married filing jointly would have different brackets.

**Options:**
1. Document as "assumes Single filer status"
2. Add filing status dropdown to user settings
3. Add filing status selector on tax page

**Recommendation:** Option 1 for MVP, add dropdown in v1.1.

---

### Question 5: Prior Year Tax Data
**Status:** OPTIONAL FIELD
**Decision Needed:** Prompt user to enter it?
**Who Decides:** Fronty + Rishi

Safe harbor calculation (#3) uses prior year tax. Should we ask users for this data?

**Recommendation:** Add optional field in user profile: "2025 Total Tax Liability (from line 24 of Form 1040)" - helps with safe harbor calculation.

---

## Risk Register

| Risk ID | Risk Description | Likelihood | Impact | Mitigation |
|---------|-----------------|------------|--------|------------|
| RISK-001 | Tax calculation still incorrect despite review | Low | High | Tax professional code review before launch |
| RISK-002 | Users misinterpret estimates as guarantees despite disclaimers | Medium | Medium | A/B test disclaimer phrasing, add FAQ |
| RISK-003 | 2026 tax brackets change after implementation | Medium | Low | Monitor IRS announcements, plan quick update |
| RISK-004 | Language changes make app feel less confident/helpful | Medium | Low | User testing feedback, balance caution with helpfulness |
| RISK-005 | Disclaimers cause alert fatigue, users ignore them | Low | Medium | Limit repetition, use varied placement |
| RISK-006 | State tax questions overwhelm support | Medium | Low | Prominent FAQ: "State taxes not included" |

---

## Appendix A: IRS Publication References

### Primary Sources
- **IRS Publication 505:** Tax Withholding and Estimated Tax
  - Link: https://www.irs.gov/publications/p505
  - Relevant Sections: Part 2 (Estimated Tax)

- **IRS Publication 334:** Tax Guide for Small Business
  - Link: https://www.irs.gov/publications/p334
  - Relevant Sections: Chapter 9 (Self-Employment Tax)

- **IRS Schedule SE:** Self-Employment Tax
  - Link: https://www.irs.gov/forms-pubs/about-schedule-se-form-1040

- **IRS Form 1040-ES:** Estimated Tax for Individuals
  - Link: https://www.irs.gov/forms-pubs/about-form-1040-es

### Secondary References
- **IRS Revenue Procedure 2025-XX:** Tax rate schedules, standard deductions (published annually in November)
- **Social Security Administration:** Wage base limits (https://www.ssa.gov/oact/cola/cbb.html)

---

## Appendix B: Test Data Sets

### Dataset 1: Low Income, No Quarterly Required
```json
{
  "name": "Low Income Scenario",
  "gross_income": 6000,
  "expenses": 5500,
  "net_profit": 500,
  "w2_withholding": 0,
  "expected": {
    "se_tax": 70.65,
    "income_tax": 46.47,
    "total_tax": 117.12,
    "quarterly_required": false,
    "reason": "Expected tax liability after withholding is less than $1,000"
  }
}
```

### Dataset 2: Moderate Income, W2 Coverage
```json
{
  "name": "W2 Coverage Scenario",
  "gross_income": 15000,
  "expenses": 3000,
  "net_profit": 12000,
  "w2_withholding": 3000,
  "expected": {
    "se_tax": 1695.55,
    "income_tax": 1198,
    "total_tax": 2893.55,
    "net_after_w2": -106.45,
    "quarterly_required": false,
    "reason": "W-2 withholding covers at least 90% of estimated tax liability"
  }
}
```

### Dataset 3: High Income, Payments Required
```json
{
  "name": "High Income Scenario",
  "gross_income": 25000,
  "expenses": 5000,
  "net_profit": 20000,
  "w2_withholding": 0,
  "expected": {
    "se_tax": 2826.10,
    "income_tax": 1897,
    "total_tax": 4723.10,
    "quarterly_required": true,
    "reason": "Expected to owe $1,000 or more after withholding and safe harbor tests"
  }
}
```

### Dataset 4: Net Loss Scenario
```json
{
  "name": "Net Loss Scenario",
  "gross_income": 12000,
  "expenses": 14000,
  "net_profit": -2000,
  "w2_withholding": 0,
  "expected": {
    "se_tax": 0,
    "income_tax": 0,
    "total_tax": 0,
    "quarterly_required": false,
    "message": "You have a net loss from this side hustle. This loss may offset other income on your tax return..."
  }
}
```

---

## Document Sign-Off

**Prepared By:** Claude (Requirements Architect)
**Date:** January 30, 2026
**Status:** READY FOR IMPLEMENTATION

**Approval Required:**
- [ ] Isaac (Project Owner) - Final sign-off
- [ ] Rishi (Backend Lead) - Technical feasibility confirmed
- [ ] Fronty (Frontend Lead) - UI/UX feasibility confirmed
- [ ] Tax Professional (Optional) - Formula verification

**Implementation Start Date:** Upon approval
**Target Completion Date:** 2 weeks from approval

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-30 | Claude | Initial specification - all 5 Tier 1 requirements |

---

**END OF REQUIREMENTS DOCUMENT**
