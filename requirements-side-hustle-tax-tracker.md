# Side Hustle Tax & Income Tracker - Development Requirements Document

**Document Version:** 1.0
**Last Updated:** January 28, 2026
**Requirements Architect:** Ajay
**Project Timeline:** Alpha in 60 days, Beta in 90 days
**Target Launch:** April 2026 (Alpha), May 2026 (Beta)

---

## Executive Summary

This requirements document translates Isaac's strategic direction and market research into actionable development specifications for the **Side Hustle Tax & Income Tracker**. The app addresses a critical pain point for 80 million Americans with side hustles who struggle to track income across multiple platforms, categorize expenses, and prepare for quarterly tax filings.

**Core Value Proposition:** Automatically aggregate income from multiple gig platforms, intelligently categorize business expenses, provide real-time quarterly tax estimates, and generate filing-ready reports—all without the complexity of QuickBooks or the limitations of spreadsheets.

**Strategic Priority:** FAST-TRACK (Opportunity Score 17/20)

**MVP Philosophy:** Ruthlessly minimal. Focus exclusively on the core job: "Know exactly what I've earned, what I can deduct, and what I owe the IRS before quarterly deadlines."

---

## Table of Contents

1. [Problem-to-Requirement Mapping](#problem-to-requirement-mapping)
2. [User Personas & Jobs-to-be-Done](#user-personas--jobs-to-be-done)
3. [Prioritized User Stories](#prioritized-user-stories)
4. [Feature Requirements (P0 - MVP Critical)](#feature-requirements-p0---mvp-critical)
5. [Data Model](#data-model)
6. [Technical Architecture](#technical-architecture)
7. [API Integrations](#api-integrations)
8. [MVP Scope Definition](#mvp-scope-definition)
9. [Non-Functional Requirements](#non-functional-requirements)
10. [Sprint Plan (60-Day Alpha)](#sprint-plan-60-day-alpha)
11. [Success Metrics](#success-metrics)
12. [Risk Register](#risk-register)
13. [Open Questions](#open-questions)

---

## Problem-to-Requirement Mapping

This section provides clear traceability from discovered problems (per market research) to specific requirements.

| Research Finding | User Pain Point | Requirement ID | Requirement Title |
|------------------|-----------------|----------------|-------------------|
| 80M Americans have side hustles; 76.4M freelancers | Income scattered across platforms | REQ-001 | Multi-Platform Income Aggregation |
| New IRS $5,000 threshold creates urgency | Need to know if approaching reporting threshold | REQ-002 | Income Threshold Alerts |
| Users miss deductions due to poor record-keeping | Business expenses mixed with personal | REQ-003 | Expense Categorization (Business vs Personal) |
| Quarterly tax deadline panic | Don't know how much to set aside | REQ-004 | Quarterly Tax Estimate Calculator |
| Manual spreadsheets are error-prone | Data entry is time-consuming | REQ-005 | Automated Transaction Import |
| Year-end scramble to reconstruct history | No historical records for filing | REQ-006 | Tax Report Generation (Schedule C Format) |
| Can't separate business costs from personal | Need quick expense logging on-the-go | REQ-007 | Mobile Receipt Capture |
| Forgot to track mileage for deliveries | Deduction opportunities missed | REQ-008 | Manual Expense Entry |
| QuickBooks is overkill for simple side hustles | Need simpler interface | REQ-009 | Dashboard (Income vs Expenses vs Tax Liability) |
| Spreadsheets don't provide alerts | Reactive instead of proactive | REQ-010 | Notification System |

---

## User Personas & Jobs-to-be-Done

### Primary Persona: "Hybrid Hustler Hannah"

**Demographics:**
- Age: 28-42
- Occupation: W2 employee + 2-3 gig platforms
- Annual Income: $50,000-100,000 (W2: $40-70K, Side hustles: $10-30K)
- Tech Savviness: Medium (comfortable with apps, not accounting software)
- Tax Knowledge: Low to Medium (knows quarterly taxes exist, unclear on specifics)

**Platforms Used:**
- Uber/Lyft (rideshare)
- DoorDash/Instacart (delivery)
- Upwork/Fiverr (freelance services)
- Etsy/Poshmark (e-commerce)
- Venmo/PayPal/Zelle (payments)

**Core Job-to-be-Done:**
> "When quarterly tax deadlines approach and I have income from multiple gig platforms, I need to know exactly how much I've earned, what expenses I can deduct, and what I owe the IRS—without manually logging into 5 different apps or hiring an accountant—so I can file on time, avoid penalties, and keep more of what I earn."

**Struggling Moments:**
1. **Quarterly Deadline Week:** "It's April 15th and I have no idea how much I owe"
2. **Year-End Tax Prep:** "I need to reconstruct 12 months of transactions across 5 platforms"
3. **Expense Confusion:** "Was this gas purchase for DoorDash or personal?"
4. **Penalty Anxiety:** "Did I miss a quarterly payment? Will I get penalized?"
5. **Deduction Uncertainty:** "Am I leaving money on the table by missing deductions?"

**Success Criteria (User's Perspective):**
- "I can see total side hustle income in under 10 seconds"
- "I know my current quarterly tax liability at a glance"
- "I captured a receipt in under 30 seconds while on the go"
- "I filed quarterly taxes with confidence (no accountant needed)"
- "I found $500+ in deductions I would have missed with spreadsheets"

---

## Prioritized User Stories

User stories follow format: "As a [user type], I want to [action], so that [benefit]"

### P0 - MVP Critical (Alpha Launch - 60 Days)

**Income Tracking:**

**US-001** (REQ-001)
As a gig worker, I want to connect my bank account and payment platforms (Venmo, PayPal, Stripe) so that income is automatically imported without manual entry.
**Priority:** P0
**Story Points:** 13
**Dependencies:** Plaid integration

**US-002** (REQ-005)
As a freelancer, I want transactions to be automatically categorized as "1099 Income" vs "Personal Transfer" so that I don't spend hours sorting through bank statements.
**Priority:** P0
**Story Points:** 8
**Dependencies:** US-001, categorization rules engine

**US-003** (REQ-009)
As a side hustler, I want to see total income from all sources on a single dashboard so that I know my current year-to-date earnings at a glance.
**Priority:** P0
**Story Points:** 5
**Dependencies:** US-001

**Expense Tracking:**

**US-004** (REQ-007)
As a gig worker, I want to photograph receipts with my phone and have them automatically categorized so that I capture deductions in real-time without paperwork.
**Priority:** P0
**Story Points:** 8
**Dependencies:** Mobile app, photo storage, OCR (basic)

**US-005** (REQ-008)
As a freelancer, I want to manually log business expenses (mileage, equipment, supplies) so that expenses not visible in bank transactions are tracked for deductions.
**Priority:** P0
**Story Points:** 5
**Dependencies:** None

**US-006** (REQ-003)
As a side hustler, I want expenses automatically categorized into IRS Schedule C categories (Car & Truck, Supplies, Advertising, etc.) so that tax prep is simplified.
**Priority:** P0
**Story Points:** 8
**Dependencies:** US-004, US-005, categorization rules

**Tax Estimation:**

**US-007** (REQ-004)
As a gig worker, I want to see my current quarterly tax liability estimate so that I know how much to set aside and avoid penalties.
**Priority:** P0
**Story Points:** 13
**Dependencies:** US-003, US-006, tax calculation engine

**US-008** (REQ-002)
As a freelancer, I want to receive alerts when I approach the $5,000 IRS reporting threshold so that I know when quarterly filing becomes mandatory.
**Priority:** P0
**Story Points:** 3
**Dependencies:** US-003, notification system

**Reporting:**

**US-009** (REQ-006)
As a side hustler, I want to generate a PDF report showing income by category and expenses by IRS category so that I have filing-ready documentation for my accountant or tax software.
**Priority:** P0
**Story Points:** 8
**Dependencies:** US-003, US-006

**User Management:**

**US-010**
As a new user, I want to create an account with email/password or OAuth (Google) so that my data is securely stored and accessible across devices.
**Priority:** P0
**Story Points:** 5
**Dependencies:** Authentication service

**US-011**
As a returning user, I want to log in and see my data synced across mobile and web so that I can capture receipts on mobile and review reports on desktop.
**Priority:** P0
**Story Points:** 3
**Dependencies:** US-010, database sync

---

### P1 - Beta (Essential for Paid Conversion - 90 Days)

**US-012**
As a gig worker, I want the app to learn my transaction patterns so that categorization accuracy improves over time without constant manual corrections.
**Priority:** P1
**Story Points:** 13
**Value:** Reduces friction, improves user satisfaction

**US-013**
As a freelancer, I want to track mileage automatically using GPS so that I maximize vehicle deduction without manual logging.
**Priority:** P1
**Story Points:** 13
**Value:** High-value deduction (58¢/mile in 2026)

**US-014**
As a side hustler, I want to set quarterly tax payment reminders so that I never miss a filing deadline.
**Priority:** P1
**Story Points:** 3
**Value:** Prevents penalties (0.5% per month)

**US-015**
As a gig worker, I want to export transaction history to TurboTax or H&R Block format so that tax filing is seamless.
**Priority:** P1
**Story Points:** 8
**Value:** Integration with existing user workflows

**US-016**
As a freelancer, I want to see year-over-year income comparisons so that I understand my side hustle growth trajectory.
**Priority:** P1
**Story Points:** 5
**Value:** Engagement feature, user insight

**US-017**
As a side hustler, I want to set income goals and track progress so that I stay motivated and know if I'm on track.
**Priority:** P1
**Story Points:** 5
**Value:** Engagement feature

**US-018**
As a premium subscriber, I want unlimited income connections and historical data retention so that I can track multiple businesses and access past years' data.
**Priority:** P1
**Story Points:** 3
**Value:** Monetization enabler

---

### P2 - Post-PMF (Future Roadmap - Beyond 90 Days)

**US-019**
As an advanced user, I want to create custom expense categories beyond IRS defaults so that I can track business-specific costs (e.g., Etsy sellers: packaging supplies).
**Priority:** P2
**Story Points:** 5

**US-020**
As a freelancer, I want to connect multiple business entities (LLC, sole proprietorship) so that I can track separate income streams in one app.
**Priority:** P2
**Story Points:** 8

**US-021**
As a gig worker, I want access to tax professional consultations via in-app chat so that I can get expert advice when needed.
**Priority:** P2
**Story Points:** 13
**Note:** Potential premium add-on service

**US-022**
As a side hustler, I want estimated quarterly tax payment coupons generated so that I can mail payments to the IRS directly from the app's output.
**Priority:** P2
**Story Points:** 5

**US-023**
As a freelancer, I want to track accounts receivable (outstanding invoices) so that I know expected income vs collected income.
**Priority:** P2
**Story Points:** 13
**Note:** Shifts toward full accounting software—may violate MVP simplicity

---

## Feature Requirements (P0 - MVP Critical)

This section details functional requirements, acceptance criteria, edge cases, and technical dependencies for all P0 features.

---

### REQ-001: Multi-Platform Income Aggregation

**User Story:** US-001
**Priority:** P0 - Critical
**Complexity:** High

#### Functional Requirements

**FR-001-01:** Users shall connect bank accounts and payment platforms via Plaid OAuth integration.

**FR-001-02:** Supported platforms for Alpha:
- Bank accounts (checking/savings via Plaid)
- Venmo (via Plaid)
- PayPal (via Plaid or PayPal API)
- Cash App (via Plaid)
- Stripe (via Stripe API)

**FR-001-03:** System shall import transactions from connected accounts with the following data:
- Transaction date
- Amount (USD)
- Description/Memo
- Payee/Payer name
- Transaction ID (platform-specific)
- Account source (which platform)

**FR-001-04:** Transactions shall be imported automatically on a daily basis (batch job at 2 AM ET).

**FR-001-05:** Users shall be able to manually trigger a "Refresh" to import latest transactions on-demand.

**FR-001-06:** System shall store transaction sync timestamp and display "Last updated: [timestamp]" on dashboard.

#### Acceptance Criteria

**AC-001-01:**
GIVEN a user has connected their Venmo account via Plaid
WHEN they view the Income Dashboard
THEN they see all Venmo transactions from the past 90 days imported with date, amount, and description

**AC-001-02:**
GIVEN a user connects multiple accounts (Venmo + PayPal + Bank)
WHEN transactions are imported
THEN the system displays the source platform for each transaction

**AC-001-03:**
GIVEN Plaid connection fails due to expired credentials
WHEN the user opens the app
THEN they see a notification "Reconnect Venmo to continue importing transactions" with action button

**AC-001-04:**
GIVEN a transaction is already imported
WHEN the same transaction is fetched again (duplicate)
THEN the system skips the duplicate and does not create a duplicate entry

**AC-001-05:**
GIVEN a user manually clicks "Refresh Transactions"
WHEN new transactions exist
THEN new transactions appear in the list within 10 seconds with a success toast notification

#### Edge Cases

**EC-001-01:** Plaid connection expires after 90 days (Plaid Access Token refresh required)
**Handling:** Detect expired token, notify user, re-prompt for OAuth re-authentication

**EC-001-02:** User disconnects a platform externally (e.g., revokes Venmo access in Venmo settings)
**Handling:** API call fails, system marks connection as "Disconnected" and notifies user

**EC-001-03:** Transaction description is null or empty
**Handling:** Display as "Unknown Transaction" with platform name as fallback

**EC-001-04:** Platform API rate limits exceeded (e.g., Plaid sandbox limits)
**Handling:** Implement exponential backoff, retry after 1 hour, log error, notify user if persistent failure

**EC-001-05:** User connects the same account twice
**Handling:** Detect duplicate account via Plaid account_id, prevent duplicate connection, show error "This account is already connected"

**EC-001-06:** Transaction amount is negative (refund or reversal)
**Handling:** Display as negative income, allow user to categorize as "Refund" or exclude from income total

#### Technical Dependencies

- Plaid API integration (Link SDK for OAuth, Transactions API for data fetch)
- Stripe API (for Stripe-connected users)
- Database schema for transactions table with foreign keys to accounts table
- Cron job scheduler for daily automatic sync
- OAuth token storage (encrypted)

#### Success Metrics

- 95%+ of connected accounts successfully import transactions within 24 hours of connection
- <2% duplicate transaction rate
- <5% transaction import failure rate
- Average time to first transaction visible: <30 seconds after connection

---

### REQ-002: Income Threshold Alerts

**User Story:** US-008
**Priority:** P0 - Critical
**Complexity:** Low

#### Functional Requirements

**FR-002-01:** System shall calculate total 1099 income (excludes personal transfers) year-to-date.

**FR-002-02:** When total 1099 income reaches $4,000 (80% of $5,000 threshold), system shall send push notification and in-app alert:
> "You've earned $4,000 in side income this year. At $5,000, quarterly tax filing is required."

**FR-002-03:** When total 1099 income reaches $5,000, system shall send urgent notification:
> "You've crossed the $5,000 threshold. Quarterly tax filing is now mandatory to avoid IRS penalties."

**FR-002-04:** Alerts shall include a call-to-action button: "View Tax Estimate" linking to REQ-004.

**FR-002-05:** Users shall be able to dismiss alerts but alerts shall reappear on next login until threshold status changes.

#### Acceptance Criteria

**AC-002-01:**
GIVEN a user has $3,900 in 1099 income
WHEN they receive a new $150 payment that brings total to $4,050
THEN they receive a push notification within 1 hour: "You've earned $4,050 in side income this year..."

**AC-002-02:**
GIVEN a user has $4,950 in income
WHEN they receive $100 bringing total to $5,050
THEN they receive an urgent alert with red badge on Tax tab

**AC-002-03:**
GIVEN a user dismisses the $5,000 threshold alert
WHEN they log in the next day
THEN the alert reappears in the notification center (not as push notification)

**AC-002-04:**
GIVEN a user clicks "View Tax Estimate" in the alert
WHEN the link is clicked
THEN they navigate to the Tax Estimate screen (REQ-004) with current quarter highlighted

#### Edge Cases

**EC-002-01:** User earns exactly $5,000.00
**Handling:** Trigger threshold alert (≥ $5,000 condition)

**EC-002-02:** User receives a refund that drops income below $5,000 after crossing threshold
**Handling:** Alert remains (threshold was crossed; IRS obligation exists regardless of refund)

**EC-002-03:** User is in Q4 and hasn't filed previous quarters
**Handling:** Alert includes "You may owe penalties for missed Q1-Q3 filings. View Tax Calendar."

#### Technical Dependencies

- Income categorization engine (REQ-005)
- Push notification service (Firebase Cloud Messaging or equivalent)
- Threshold calculation runs after each transaction import

#### Success Metrics

- 100% of users crossing $4,000 receive alert within 24 hours
- <10% false positive rate (alert sent for personal transfers incorrectly categorized)

---

### REQ-003: Expense Categorization (Business vs Personal)

**User Story:** US-006
**Priority:** P0 - Critical
**Complexity:** High

#### Functional Requirements

**FR-003-01:** System shall categorize expenses into IRS Schedule C categories:

**Primary Categories (MVP):**
1. Car and truck expenses
2. Supplies (office supplies, materials)
3. Advertising
4. Meals (50% deductible)
5. Travel
6. Utilities (phone, internet)
7. Other expenses (miscellaneous)

**FR-003-02:** Each expense shall be tagged as "Business" or "Personal" (binary classification).

**FR-003-03:** Categorization shall use a rules-based engine (for MVP):
- Keyword matching on transaction description
- Merchant category codes (MCCs) from Plaid
- User-defined rules (if user manually categorizes 3+ similar transactions, auto-apply rule)

**FR-003-04:** Expenses categorized as "Personal" shall be excluded from deduction totals and tax reports.

**FR-003-05:** Users shall be able to manually override any auto-categorization with one tap.

**FR-003-06:** System shall display confidence level for auto-categorization:
- High (green checkmark): 90%+ confidence
- Medium (yellow icon): 70-89% confidence, suggest review
- Low (red icon): <70% confidence, manual review required

#### Acceptance Criteria

**AC-003-01:**
GIVEN a transaction with description "Shell Gas Station - $45"
WHEN the expense is categorized
THEN it is auto-tagged as "Business - Car and truck expenses" with High confidence

**AC-003-02:**
GIVEN a transaction with description "Costco - $150"
WHEN the expense is categorized
THEN it is auto-tagged as "Personal" with Medium confidence (require user review)

**AC-003-03:**
GIVEN a user manually changes "Starbucks - $8" from "Personal" to "Business - Meals"
WHEN they categorize 2 more Starbucks transactions as "Business - Meals"
THEN future Starbucks transactions auto-categorize as "Business - Meals"

**AC-003-04:**
GIVEN a transaction is categorized as "Business - Meals"
WHEN the deduction report is generated
THEN only 50% of the meal expense is included in deduction total (IRS rule)

**AC-003-05:**
GIVEN an expense has Low confidence
WHEN the user views the Expenses tab
THEN expenses with Low confidence are flagged with a red "Review" badge

#### Edge Cases

**EC-003-01:** Transaction description is vague ("Online Purchase")
**Handling:** Default to "Personal" with Low confidence, prompt user to review

**EC-003-02:** User categorizes gas expense as "Business" but has no rideshare/delivery income
**Handling:** Allow categorization (user may use personal vehicle for business errands) but flag in Tax Review

**EC-003-03:** Transaction is a split payment (e.g., $100 dinner: $50 business, $50 personal)
**Handling:** MVP does NOT support split; user must create manual adjustment entry

**EC-003-04:** Merchant appears in multiple categories (e.g., Amazon for both office supplies and personal items)
**Handling:** Default to "Personal," require user to manually mark business purchases

**EC-003-05:** Expense date is in previous tax year
**Handling:** Allow categorization but exclude from current year tax estimate, include in historical reports

#### Technical Dependencies

- Transaction data with merchant names and MCCs (Plaid)
- Keyword matching engine (regex or simple NLP)
- User preference storage for learned rules
- Schedule C category definitions (IRS Publication 535)

#### Success Metrics

- 80%+ auto-categorization accuracy for common expense types (gas, office supplies, meals)
- <15% of expenses require manual review
- Users review and confirm categorization within 7 days for 70%+ of flagged expenses

---

### REQ-004: Quarterly Tax Estimate Calculator

**User Story:** US-007
**Priority:** P0 - Critical
**Complexity:** High

#### Functional Requirements

**FR-004-01:** System shall calculate quarterly tax estimate using the following formula:

```
Net Self-Employment Income = Total 1099 Income - Total Business Deductions
Self-Employment Tax = Net Self-Employment Income × 0.9235 × 0.153
Income Tax Estimate = Net Self-Employment Income × Marginal Tax Rate
Total Quarterly Tax Owed = (Self-Employment Tax + Income Tax Estimate) / 4
```

**FR-004-02:** Marginal tax rate assumptions (MVP - simplified):
- Default: 22% (typical for $50-100K earners)
- User can override with custom rate (12%, 22%, 24%, 32%) in settings

**FR-004-03:** Dashboard shall display:
- Current quarter tax estimate
- Year-to-date tax liability
- Amount owed by next quarterly deadline (Apr 15, Jun 15, Sep 15, Jan 15)

**FR-004-04:** Tax estimate shall update in real-time as income/expenses are added or categorized.

**FR-004-05:** System shall display quarterly filing deadlines with countdown timer:
- Q1 (Jan-Mar): Due April 15
- Q2 (Apr-May): Due June 15
- Q3 (Jun-Aug): Due September 15
- Q4 (Sep-Dec): Due January 15 (next year)

**FR-004-06:** If user has W2 income, system shall allow user to input W2 withholding amount to adjust estimate.

#### Acceptance Criteria

**AC-004-01:**
GIVEN a user has $10,000 in 1099 income and $2,000 in business deductions
WHEN the tax estimate is calculated
THEN the quarterly estimate is approximately $550 (using 22% marginal rate)

**AC-004-02:**
GIVEN it is March 20th
WHEN the user views the Tax Dashboard
THEN they see "Q1 Deadline: April 15 (26 days away)" with estimated amount due

**AC-004-03:**
GIVEN a user adds a new $500 expense categorized as business
WHEN the expense is saved
THEN the quarterly tax estimate decreases by approximately $115 within 5 seconds

**AC-004-04:**
GIVEN a user inputs $8,000 in W2 withholding for the year
WHEN the tax estimate is recalculated
THEN the quarterly payment amount is reduced by $2,000 (W2 withholding / 4)

**AC-004-05:**
GIVEN a user has $0 in 1099 income
WHEN they view the Tax Dashboard
THEN it displays "$0 quarterly estimate" with message "Add income to see tax estimate"

#### Edge Cases

**EC-004-01:** User has net loss (expenses > income)
**Handling:** Display "$0 quarterly tax" with message "You have a net loss of $X (may offset W2 income)"

**EC-004-02:** User crosses into higher tax bracket mid-year
**Handling:** MVP uses single marginal rate (simplification); recommend accountant if income >$100K

**EC-004-03:** User is in Q4 but hasn't made Q1-Q3 payments
**Handling:** Display cumulative owed amount + penalties estimate (0.5% per month)

**EC-004-04:** User overpaid in previous quarters
**Handling:** MVP does NOT track payments made (future feature); user manually adjusts estimate

**EC-004-05:** Special deductions (home office, depreciation)
**Handling:** MVP does NOT support advanced deductions; user can add manual adjustment

#### Technical Dependencies

- Income total (REQ-001)
- Expense categorization and totals (REQ-003)
- Tax calculation engine (server-side for accuracy)
- Date/time service for deadline countdown

#### Success Metrics

- Tax estimate accuracy within ±10% of actual tax owed (validate with 20 beta testers)
- 90%+ of users report estimate is "helpful" or "very helpful" (user survey)

#### Assumptions

**ASSUMPTION-001:** User is a sole proprietor (not LLC or S-Corp)
**ASSUMPTION-002:** User files as Single (not Married Filing Jointly) unless specified
**ASSUMPTION-003:** No state tax calculation (federal only for MVP)
**ASSUMPTION-004:** User does not have other complex tax situations (rental income, capital gains, etc.)

**NOTE:** All assumptions must be validated during user onboarding. If user has complex tax situation, display disclaimer: "This estimate is for federal self-employment tax only. Consult a tax professional for personalized advice."

---

### REQ-005: Automated Transaction Import

**User Story:** US-002
**Priority:** P0 - Critical
**Complexity:** Medium

#### Functional Requirements

**FR-005-01:** System shall automatically categorize imported transactions as:
- "1099 Income" (business income subject to self-employment tax)
- "Personal Transfer" (exclude from business income)
- "Business Expense" (deductible)
- "Personal Expense" (exclude from deductions)

**FR-005-02:** Categorization logic (rules-based for MVP):

**1099 Income Rules:**
- Transaction is a deposit (positive amount)
- Source is Venmo/PayPal/Stripe AND description contains business keywords ("payment for," "invoice," "service")
- OR User manually tagged sender as "Business Client"

**Personal Transfer Rules:**
- Venmo/PayPal transaction with description containing: "rent," "split," "dinner," "Splitting," "reimbursement"
- Transfers between user's own accounts (same name)

**Business Expense Rules:**
- MCC codes: 5541 (gas stations), 5732 (electronics), 7372 (software)
- Keywords: "Office Depot," "Staples," "FedEx," "Adobe," "Zoom"

**Personal Expense Rules:**
- Default if no business indicators
- MCCs: 5411 (grocery), 5812 (restaurants - unless user is food delivery driver)

**FR-005-03:** Users shall review and confirm auto-categorizations via a weekly digest email or in-app notification.

**FR-005-04:** System shall flag ambiguous transactions (confidence <70%) for manual review.

#### Acceptance Criteria

**AC-005-01:**
GIVEN a Venmo deposit of $250 with description "Payment for graphic design project"
WHEN the transaction is imported
THEN it is auto-categorized as "1099 Income" with High confidence

**AC-005-02:**
GIVEN a PayPal payment of $50 with description "Splitting dinner with Sarah"
WHEN the transaction is imported
THEN it is auto-categorized as "Personal Transfer" (excluded from income)

**AC-005-03:**
GIVEN a Shell gas station charge of $45
WHEN the user is a DoorDash driver (profile setting)
THEN it is auto-categorized as "Business Expense - Car and truck"

**AC-005-04:**
GIVEN a generic transaction "Online Purchase - $75"
WHEN categorization confidence is 40%
THEN it is flagged for manual review with notification

**AC-005-05:**
GIVEN 20 transactions imported this week
WHEN Friday arrives
THEN the user receives a digest email: "5 transactions need your review"

#### Edge Cases

**EC-005-01:** Transaction description contains both business and personal keywords
**Handling:** Default to manual review, prompt user

**EC-005-02:** User's side hustle involves groceries (e.g., Instacart shopper)
**Handling:** Allow user to set profile "Grocery purchases are business expenses" override

**EC-005-03:** Transfer from PayPal to bank account (internal movement)
**Handling:** Detect and exclude from both income and expenses (duplicate transaction)

**EC-005-04:** Refund/reversal transaction
**Handling:** Link to original transaction if possible, reduce income total

#### Technical Dependencies

- Transaction data with descriptions and MCCs (REQ-001)
- Keyword dictionary (maintainable config file)
- User profile settings (industry/platform type)

#### Success Metrics

- 85%+ auto-categorization accuracy (validated against user corrections)
- 70%+ of users review flagged transactions within 7 days

---

### REQ-006: Tax Report Generation (Schedule C Format)

**User Story:** US-009
**Priority:** P0 - Critical
**Complexity:** Medium

#### Functional Requirements

**FR-006-01:** Users shall generate a PDF tax report from the Tax Dashboard with one tap/click.

**FR-006-02:** Report shall include:
- **Cover Page:** User name, tax year, report generation date
- **Income Summary:** Total 1099 income by platform, total year-to-date
- **Expense Summary:** Expenses by IRS Schedule C category, total deductions
- **Net Profit/Loss Calculation:** Total Income - Total Deductions
- **Quarterly Tax Estimates:** Breakdown by quarter (Q1-Q4)
- **Transaction Details (Appendix):** Line-by-line list of all income and expenses with dates, descriptions, amounts, categories

**FR-006-03:** Report format shall match IRS Schedule C structure (simplified for non-accountants):

```
Schedule C (Form 1040) - Simplified Report
Part I: Income
  Gross receipts or sales: $XX,XXX
Part II: Expenses
  Car and truck: $X,XXX
  Supplies: $X,XXX
  [Other categories]
  Total expenses: $XX,XXX
Part III: Net Profit or Loss
  Net profit (or loss): $X,XXX
```

**FR-006-04:** Users shall be able to select report date range:
- Current year-to-date (default)
- Specific quarter (Q1, Q2, Q3, Q4)
- Custom date range

**FR-006-05:** Report shall include disclaimer:
> "This report is for informational purposes only and does not constitute tax advice. Consult a tax professional for filing assistance."

**FR-006-06:** Users shall be able to email the report to themselves or their accountant directly from the app.

#### Acceptance Criteria

**AC-006-01:**
GIVEN a user has 6 months of income and expense data
WHEN they generate a year-to-date report
THEN a PDF is created within 10 seconds containing all income/expense line items

**AC-006-02:**
GIVEN a user selects "Q2 2026" date range
WHEN the report is generated
THEN only transactions from April 1 - May 31, 2026 are included

**AC-006-03:**
GIVEN a report is generated
WHEN the user clicks "Email Report"
THEN an email draft opens with the PDF attached and pre-filled subject "Tax Report 2026 YTD"

**AC-006-04:**
GIVEN a user has $15,000 income and $4,000 expenses
WHEN the report is generated
THEN Part III shows "Net profit: $11,000"

**AC-006-05:**
GIVEN a user has $0 income
WHEN they attempt to generate a report
THEN they see a message "No income to report. Add transactions to generate a tax report."

#### Edge Cases

**EC-006-01:** User has transactions in multiple tax years (Dec 2025 + Jan 2026)
**Handling:** Filter by tax year, default to current tax year only

**EC-006-02:** Expense total exceeds income (net loss)
**Handling:** Display "Net loss: ($X,XXX)" in red, include note "Losses may offset W2 income"

**EC-006-03:** User has 1,000+ transactions
**Handling:** Appendix may be 50+ pages; include summary only in main report, full details in appendix

**EC-006-04:** User changes categorization after report is generated
**Handling:** Report is a point-in-time snapshot; include timestamp "Report generated: Jan 28, 2026 3:45 PM"

#### Technical Dependencies

- PDF generation library (e.g., PDFKit, Puppeteer for HTML-to-PDF)
- Transaction data (REQ-001, REQ-003)
- Tax calculation (REQ-004)
- Email service (SendGrid or SMTP)

#### Success Metrics

- 95%+ of reports generate successfully without errors
- Average generation time: <10 seconds
- User satisfaction: 80%+ report report is "clear and useful" (survey)

---

### REQ-007: Mobile Receipt Capture

**User Story:** US-004
**Priority:** P0 - Critical
**Complexity:** Medium

#### Functional Requirements

**FR-007-01:** Mobile app shall include a camera interface to capture receipt photos.

**FR-007-02:** Receipt capture flow:
1. User taps "Add Expense" floating action button
2. Selects "Scan Receipt"
3. Camera opens with cropping guide overlay
4. User captures photo
5. Photo is uploaded to cloud storage
6. OCR extracts: Date, Merchant Name, Total Amount
7. User confirms/edits extracted data
8. Expense is saved with photo attached

**FR-007-03:** OCR (Optical Character Recognition) shall extract:
- Merchant name (e.g., "Shell Gas Station")
- Transaction date
- Total amount (USD)

**FR-007-04:** If OCR confidence is low (<70%), pre-fill fields with extracted data but flag for user review.

**FR-007-05:** Users shall be able to manually enter data if OCR fails (fallback).

**FR-007-06:** Receipt photo shall be stored in cloud storage (AWS S3 or equivalent) and linked to expense record.

**FR-007-07:** Users shall be able to view receipt photo by tapping on expense entry.

**FR-007-08:** Photos shall be compressed to <500KB to minimize storage costs.

#### Acceptance Criteria

**AC-007-01:**
GIVEN a user taps "Scan Receipt"
WHEN they capture a clear receipt photo
THEN OCR extracts merchant name, date, and amount with >80% accuracy within 5 seconds

**AC-007-02:**
GIVEN OCR extracts "Shel Gas" instead of "Shell Gas"
WHEN the user reviews the expense
THEN they can manually edit the merchant name before saving

**AC-007-03:**
GIVEN a user captures a faded receipt
WHEN OCR confidence is 50%
THEN the system flags fields with low confidence in yellow and prompts manual review

**AC-007-04:**
GIVEN a user saves an expense with receipt photo
WHEN they tap the expense in the list
THEN the receipt photo opens in a full-screen viewer

**AC-007-05:**
GIVEN a receipt photo is 2MB
WHEN it is uploaded
THEN it is compressed to <500KB without significant quality loss

#### Edge Cases

**EC-007-01:** Receipt is crumpled or torn
**Handling:** OCR may fail; allow manual entry, save photo anyway for reference

**EC-007-02:** Receipt is in non-English language
**Handling:** MVP supports English only; OCR fails gracefully, user enters manually

**EC-007-03:** Receipt has multiple line items (e.g., grocery receipt with 20 items)
**Handling:** MVP extracts total only, not line-by-line breakdown (future feature)

**EC-007-04:** User captures photo in low light
**Handling:** App suggests retaking photo with flash enabled

**EC-007-05:** User loses internet connection mid-upload
**Handling:** Queue photo for upload when connection resumes, save expense locally

#### Technical Dependencies

- Mobile app camera access (iOS/Android permissions)
- OCR service (Google Cloud Vision API, AWS Textract, or Tesseract.js)
- Cloud storage (AWS S3, Firebase Storage)
- Image compression library

#### Success Metrics

- OCR accuracy: 80%+ for merchant name, 90%+ for total amount
- Receipt capture to save time: <60 seconds average
- Photo upload success rate: 98%+

---

### REQ-008: Manual Expense Entry

**User Story:** US-005
**Priority:** P0 - Critical
**Complexity:** Low

#### Functional Requirements

**FR-008-01:** Users shall be able to manually add expenses via a form with the following fields:
- **Date** (date picker, default: today)
- **Merchant/Description** (text input, required)
- **Amount** (numeric input, USD, required)
- **Category** (dropdown: IRS Schedule C categories, required)
- **Business vs Personal** (toggle, default: Business)
- **Notes** (optional text area for additional context)
- **Attach Photo** (optional, can upload receipt from gallery)

**FR-008-02:** Form shall validate:
- Amount is >$0 and ≤$50,000 (prevent errors)
- Date is not in the future
- Category is selected

**FR-008-03:** Common expense types shall be pre-filled templates:
- Mileage: "XX miles @ $0.67/mile" (2026 IRS rate)
- Home Office: "% of rent/mortgage"
- Phone/Internet: "Business use %"

**FR-008-04:** Manual expenses shall appear in the expense list alongside auto-imported transactions.

**FR-008-05:** Users shall be able to edit or delete manual expenses at any time.

#### Acceptance Criteria

**AC-008-01:**
GIVEN a user taps "Add Expense" > "Manual Entry"
WHEN they fill in Date: Jan 15, Merchant: "Office Depot", Amount: $45, Category: "Supplies"
THEN the expense is saved and appears in the expense list immediately

**AC-008-02:**
GIVEN a user enters Amount: $0
WHEN they attempt to save
THEN they see an error "Amount must be greater than $0"

**AC-008-03:**
GIVEN a user selects "Mileage" template
WHEN they enter "120 miles"
THEN the amount auto-calculates to $80.40 (120 × $0.67)

**AC-008-04:**
GIVEN a user adds a manual expense with notes "Client meeting lunch"
WHEN they view the expense detail
THEN the notes are displayed below the main expense info

**AC-008-05:**
GIVEN a user edits a previously saved expense
WHEN they change Amount from $45 to $50
THEN the tax estimate updates to reflect the $5 increase in deductions

#### Edge Cases

**EC-008-01:** User enters a very large amount (e.g., $100,000)
**Handling:** Show confirmation dialog "This amount is unusually high. Confirm?"

**EC-008-02:** User enters a date from 2 years ago
**Handling:** Allow but warn "This expense is from a prior tax year and will not affect current estimates"

**EC-008-03:** User enters a negative amount
**Handling:** Reject with error "Amount must be positive"

**EC-008-04:** User deletes an expense that was used in a generated report
**Handling:** Allow deletion but include warning "This expense was included in reports generated on [dates]"

#### Technical Dependencies

- Form validation library
- Date picker component (native mobile or web)
- Mileage rate config (updateable annually per IRS)

#### Success Metrics

- 90%+ of manual expense entries complete successfully on first attempt
- Average time to add manual expense: <45 seconds

---

### REQ-009: Dashboard (Income vs Expenses vs Tax Liability)

**User Story:** US-003
**Priority:** P0 - Critical
**Complexity:** Medium

#### Functional Requirements

**FR-009-01:** Dashboard shall display the following key metrics at the top:
1. **Total Income (YTD):** Sum of all 1099 income
2. **Total Deductions (YTD):** Sum of all business expenses
3. **Net Profit (YTD):** Income - Deductions
4. **Estimated Tax Owed (Current Quarter):** From REQ-004

**FR-009-02:** Metrics shall be displayed as large, easy-to-read cards with icons.

**FR-009-03:** Dashboard shall include:
- **Income Chart:** Bar chart or line chart showing monthly income trend (last 6 months)
- **Expense Breakdown:** Pie chart showing expenses by category
- **Recent Transactions:** List of last 10 transactions (income + expenses) with date, description, amount

**FR-009-04:** Dashboard shall update in real-time when new transactions are imported or added.

**FR-009-05:** Users shall be able to filter dashboard by:
- Date range (Last 30 days, Last 90 days, YTD, Custom)
- Income source (All, Venmo, PayPal, Stripe, etc.)

**FR-009-06:** Dashboard shall include quick action buttons:
- "Add Expense"
- "Scan Receipt"
- "Generate Report"
- "Refresh Transactions"

#### Acceptance Criteria

**AC-009-01:**
GIVEN a user has $8,000 income and $2,000 expenses
WHEN they open the Dashboard
THEN they see cards displaying: Income: $8,000, Deductions: $2,000, Net Profit: $6,000, Estimated Tax: ~$1,380

**AC-009-02:**
GIVEN a user adds a new $300 expense
WHEN they return to the Dashboard
THEN the Total Deductions card updates to reflect the new total within 2 seconds

**AC-009-03:**
GIVEN a user selects "Last 30 days" filter
WHEN the filter is applied
THEN all metrics and charts update to show only data from the last 30 days

**AC-009-04:**
GIVEN a user has income from Venmo ($3,000) and PayPal ($5,000)
WHEN they view the Income Chart
THEN the chart shows a breakdown by source

**AC-009-05:**
GIVEN a user has no transactions
WHEN they open the Dashboard
THEN they see an empty state with message "Connect an account or add income to get started"

#### Edge Cases

**EC-009-01:** User has 0 income but $500 in expenses
**Handling:** Display Net Profit as -$500 (loss) in red, Estimated Tax: $0

**EC-009-02:** User has 1,000+ transactions
**Handling:** Chart aggregates by month (not overwhelming), Recent Transactions shows last 10 only

**EC-009-03:** User connects account mid-month
**Handling:** Monthly chart shows partial data for current month with note "Data since [connection date]"

#### Technical Dependencies

- Chart library (Chart.js, Recharts, or native iOS/Android charts)
- Real-time data sync (WebSockets or polling)
- Transaction data (REQ-001, REQ-003)
- Tax calculation (REQ-004)

#### Success Metrics

- Dashboard load time: <2 seconds on average
- 95%+ of users report Dashboard is "easy to understand" (onboarding survey)

---

### REQ-010: Notification System

**User Story:** US-008, US-014 (P1)
**Priority:** P0 - Critical
**Complexity:** Low

#### Functional Requirements

**FR-010-01:** System shall send push notifications for:
- Threshold alerts (REQ-002)
- Quarterly tax deadline reminders (7 days before, 1 day before)
- Transactions needing review (weekly digest)
- Account connection issues (e.g., Plaid token expired)

**FR-010-02:** Users shall be able to configure notification preferences:
- Enable/disable push notifications (global toggle)
- Select notification types (threshold alerts, deadlines, transaction reviews)
- Set quiet hours (e.g., 10 PM - 8 AM)

**FR-010-03:** In-app notification center shall display all notifications with:
- Timestamp
- Notification type (icon)
- Message
- Action button (if applicable)

**FR-010-04:** Notifications shall be marked as read/unread with badge count on app icon.

#### Acceptance Criteria

**AC-010-01:**
GIVEN a user enables "Quarterly deadline reminders"
WHEN April 8 arrives (7 days before Q1 deadline)
THEN they receive a push notification "Q1 tax deadline in 7 days. Estimated payment: $X"

**AC-010-02:**
GIVEN a user disables push notifications
WHEN a threshold alert is triggered
THEN the notification appears in the in-app notification center but no push is sent

**AC-010-03:**
GIVEN a user sets quiet hours 10 PM - 8 AM
WHEN a notification is scheduled for 11 PM
THEN it is delayed until 8 AM the next day

**AC-010-04:**
GIVEN a user has 3 unread notifications
WHEN they open the app
THEN the notification center shows a "3" badge

#### Edge Cases

**EC-010-01:** User has push notifications disabled at OS level (iOS/Android settings)
**Handling:** Detect permission status, show in-app prompt to enable in OS settings

**EC-010-02:** Notification is sent but user has uninstalled the app
**Handling:** Push service returns "unregistered," remove device token from database

#### Technical Dependencies

- Push notification service (Firebase Cloud Messaging, Apple Push Notification Service)
- Notification scheduling (cron jobs for deadline reminders)
- User settings database

#### Success Metrics

- 80%+ of users enable push notifications
- <5% notification delivery failure rate

---

## Data Model

This section defines the core database schema for the MVP.

### Entity-Relationship Diagram (Simplified)

```
[User] 1 ────< * [Account]
  |
  └──< * [Transaction]
  |       └──< [Expense]
  |       └──< [Income]
  |
  └──< * [ManualExpense]
  |
  └──< * [TaxEstimate]
  |
  └──< * [Notification]
```

### Schema Definitions

#### 1. Users Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hashed password |
| full_name | VARCHAR(255) | NOT NULL | User's full name |
| tax_filing_status | ENUM('single', 'married_joint', 'married_separate', 'head_of_household') | DEFAULT 'single' | Tax filing status |
| marginal_tax_rate | DECIMAL(4,2) | DEFAULT 22.00 | User's marginal tax rate (%) |
| w2_withholding_annual | DECIMAL(10,2) | DEFAULT 0.00 | Annual W2 withholding amount |
| created_at | TIMESTAMP | NOT NULL | Account creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_user_email` on `email`

---

#### 2. Accounts Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| account_id | UUID | PRIMARY KEY | Unique account identifier |
| user_id | UUID | FOREIGN KEY → Users(user_id), NOT NULL | Owner user |
| platform | ENUM('plaid_bank', 'venmo', 'paypal', 'cashapp', 'stripe') | NOT NULL | Platform type |
| account_name | VARCHAR(255) | NOT NULL | Display name (e.g., "Chase Checking") |
| plaid_access_token | VARCHAR(255) | NULLABLE | Encrypted Plaid access token |
| plaid_account_id | VARCHAR(255) | NULLABLE | Plaid account identifier |
| connection_status | ENUM('connected', 'disconnected', 'error') | DEFAULT 'connected' | Connection status |
| last_synced_at | TIMESTAMP | NULLABLE | Last successful transaction sync |
| created_at | TIMESTAMP | NOT NULL | Connection timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_account_user` on `user_id`
- `idx_account_plaid` on `plaid_account_id`

---

#### 3. Transactions Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| transaction_id | UUID | PRIMARY KEY | Unique transaction identifier |
| user_id | UUID | FOREIGN KEY → Users(user_id), NOT NULL | Owner user |
| account_id | UUID | FOREIGN KEY → Accounts(account_id), NOT NULL | Source account |
| external_transaction_id | VARCHAR(255) | NOT NULL | Platform-specific transaction ID (for deduplication) |
| transaction_date | DATE | NOT NULL | Transaction date |
| amount | DECIMAL(10,2) | NOT NULL | Transaction amount (USD) |
| description | TEXT | NULLABLE | Transaction description/memo |
| merchant_name | VARCHAR(255) | NULLABLE | Extracted merchant name |
| mcc_code | VARCHAR(10) | NULLABLE | Merchant category code |
| transaction_type | ENUM('income', 'expense', 'transfer', 'refund') | NOT NULL | Transaction type |
| category | VARCHAR(100) | NULLABLE | Expense category (if expense) |
| is_business | BOOLEAN | DEFAULT NULL | Business (true) vs Personal (false), NULL if uncategorized |
| categorization_confidence | DECIMAL(3,2) | NULLABLE | Confidence score (0.00-1.00) |
| reviewed_by_user | BOOLEAN | DEFAULT FALSE | User confirmed categorization |
| created_at | TIMESTAMP | NOT NULL | Import timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_transaction_user` on `user_id`
- `idx_transaction_date` on `transaction_date`
- `idx_transaction_external_id` on `external_transaction_id` (for deduplication)

**Unique Constraint:**
- `unique_external_transaction` on (`account_id`, `external_transaction_id`)

---

#### 4. ManualExpenses Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| manual_expense_id | UUID | PRIMARY KEY | Unique manual expense identifier |
| user_id | UUID | FOREIGN KEY → Users(user_id), NOT NULL | Owner user |
| expense_date | DATE | NOT NULL | Expense date |
| merchant | VARCHAR(255) | NOT NULL | Merchant/description |
| amount | DECIMAL(10,2) | NOT NULL | Expense amount (USD) |
| category | VARCHAR(100) | NOT NULL | IRS Schedule C category |
| is_business | BOOLEAN | DEFAULT TRUE | Business expense flag |
| notes | TEXT | NULLABLE | Optional notes |
| receipt_photo_url | VARCHAR(500) | NULLABLE | Cloud storage URL for receipt photo |
| ocr_confidence | DECIMAL(3,2) | NULLABLE | OCR confidence (if from receipt scan) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**Indexes:**
- `idx_manual_expense_user` on `user_id`
- `idx_manual_expense_date` on `expense_date`

---

#### 5. TaxEstimates Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| tax_estimate_id | UUID | PRIMARY KEY | Unique estimate identifier |
| user_id | UUID | FOREIGN KEY → Users(user_id), NOT NULL | Owner user |
| tax_year | INT | NOT NULL | Tax year (e.g., 2026) |
| quarter | INT | NOT NULL | Quarter (1-4) |
| total_income | DECIMAL(10,2) | NOT NULL | Total 1099 income for period |
| total_deductions | DECIMAL(10,2) | NOT NULL | Total business deductions |
| net_profit | DECIMAL(10,2) | NOT NULL | Income - Deductions |
| self_employment_tax | DECIMAL(10,2) | NOT NULL | SE tax calculated |
| income_tax | DECIMAL(10,2) | NOT NULL | Income tax estimated |
| total_tax_owed | DECIMAL(10,2) | NOT NULL | Total quarterly tax |
| calculated_at | TIMESTAMP | NOT NULL | Calculation timestamp |

**Indexes:**
- `idx_tax_estimate_user_year` on (`user_id`, `tax_year`, `quarter`)

**Unique Constraint:**
- `unique_user_quarter` on (`user_id`, `tax_year`, `quarter`)

---

#### 6. Notifications Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| notification_id | UUID | PRIMARY KEY | Unique notification identifier |
| user_id | UUID | FOREIGN KEY → Users(user_id), NOT NULL | Recipient user |
| notification_type | ENUM('threshold_alert', 'deadline_reminder', 'review_needed', 'connection_error') | NOT NULL | Notification type |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification message |
| action_url | VARCHAR(500) | NULLABLE | Deep link URL (e.g., /tax-estimate) |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| sent_at | TIMESTAMP | NOT NULL | Send timestamp |

**Indexes:**
- `idx_notification_user` on `user_id`
- `idx_notification_unread` on (`user_id`, `is_read`)

---

### Data Validation Rules

**DV-001:** All monetary amounts (DECIMAL fields) must be rounded to 2 decimal places.
**DV-002:** Transaction dates cannot be more than 5 years in the past or in the future.
**DV-003:** Email addresses must match regex: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
**DV-004:** Plaid access tokens must be encrypted at rest using AES-256.
**DV-005:** Receipt photo URLs must use HTTPS.
**DV-006:** Categorization confidence scores must be between 0.00 and 1.00.

---

## Technical Architecture

### Architecture Style

**Monolith-first approach** for MVP to maximize development speed. Microservices architecture is NOT recommended until post-PMF scale.

### Tech Stack Recommendations

#### Frontend

**Mobile App:**
- **Framework:** React Native (cross-platform iOS + Android)
  - **Why:** Single codebase, fast iteration, strong community support
  - **Alternative:** Flutter (if team prefers Dart)
- **State Management:** Redux Toolkit or Zustand
- **UI Library:** React Native Paper or NativeBase
- **Navigation:** React Navigation
- **Camera/OCR:** react-native-camera + Google Cloud Vision API

**Web App:**
- **Framework:** Next.js (React)
  - **Why:** SEO-friendly, server-side rendering, API routes
  - **Alternative:** Vite + React (if no SEO requirements)
- **State Management:** Redux Toolkit
- **UI Library:** Material-UI (MUI) or Tailwind CSS + Headless UI
- **Charts:** Recharts or Chart.js

#### Backend

**API Server:**
- **Framework:** Node.js + Express.js OR Python + FastAPI
  - **Recommendation:** Node.js (same language as frontend, easier for small teams)
- **Authentication:** JWT (JSON Web Tokens) + Passport.js
- **API Design:** RESTful API (OpenAPI/Swagger documentation)

**Database:**
- **Primary Database:** PostgreSQL
  - **Why:** ACID compliance, strong data integrity, JSON support (for flexible fields)
  - **Hosting:** AWS RDS, Google Cloud SQL, or Supabase
- **Caching:** Redis (for session storage, rate limiting)

**File Storage:**
- **Service:** AWS S3 or Firebase Storage
  - **Use:** Receipt photo storage
  - **Lifecycle Policy:** Compress images on upload, delete after 7 years (IRS retention requirement)

#### Third-Party Services

**Payment Platform Integrations:**
- **Plaid:** Bank account, Venmo, PayPal, Cash App connections
  - **Pricing:** $0.25-0.60 per API call (Development is free)
  - **Fallback:** Manual CSV upload if Plaid integration fails
- **Stripe API:** Direct integration for Stripe users
  - **Pricing:** Free API access for Stripe-connected accounts

**OCR:**
- **Service:** Google Cloud Vision API OR AWS Textract
  - **Recommendation:** Google Cloud Vision (better accuracy for receipts)
  - **Pricing:** $1.50 per 1,000 images (first 1,000/month free)
  - **Fallback:** Tesseract.js (open-source, lower accuracy but free)

**Notifications:**
- **Service:** Firebase Cloud Messaging (FCM)
  - **Why:** Free, cross-platform (iOS + Android), reliable
- **Email:** SendGrid or AWS SES (for digest emails, reports)

**Analytics:**
- **Service:** Mixpanel or Amplitude (user behavior tracking)
- **Crash Reporting:** Sentry

#### Infrastructure

**Hosting:**
- **Backend:** AWS Elastic Beanstalk, Google Cloud Run, or Railway.app
  - **Recommendation:** Railway.app for MVP (easiest deployment)
- **Frontend (Web):** Vercel (for Next.js) or Netlify
- **Database:** Supabase (PostgreSQL + auth + storage all-in-one) OR AWS RDS

**CI/CD:**
- **Service:** GitHub Actions
  - **Pipeline:** Lint → Test → Build → Deploy (staging + production)

**Monitoring:**
- **APM:** New Relic or Datadog (performance monitoring)
- **Uptime:** UptimeRobot or Pingdom

---

### Architecture Diagram (Simplified)

```
┌─────────────────┐         ┌─────────────────┐
│   Mobile App    │         │     Web App     │
│  (React Native) │         │    (Next.js)    │
└────────┬────────┘         └────────┬────────┘
         │                           │
         └───────────┬───────────────┘
                     │ HTTPS
         ┌───────────▼───────────┐
         │    API Server         │
         │  (Node.js + Express)  │
         └───────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌───▼────┐ ┌───▼─────┐
    │  Plaid  │ │PostgreSQL│ │ AWS S3  │
    │   API   │ │ Database │ │(Receipts)│
    └─────────┘ └──────────┘ └─────────┘
```

---

### Security Requirements

**SEC-001:** All API endpoints must use HTTPS (TLS 1.2+).
**SEC-002:** Passwords must be hashed using bcrypt (cost factor ≥12).
**SEC-003:** Plaid access tokens must be encrypted at rest (AES-256).
**SEC-004:** API rate limiting: 100 requests per minute per user.
**SEC-005:** SQL injection prevention: Use parameterized queries only.
**SEC-006:** XSS prevention: Sanitize all user inputs before rendering.
**SEC-007:** CSRF protection: Use CSRF tokens for state-changing requests.
**SEC-008:** User sessions expire after 30 days of inactivity.
**SEC-009:** Two-factor authentication (2FA) available for premium users (P1).
**SEC-010:** Compliance: SOC 2 Type II audit within 12 months of launch (for enterprise sales).

---

### Scalability Considerations (Post-MVP)

**SCALE-001:** Horizontal scaling: Stateless API servers behind load balancer (AWS ALB).
**SCALE-002:** Database read replicas for reporting queries (separate from transactional writes).
**SCALE-003:** Background job queue (Bull.js + Redis) for transaction imports and tax calculations.
**SCALE-004:** CDN for static assets (Cloudflare or AWS CloudFront).
**SCALE-005:** Database partitioning by user_id for >1M users.

---

## API Integrations

### Integration Priority

| Integration | Priority | Purpose | Estimated Cost (per user/month) |
|-------------|----------|---------|----------------------------------|
| Plaid | P0 - Critical | Bank account + payment platform connections | $0.10-0.30 |
| Stripe API | P0 - Critical | Stripe transaction import | Free |
| Google Cloud Vision API | P0 - Critical | Receipt OCR | $0.05-0.10 |
| Firebase Cloud Messaging | P0 - Critical | Push notifications | Free |
| SendGrid | P0 - Critical | Email (reports, digests) | $0.01 |
| **Total MVP Cost per User** | | | **$0.16-0.41/month** |

### Post-MVP Integrations (P1/P2)

| Integration | Priority | Purpose | Notes |
|-------------|----------|---------|-------|
| TurboTax API | P1 | Export to TurboTax | Explore partnership |
| QuickBooks API | P2 | Export to QuickBooks | For users upgrading to full accounting |
| Expensify API | P2 | Import expenses from Expensify | If users already use Expensify |
| IRS e-file API | P2 | Direct tax filing | Complex, requires IRS approval |

---

### Plaid Integration Details

**Endpoint:** Plaid Transactions API
**Documentation:** https://plaid.com/docs/api/products/transactions/

**Implementation Steps:**

1. **Link Account (OAuth):**
   - User clicks "Connect Bank Account"
   - Plaid Link SDK opens (iframe or native modal)
   - User authenticates with bank credentials
   - Plaid returns `access_token` + `account_id`
   - Store encrypted `access_token` in database

2. **Fetch Transactions:**
   - API call: `POST /transactions/get`
   - Parameters: `access_token`, `start_date`, `end_date`
   - Returns: Array of transactions with date, amount, name, category

3. **Sync Schedule:**
   - Daily cron job at 2 AM ET
   - Fetch transactions from `last_synced_at` to current date
   - Deduplicate using `transaction_id`

4. **Error Handling:**
   - `ITEM_LOGIN_REQUIRED`: Notify user to re-authenticate
   - `RATE_LIMIT_EXCEEDED`: Retry with exponential backoff
   - `INVALID_ACCESS_TOKEN`: Mark account as disconnected

**Fallback Strategy:**

If Plaid integration fails (API downtime, user's bank not supported):
- Provide manual CSV upload feature
- Parse CSV columns: Date, Description, Amount
- Require user to map columns to system fields

---

### Stripe API Integration Details

**Endpoint:** Stripe Balance Transactions API
**Documentation:** https://stripe.com/docs/api/balance_transactions

**Implementation:**

1. User connects Stripe account via OAuth (Stripe Connect)
2. Fetch balance transactions: `GET /v1/balance_transactions`
3. Filter for `type: "charge"` (exclude refunds in MVP)
4. Map to income transactions

**Cost:** Free (no API fees for accessing own Stripe account)

---

### Google Cloud Vision API Integration Details

**Endpoint:** Vision API - Text Detection (OCR)
**Documentation:** https://cloud.google.com/vision/docs/ocr

**Implementation:**

1. User captures receipt photo (mobile app)
2. Upload photo to AWS S3
3. Call Vision API: `POST /v1/images:annotate`
   - Input: Base64-encoded image OR S3 public URL
   - Feature: `TEXT_DETECTION`
4. Parse response for:
   - Merchant name (heuristic: first line or largest text)
   - Total amount (regex: `\$\d+\.\d{2}`)
   - Date (regex: MM/DD/YYYY or similar formats)
5. Return extracted fields with confidence scores

**Cost:** $1.50 per 1,000 images (first 1,000/month free)

**Fallback:** If OCR fails, allow manual entry.

---

## MVP Scope Definition

### What IS in MVP (Alpha - 60 Days)

**Core Features (P0):**
✅ User authentication (email/password, Google OAuth)
✅ Connect 1 bank account via Plaid
✅ Connect Venmo, PayPal, Cash App (via Plaid)
✅ Connect Stripe (via Stripe API)
✅ Auto-import transactions daily
✅ Auto-categorize income (1099 vs personal transfer) with 80%+ accuracy
✅ Manual expense entry form
✅ Mobile receipt photo capture + basic OCR
✅ Expense categorization (IRS Schedule C categories)
✅ Business vs personal expense tagging
✅ Dashboard: Income, Deductions, Net Profit, Tax Estimate
✅ Quarterly tax estimate calculator (federal self-employment tax only)
✅ Income threshold alerts ($4K, $5K IRS reporting)
✅ Generate PDF tax report (Schedule C format)
✅ Email report to user/accountant
✅ Push notifications (threshold alerts, connection errors)
✅ In-app notification center

**Platforms:**
✅ Mobile app (iOS + Android via React Native)
✅ Web app (responsive, desktop/tablet)

**Pricing:**
✅ Free tier: Up to $10,000 annual income, 1 connected account, basic reports
✅ Premium tier placeholder (UI shows "Upgrade to Premium" but payment not implemented in Alpha)

---

### What IS NOT in MVP (Explicit Exclusions)

**Excluded from Alpha (may be added in Beta/P1):**

❌ **Automatic mileage tracking (GPS)** - Manual mileage entry only
❌ **Machine learning categorization** - Rules-based only for MVP
❌ **TurboTax/H&R Block export** - Manual report only
❌ **State tax calculations** - Federal only
❌ **Multi-business support** - Single business entity only
❌ **Advanced deductions** (home office, depreciation, inventory) - Standard categories only
❌ **Accounts receivable tracking** - Income tracking only (not invoicing)
❌ **Bill negotiation** - Not in scope (different product)
❌ **Tax filing submission** - Reports only, not direct filing
❌ **Accountant collaboration portal** - Email reports only
❌ **Historical data import** (>90 days) - 90-day lookback only
❌ **Multi-user accounts** (family, business partners) - Single user only
❌ **Recurring expense tracking** - All expenses treated as one-time
❌ **Savings goals** ("Save $X for Q2 taxes") - Calculation only, not goal tracking

**Explicitly OUT of Scope Forever:**

🚫 **Full accounting software features** (inventory, invoicing, AP/AR) - Use QuickBooks
🚫 **Investment/stock trading tax tracking** - Different product category
🚫 **Crypto tax tracking** - Complex, separate product
🚫 **International tax support** - U.S. only
🚫 **Audit defense services** - Legal/insurance product

---

### MVP Rationale

**Why these exclusions?**

1. **Automatic mileage tracking:** GPS tracking is battery-intensive and requires constant permissions. Manual entry is "good enough" for MVP validation.

2. **Machine learning categorization:** Rules-based engine (keywords + MCCs) achieves 80%+ accuracy. ML adds complexity with marginal improvement (<5%) for MVP.

3. **TurboTax export:** API partnership negotiations take months. Manual PDF report covers the job.

4. **State tax:** 50 different state tax systems. Federal-only covers 90% of user need (state is often pass-through).

5. **Advanced deductions:** Home office requires square footage calculations; depreciation requires asset tracking. These serve <20% of users and add significant complexity.

---

### Minimum Success Criteria (Alpha Launch)

**MVP is successful if:**

✅ **100 beta users** sign up within 2 weeks of launch
✅ **60%+ connect at least 1 account** (activation rate)
✅ **40%+ return weekly** to review transactions (engagement)
✅ **80%+ report tax estimate is "accurate and helpful"** (user survey)
✅ **<5% bug rate** (critical bugs blocking core workflows)
✅ **<2s dashboard load time** on 4G mobile connection

**Pivot signals:**

🔴 <30 signups in 2 weeks → Marketing/positioning problem
🔴 <20% connect accounts → Onboarding friction or trust issue
🔴 <10% weekly engagement → Product doesn't solve a frequent pain point
🔴 >50% report tax estimate is "inaccurate" → Core value prop broken

---

## Non-Functional Requirements

### Performance

**NFR-001:** Dashboard loads in <2 seconds on 4G mobile connection (90th percentile).
**NFR-002:** Transaction import completes within 10 seconds for 90-day history (up to 500 transactions).
**NFR-003:** Receipt photo upload completes within 5 seconds on 4G connection.
**NFR-004:** Tax estimate calculation completes within 1 second after data change.
**NFR-005:** PDF report generation completes within 10 seconds for 12 months of data.
**NFR-006:** API response time: <500ms for 95% of requests.

### Reliability

**NFR-007:** System uptime: 99.5% (allows ~3.6 hours downtime per month).
**NFR-008:** Transaction sync success rate: 98%+ (excluding user auth failures).
**NFR-009:** Zero data loss for user-entered expenses (database backup every 6 hours).
**NFR-010:** Graceful degradation: If Plaid is down, manual CSV upload remains available.

### Usability

**NFR-011:** New user completes onboarding (account creation + first account connection) in <5 minutes.
**NFR-012:** Mobile app supports iOS 14+ and Android 10+.
**NFR-013:** Web app supports Chrome, Safari, Firefox, Edge (last 2 versions).
**NFR-014:** Accessibility: WCAG 2.1 Level AA compliance (keyboard navigation, screen reader support).
**NFR-015:** Error messages are user-friendly (no technical jargon).

### Security

**NFR-016:** All data in transit encrypted with TLS 1.2+.
**NFR-017:** All sensitive data at rest encrypted (database encryption, S3 encryption).
**NFR-018:** Password requirements: Minimum 8 characters, 1 uppercase, 1 number.
**NFR-019:** Automated security scans (OWASP ZAP) run weekly in CI/CD pipeline.
**NFR-020:** Penetration testing conducted before public launch.

### Compliance

**NFR-021:** Data retention: Transaction data retained for 7 years (IRS requirement).
**NFR-022:** GDPR compliance: Users can export all data (JSON format) and request deletion.
**NFR-023:** CCPA compliance: Privacy policy includes data sale opt-out (we don't sell data).
**NFR-024:** Financial data handling: Comply with Plaid security requirements.

### Maintainability

**NFR-025:** Code coverage: 80%+ unit test coverage for backend API.
**NFR-026:** API documentation: OpenAPI/Swagger spec auto-generated and published.
**NFR-027:** Logging: Structured JSON logs for all API requests (timestamp, user_id, endpoint, status code).
**NFR-028:** Error tracking: All unhandled exceptions logged to Sentry with stack traces.

---

## Sprint Plan (60-Day Alpha)

### Sprint Overview

**Methodology:** Agile Scrum
**Sprint Duration:** 2 weeks
**Total Sprints:** 4
**Team Assumptions:** 2 full-stack developers, 1 designer, 1 product manager (part-time)

---

### Sprint 1 (Days 1-14): Foundation & Authentication

**Goal:** Set up infrastructure, authentication, and basic dashboard skeleton.

**User Stories:**
- US-010: User account creation (email/password, Google OAuth)
- US-011: User login and session management

**Technical Tasks:**
- Set up GitHub repository + CI/CD pipeline (GitHub Actions)
- Provision PostgreSQL database (Supabase or AWS RDS)
- Set up Node.js + Express API server (deploy to Railway.app)
- Implement JWT authentication + Passport.js
- Create database schema (Users, Accounts, Transactions tables)
- Build mobile app skeleton (React Native + navigation)
- Build web app skeleton (Next.js + routing)
- Design system setup (color palette, typography, component library)

**Deliverables:**
- ✅ User can create account via email/password
- ✅ User can log in via Google OAuth
- ✅ User can view empty dashboard with placeholder data
- ✅ Mobile app runs on iOS simulator + Android emulator
- ✅ Web app deploys to Vercel (staging environment)

**Definition of Done:**
- All code merged to `main` branch
- Unit tests pass (80%+ coverage for auth endpoints)
- No critical bugs in Sentry
- Deploy to staging environment

---

### Sprint 2 (Days 15-28): Income Aggregation & Plaid Integration

**Goal:** Connect bank accounts and import transactions.

**User Stories:**
- US-001: Connect bank account via Plaid
- US-003: View total income on dashboard
- US-002: Auto-categorize income (1099 vs personal)

**Technical Tasks:**
- Integrate Plaid Link SDK (mobile + web)
- Implement Plaid Transactions API fetch
- Build transaction deduplication logic
- Create cron job for daily transaction sync (Node-Cron or AWS Lambda)
- Build transaction list UI (mobile + web)
- Implement auto-categorization rules engine (keyword matching)
- Build dashboard cards (Total Income, Total Deductions, Net Profit)
- Stripe API integration (for Stripe users)

**Deliverables:**
- ✅ User can connect Venmo account via Plaid
- ✅ Transactions from last 90 days are imported and displayed
- ✅ Income transactions are auto-categorized with confidence scores
- ✅ Dashboard shows accurate income total
- ✅ User can manually refresh transactions

**Testing:**
- Test with 3 different bank accounts (Chase, Bank of America, Wells Fargo)
- Test with Plaid Sandbox environment
- Validate deduplication logic (import same transaction twice)

**Definition of Done:**
- 95%+ transaction import success rate (Plaid Sandbox)
- Zero duplicate transactions
- Dashboard loads in <2s

---

### Sprint 3 (Days 29-42): Expense Tracking & Tax Calculation

**Goal:** Manual expense entry, receipt capture, and tax estimate.

**User Stories:**
- US-005: Manual expense entry
- US-004: Receipt photo capture + OCR
- US-006: Expense categorization (IRS categories)
- US-007: Quarterly tax estimate

**Technical Tasks:**
- Build manual expense entry form (mobile + web)
- Implement receipt photo upload to AWS S3
- Integrate Google Cloud Vision API for OCR
- Build expense categorization UI (dropdown for IRS categories)
- Implement tax estimate calculation (self-employment tax + income tax)
- Create tax estimate dashboard widget
- Build quarterly deadline countdown timer
- Implement business vs personal expense toggle

**Deliverables:**
- ✅ User can manually add expense with all fields
- ✅ User can capture receipt photo and extract merchant + amount via OCR
- ✅ Expenses are categorized into IRS Schedule C categories
- ✅ Tax estimate is calculated and displayed on dashboard
- ✅ Tax estimate updates in real-time when expenses are added

**Testing:**
- Test OCR with 20 different receipt types (gas, office supplies, meals)
- Validate tax calculation against manual calculation (3 test cases)
- Test edge cases (net loss, zero income, high-income user)

**Definition of Done:**
- OCR accuracy: 80%+ for merchant name, 90%+ for amount
- Tax estimate within ±5% of manual calculation
- Receipt upload completes in <5s on 4G

---

### Sprint 4 (Days 43-60): Reporting, Notifications & Polish

**Goal:** Generate PDF reports, notifications, and prepare for alpha launch.

**User Stories:**
- US-009: Generate PDF tax report
- US-008: Income threshold alerts
- US-010: Notification system

**Technical Tasks:**
- Build PDF report generator (HTML-to-PDF with Puppeteer)
- Create Schedule C report template
- Implement email service (SendGrid) for report delivery
- Build notification system (Firebase Cloud Messaging)
- Create threshold alert logic ($4K, $5K)
- Build in-app notification center
- Implement quarterly deadline reminders
- UI polish (loading states, error states, empty states)
- Onboarding flow (welcome screen, connect account prompt)
- Beta user feedback form (in-app survey)

**Deliverables:**
- ✅ User can generate PDF report with all income/expenses
- ✅ User receives email with PDF attached
- ✅ User receives push notification at $4K and $5K thresholds
- ✅ Quarterly deadline reminders sent 7 days + 1 day before deadline
- ✅ Onboarding flow guides new users through account connection
- ✅ All critical user flows are bug-free

**Testing:**
- Generate report with 500 transactions (stress test)
- Test push notifications on iOS + Android
- Test email delivery to Gmail, Outlook, Yahoo
- User acceptance testing with 10 beta users

**Definition of Done:**
- <5 critical bugs reported by beta testers
- Report generates in <10s for 12 months of data
- 100% push notification delivery rate (test environment)
- App is ready for App Store + Google Play submission (Alpha release)

---

### Post-Sprint 4 (Days 61-90): Beta Launch & Iteration

**Goal:** Public beta launch, user feedback, and feature iteration.

**Activities:**
- Submit mobile app to App Store + Google Play (review: 7-14 days)
- Launch landing page with waitlist (collect emails)
- Onboard first 100 beta users
- Conduct user interviews (20+ users)
- Analyze usage data (Mixpanel)
- Prioritize P1 features based on feedback
- Build P1 features (mileage tracking, TurboTax export, etc.)

**Success Metrics (Beta):**
- 100+ active beta users
- 60%+ weekly retention
- 4.5+ star rating in App Store/Google Play
- <10% support ticket rate (issues per user)

---

## Success Metrics

### Product Metrics (Alpha - 60 Days)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Beta user signups | 100+ | Database count (users table) |
| Activation rate (connect ≥1 account) | 60%+ | % of users with ≥1 connected account |
| Weekly active users (WAU) | 40%+ of total users | % of users logging in 1+ times per week |
| Transaction import success rate | 95%+ | % of Plaid API calls returning 200 status |
| OCR accuracy (merchant name) | 80%+ | Manual validation of 100 receipts |
| OCR accuracy (total amount) | 90%+ | Manual validation of 100 receipts |
| Tax estimate perceived accuracy | 80%+ "accurate" | User survey (5-point scale) |
| Dashboard load time (p90) | <2s | New Relic or Datadog APM |
| Critical bug rate | <5% | % of users reporting blocker bugs |

### Business Metrics (Beta - 90 Days)

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Premium conversion intent | 20%+ say "likely to pay" | In-app survey |
| Referral rate | 15%+ invite a friend | Referral link clicks |
| Retention (30-day) | 50%+ | % of users active on Day 30 |
| Feature usage (receipt capture) | 40%+ use at least once | Event tracking (Mixpanel) |
| Feature usage (generate report) | 30%+ use at least once | Event tracking (Mixpanel) |
| Support ticket rate | <10% | % of users submitting support tickets |

### North Star Metric

**"Number of users who successfully generate a tax report within 30 days of signup"**

**Why this metric?**
- Indicates user has captured enough data to get value
- Correlates with perceived product value (generating report = job completed)
- Predicts likelihood of premium conversion

**Target:** 40%+ of activated users generate a report within 30 days.

---

## Risk Register

### Technical Risks

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy | Owner |
|---------|------------------|------------|--------|---------------------|-------|
| RISK-001 | Plaid API downtime prevents transaction import | Medium | High | Implement manual CSV upload fallback; monitor Plaid status page | Backend Dev |
| RISK-002 | OCR accuracy <70% renders receipt capture useless | Medium | High | Use Google Cloud Vision (best-in-class); allow manual entry fallback | Mobile Dev |
| RISK-003 | Tax calculation logic has errors (legal/financial risk) | Medium | Critical | Validate with CPA; include disclaimer; extensive unit testing | Product Manager |
| RISK-004 | Plaid costs exceed budget ($0.60/user/month) | Low | Medium | Negotiate volume pricing with Plaid; limit transaction sync frequency to daily | Product Manager |
| RISK-005 | Database performance degrades with >10K users | Low | Medium | Implement database indexing; add read replicas if needed | Backend Dev |
| RISK-006 | Mobile app rejected by App Store/Google Play | Medium | High | Follow platform guidelines; submit for review 2 weeks before launch deadline | Mobile Dev |
| RISK-007 | Security breach exposes user financial data | Low | Critical | Encrypt all sensitive data; penetration testing before launch; SOC 2 audit | DevOps/Security |
| RISK-008 | User's bank not supported by Plaid | High | Medium | Support manual CSV upload; prioritize top 20 banks for Plaid | Product Manager |

---

### Market Risks

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy | Owner |
|---------|------------------|------------|--------|---------------------|-------|
| RISK-009 | QuickBooks/Intuit launches competing feature | Medium | High | Focus on simplicity (our differentiator); move fast to capture early adopters | Product Manager |
| RISK-010 | IRS changes $5K threshold (new regulation) | Low | Medium | Monitor IRS updates; update threshold logic (configurable, not hardcoded) | Product Manager |
| RISK-011 | Users unwilling to connect bank accounts (trust issue) | Medium | High | Emphasize security (Plaid is bank-grade); offer manual entry as alternative | Marketing/Product |
| RISK-012 | Users find free spreadsheets "good enough" | High | Medium | Demonstrate time savings (10 hours saved per quarter); automate pain points | Product Manager |
| RISK-013 | Target market smaller than expected (<80M) | Low | Medium | Pivot to adjacent markets (full-time freelancers, small business owners) | CEO/Product |

---

### Execution Risks

| Risk ID | Risk Description | Likelihood | Impact | Mitigation Strategy | Owner |
|---------|------------------|------------|--------|---------------------|-------|
| RISK-014 | 60-day alpha deadline missed | Medium | Medium | Ruthlessly cut scope; prioritize P0 features only; daily standups | Project Manager |
| RISK-015 | Key developer leaves mid-project | Low | High | Cross-train team members; document code thoroughly; pair programming | Engineering Manager |
| RISK-016 | Beta user acquisition fails (<50 signups) | Medium | High | Pre-build waitlist via landing page; partner with gig worker communities (Reddit, Facebook groups) | Marketing/Product |
| RISK-017 | User feedback reveals fundamental product flaw | Medium | Critical | Conduct user interviews in Sprint 2-3 (before final sprint); rapid iteration | Product Manager |

---

## Open Questions

These questions require clarification before or during development.

### Product Questions

**Q-001:** Should we support joint tax filing (married users)? Or single filers only for MVP?
**Recommendation:** Single filers only for MVP. Joint filing adds complexity (allocating income/expenses between spouses).

**Q-002:** Should we track state tax estimates or federal only?
**Recommendation:** Federal only for MVP. State tax has 50 different rule sets; 90% of user pain is federal.

**Q-003:** How do we handle users with multiple businesses (Uber + Etsy + Freelance)?
**Recommendation:** Single business entity for MVP. All income/expenses are aggregated. P1 feature: Multi-business support.

**Q-004:** Should we allow users to track cash income (not via bank account)?
**Recommendation:** Yes, via manual income entry. Many gig workers receive cash tips.

**Q-005:** How far back should we import transactions? 90 days? 12 months? All history?
**Recommendation:** 90 days for MVP (Plaid limit). Historical import (>90 days) is P1 feature (requires Plaid paid tier).

---

### Technical Questions

**Q-006:** Should we build native apps (Swift/Kotlin) or cross-platform (React Native/Flutter)?
**Recommendation:** React Native (cross-platform). Faster development, shared codebase. Native can be considered post-PMF if performance issues arise.

**Q-007:** Should we use a BaaS (Backend-as-a-Service like Supabase/Firebase) or build custom backend?
**Recommendation:** Custom backend (Node.js + Express) for flexibility. Supabase for PostgreSQL hosting + auth is acceptable to speed up MVP.

**Q-008:** How do we handle Plaid API rate limits (sandbox: 100 requests/day)?
**Recommendation:** Use Plaid Development environment (higher limits) for beta testing. Production has no rate limits.

**Q-009:** Should we support offline mode (e.g., capture receipt without internet)?
**Recommendation:** P1 feature. MVP requires internet connection. Queue receipts for upload when connection resumes.

---

### Business Questions

**Q-010:** What is the premium pricing? $4.99/month? $5.99/month? $7.99/month?
**Recommendation:** $5.99/month (validated in market research). A/B test $4.99 vs $5.99 in Beta.

**Q-011:** Should we offer a free trial? If so, how long? 7 days? 30 days?
**Recommendation:** 30-day free trial (common for fintech apps). Gives users time to accumulate data and see value.

**Q-012:** Should we have annual pricing ($59/year = $4.92/month)?
**Recommendation:** Yes, offer annual option at 17% discount. Improves cash flow and retention.

**Q-013:** What features are Premium vs Free?
**Recommendation:**
- **Free:** Up to $10K income/year, 1 connected account, basic reports, 90-day history
- **Premium:** Unlimited income, unlimited accounts, advanced reports, TurboTax export, mileage tracking, 7-year history

**Q-014:** Should we pursue B2B (sell to gig platforms like Uber, DoorDash)?
**Recommendation:** B2C first for MVP. B2B partnership discussions can happen in parallel (6-12 month sales cycle).

---

### Compliance Questions

**Q-015:** Do we need to register as a tax preparer with the IRS?
**Recommendation:** Consult tax attorney. Likely NO if we only provide estimates and reports (not actual filing). Include disclaimer.

**Q-016:** Are we subject to financial regulations (FinCEN, etc.) since we handle income data?
**Recommendation:** Consult legal. Likely NO since we don't hold funds or process payments. We're a data aggregation tool.

**Q-017:** What data retention policy should we have? IRS requires 7 years, but can users delete sooner?
**Recommendation:** Default retention: 7 years. Users can request early deletion (GDPR/CCPA right), but warn them it may violate IRS record-keeping requirements.

---

## Assumptions

This section documents all assumptions made during requirements development. These should be validated with users and stakeholders.

### User Assumptions

**ASSUM-001:** Target users have basic smartphone literacy (can download apps, take photos).
**ASSUM-002:** Target users have an active checking account or payment platform (Venmo, PayPal).
**ASSUM-003:** Target users file taxes annually (not avoiding IRS obligations).
**ASSUM-004:** Target users speak/read English.
**ASSUM-005:** Target users are U.S. residents subject to IRS taxation.

### Technical Assumptions

**ASSUM-006:** Plaid supports 90% of U.S. banks and payment platforms.
**ASSUM-007:** Google Cloud Vision API achieves 80%+ OCR accuracy for receipts.
**ASSUM-008:** AWS S3 has 99.99% uptime for receipt photo storage.
**ASSUM-009:** Mobile devices have cameras with ≥8MP resolution (sufficient for receipt OCR).
**ASSUM-010:** Users have internet connection when using the app (offline mode is P1).

### Business Assumptions

**ASSUM-011:** 80 million Americans have side hustles (per market research).
**ASSUM-012:** Target users are willing to pay $5-6/month if product saves them time/money.
**ASSUM-013:** Quarterly tax filing pain point is universal across gig workers (Uber, Etsy, freelancers).
**ASSUM-014:** Users prefer automated categorization over manual entry (even if 80% accurate).
**ASSUM-015:** PDF report format is sufficient for tax filing (users don't need direct e-file integration).

### Regulatory Assumptions

**ASSUM-016:** IRS $5,000 reporting threshold remains in effect for 2026.
**ASSUM-017:** Self-employment tax rate remains 15.3% (2026).
**ASSUM-018:** Standard mileage rate is $0.67/mile (2026 IRS rate).
**ASSUM-019:** Providing tax estimates does not require IRS PTIN (Preparer Tax Identification Number).
**ASSUM-020:** Storing user financial data does not require banking license (data aggregation only).

---

## Appendix

### Glossary

**1099 Income:** Income earned as an independent contractor or freelancer (reported on IRS Form 1099).

**Schedule C:** IRS tax form for reporting profit or loss from a business (sole proprietorship).

**Self-Employment Tax:** Social Security and Medicare tax for self-employed individuals (15.3% of net profit).

**Quarterly Estimated Tax:** Tax payments made four times per year (Apr 15, Jun 15, Sep 15, Jan 15) to cover self-employment tax liability.

**Plaid:** Third-party service that connects apps to users' bank accounts via OAuth.

**OCR (Optical Character Recognition):** Technology that extracts text from images (e.g., reading receipt data from photos).

**MCC (Merchant Category Code):** Four-digit code assigned to merchants by credit card networks (e.g., 5541 = gas stations).

**Marginal Tax Rate:** The tax rate applied to the last dollar of income (e.g., 22% for income $47,150-$100,525 in 2026).

**Net Profit:** Total income minus total deductible expenses.

---

### References

**Market Research:**
- [Market Research Report - Last Mile Opportunities](C:\Users\hair\OneDrive\Desktop\AiApp\.claude\market-research-report-last-mile-opportunities.md)

**IRS Publications:**
- [IRS Publication 535: Business Expenses](https://www.irs.gov/publications/p535)
- [IRS Form 1040-ES: Estimated Tax for Individuals](https://www.irs.gov/forms-pubs/about-form-1040-es)
- [IRS Schedule C: Profit or Loss From Business](https://www.irs.gov/forms-pubs/about-schedule-c-form-1040)

**Third-Party Documentation:**
- [Plaid API Documentation](https://plaid.com/docs/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Google Cloud Vision API](https://cloud.google.com/vision/docs)

---

### Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-28 | Ajay (Requirements Architect) | Initial requirements document created |

---

**Document Status:** ✅ APPROVED FOR DEVELOPMENT

**Next Steps:**
1. Review requirements with development team (Sprint Planning)
2. Validate assumptions with 10 target users (user interviews)
3. Finalize tech stack decisions (team decision meeting)
4. Begin Sprint 1 (Foundation & Authentication)

---

*This requirements document is a living artifact and will be updated as new information emerges during development. All changes must be tracked in the Change Log and approved by the Product Manager.*
