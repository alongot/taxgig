import { Request } from 'express';

// =============================================================================
// USER TYPES
// =============================================================================

export type TaxFilingStatus = 'single' | 'married_joint' | 'married_separate' | 'head_of_household';

export interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  threshold_alerts: boolean;
  deadline_reminders: boolean;
  weekly_digest: boolean;
  transaction_review: boolean;
  quiet_hours_start: string | null; // "22:00" format
  quiet_hours_end: string | null;   // "08:00" format
}

export interface User {
  user_id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  tax_filing_status: TaxFilingStatus;
  marginal_tax_rate: number;
  w2_withholding_annual: number;
  google_id: string | null;
  primary_platform: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  notification_preferences: NotificationPreferences;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  password?: string; // Optional for OAuth users
  full_name: string;
  tax_filing_status?: TaxFilingStatus;
  google_id?: string;
}

export interface UserPublic {
  user_id: string;
  email: string;
  full_name: string;
  tax_filing_status: TaxFilingStatus;
  marginal_tax_rate: number;
  w2_withholding_annual: number;
  primary_platform: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  notification_preferences: NotificationPreferences;
  created_at: Date;
}

export interface UserUpdateInput {
  full_name?: string;
  tax_filing_status?: TaxFilingStatus;
  marginal_tax_rate?: number;
  w2_withholding_annual?: number;
  primary_platform?: string;
  onboarding_completed?: boolean;
  onboarding_step?: number;
  notification_preferences?: Partial<NotificationPreferences>;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface AuthRequest extends Request {
  user?: UserPublic;
}

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface GoogleOAuthPayload {
  sub: string;        // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

// =============================================================================
// ACCOUNT TYPES (for Plaid/Stripe connections)
// =============================================================================

export type PlatformType = 'plaid_bank' | 'venmo' | 'paypal' | 'cashapp' | 'stripe' | 'manual';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending';

export interface Account {
  account_id: string;
  user_id: string;
  platform: PlatformType;
  account_name: string;
  account_type: string | null;
  account_mask: string | null;
  institution_name: string | null;
  institution_id: string | null;
  plaid_access_token: string | null;
  plaid_item_id: string | null;
  plaid_account_id: string | null;
  stripe_account_id: string | null;
  connection_status: ConnectionStatus;
  connection_error_code: string | null;
  connection_error_message: string | null;
  last_synced_at: Date | null;
  sync_cursor: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface AccountCreateInput {
  user_id: string;
  platform: PlatformType;
  account_name: string;
  account_type?: string;
  account_mask?: string;
  institution_name?: string;
  institution_id?: string;
  plaid_access_token?: string;
  plaid_item_id?: string;
  plaid_account_id?: string;
  stripe_account_id?: string;
}

// =============================================================================
// EXPENSE CATEGORY TYPES
// =============================================================================

export interface ExpenseCategoryDB {
  category_id: string;
  category_name: string;
  category_code: string;
  irs_line_number: string | null;
  deduction_rate: number;
  description: string | null;
  keywords: string[];
  mcc_codes: string[];
  sort_order: number;
  is_active: boolean;
  created_at: Date;
}

// IRS Schedule C Categories (for validation)
export const EXPENSE_CATEGORIES = [
  'Car and truck expenses',
  'Commissions and fees',
  'Contract labor',
  'Depreciation and section 179',
  'Insurance',
  'Interest - Mortgage',
  'Interest - Other',
  'Legal and professional services',
  'Office expense',
  'Rent - Equipment',
  'Rent - Business property',
  'Repairs and maintenance',
  'Supplies',
  'Taxes and licenses',
  'Travel',
  'Meals (50% deductible)',
  'Utilities',
  'Advertising',
  'Bank and payment processing fees',
  'Education and training',
  'Software and subscriptions',
  'Professional memberships',
  'Other business expenses',
  'Personal (not deductible)',
  'Mileage (standard rate)',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

export const EXPENSE_CATEGORY_CODES = [
  'car_truck',
  'commissions_fees',
  'contract_labor',
  'depreciation',
  'insurance',
  'interest_mortgage',
  'interest_other',
  'legal_professional',
  'office_expense',
  'rent_equipment',
  'rent_property',
  'repairs',
  'supplies',
  'taxes_licenses',
  'travel',
  'meals',
  'utilities',
  'advertising',
  'bank_fees',
  'education',
  'software',
  'memberships',
  'other',
  'personal',
  'mileage',
] as const;

export type ExpenseCategoryCode = typeof EXPENSE_CATEGORY_CODES[number];

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund' | 'unknown';
export type CategorizationSource = 'auto' | 'user' | 'rule' | 'ai';

export interface Transaction {
  transaction_id: string;
  user_id: string;
  account_id: string;
  external_transaction_id: string;
  plaid_transaction_id: string | null;
  transaction_date: Date;
  posted_date: Date | null;
  amount: number;
  iso_currency_code: string;
  description: string | null;
  original_description: string | null;
  merchant_name: string | null;
  merchant_category: string | null;
  mcc_code: string | null;
  transaction_type: TransactionType;
  category_id: string | null;
  is_business: boolean | null;
  business_percentage: number;
  categorization_source: CategorizationSource;
  categorization_confidence: number | null;
  reviewed_by_user: boolean;
  review_required: boolean;
  is_duplicate: boolean;
  is_excluded: boolean;
  exclude_reason: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TransactionCreateInput {
  user_id: string;
  account_id: string;
  external_transaction_id: string;
  plaid_transaction_id?: string;
  transaction_date: Date;
  posted_date?: Date;
  amount: number;
  iso_currency_code?: string;
  description?: string;
  original_description?: string;
  merchant_name?: string;
  merchant_category?: string;
  mcc_code?: string;
  transaction_type: TransactionType;
  category_id?: string;
  is_business?: boolean;
  business_percentage?: number;
}

export interface TransactionUpdateInput {
  category_id?: string;
  is_business?: boolean;
  business_percentage?: number;
  reviewed_by_user?: boolean;
  is_excluded?: boolean;
  exclude_reason?: string;
  notes?: string;
}

// =============================================================================
// MANUAL EXPENSE TYPES
// =============================================================================

export interface ManualExpense {
  manual_expense_id: string;
  user_id: string;
  expense_date: Date;
  merchant: string;
  amount: number;
  category_id: string | null;
  category_name: string;
  is_business: boolean;
  business_percentage: number;
  notes: string | null;
  payment_method: string | null;
  receipt_photo_url: string | null;
  receipt_thumbnail_url: string | null;
  ocr_raw_text: string | null;
  ocr_confidence: number | null;
  ocr_extracted_data: Record<string, unknown> | null;
  is_mileage: boolean;
  miles: number | null;
  mileage_rate: number | null;
  start_location: string | null;
  end_location: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ManualExpenseCreateInput {
  expense_date: Date;
  merchant: string;
  amount: number;
  category_id?: string;
  category_name: string;
  is_business?: boolean;
  business_percentage?: number;
  notes?: string;
  payment_method?: string;
  receipt_photo_url?: string;
  ocr_confidence?: number;
  is_mileage?: boolean;
  miles?: number;
  mileage_rate?: number;
  start_location?: string;
  end_location?: string;
}

export interface ManualExpenseUpdateInput {
  expense_date?: Date;
  merchant?: string;
  amount?: number;
  category_id?: string;
  category_name?: string;
  is_business?: boolean;
  business_percentage?: number;
  notes?: string;
  payment_method?: string;
  receipt_photo_url?: string;
}

// =============================================================================
// CATEGORY RULE TYPES
// =============================================================================

export type RuleType = 'keyword' | 'merchant' | 'mcc' | 'amount_range' | 'combined';

export interface CategoryRule {
  rule_id: string;
  user_id: string;
  rule_type: RuleType;
  rule_name: string | null;
  keyword_pattern: string | null;
  merchant_pattern: string | null;
  mcc_codes: string[] | null;
  amount_min: number | null;
  amount_max: number | null;
  category_id: string | null;
  is_business: boolean | null;
  transaction_type: TransactionType | null;
  match_count: number;
  is_active: boolean;
  priority: number;
  is_system_rule: boolean;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// TAX ESTIMATE TYPES
// =============================================================================

export interface TaxEstimate {
  tax_estimate_id: string;
  user_id: string;
  tax_year: number;
  quarter: number;
  period_start_date: Date;
  period_end_date: Date;
  total_income: number;
  income_by_platform: Record<string, number>;
  total_deductions: number;
  deductions_by_category: Record<string, number>;
  net_profit: number;
  se_taxable_income: number;
  self_employment_tax: number;
  se_tax_deduction: number;
  taxable_income: number;
  income_tax: number;
  effective_tax_rate: number | null;
  w2_withholding_applied: number;
  total_tax_owed: number;
  quarterly_payment_amount: number;
  calculation_status: 'current' | 'stale' | 'manual_override';
  calculated_at: Date;
}

export interface TaxEstimateCalculation {
  total_income: number;
  total_deductions: number;
  net_profit: number;
  self_employment_tax: number;
  income_tax: number;
  total_tax_owed: number;
  quarterly_payment: number;
}

// =============================================================================
// INCOME THRESHOLD TYPES
// =============================================================================

export interface IncomeThreshold {
  threshold_id: string;
  user_id: string;
  tax_year: number;
  total_1099_income: number;
  total_platform_income: Record<string, number>;
  threshold_5000_reached: boolean;
  threshold_5000_reached_at: Date | null;
  threshold_4000_alert_sent: boolean;
  threshold_4000_alert_sent_at: Date | null;
  threshold_5000_alert_sent: boolean;
  threshold_5000_alert_sent_at: Date | null;
  last_calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}

// =============================================================================
// NOTIFICATION TYPES
// =============================================================================

export type NotificationType =
  | 'threshold_alert'
  | 'deadline_reminder'
  | 'review_needed'
  | 'connection_error'
  | 'weekly_digest'
  | 'system_announcement'
  | 'tax_tip';

export type ActionType = 'navigate' | 'external_link' | 'dismiss';

export interface Notification {
  notification_id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_type: ActionType | null;
  action_url: string | null;
  action_data: Record<string, unknown> | null;
  delivery_channel: string[];
  push_sent: boolean;
  push_sent_at: Date | null;
  email_sent: boolean;
  email_sent_at: Date | null;
  is_read: boolean;
  read_at: Date | null;
  is_dismissed: boolean;
  dismissed_at: Date | null;
  scheduled_for: Date | null;
  expires_at: Date | null;
  created_at: Date;
}

export interface NotificationCreateInput {
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_type?: ActionType;
  action_url?: string;
  action_data?: Record<string, unknown>;
  delivery_channel?: string[];
  scheduled_for?: Date;
  expires_at?: Date;
}

// =============================================================================
// TAX DEADLINE TYPES
// =============================================================================

export interface TaxDeadline {
  deadline_id: string;
  tax_year: number;
  quarter: number;
  period_start_date: Date;
  period_end_date: Date;
  due_date: Date;
  original_due_date: Date | null;
  holiday_adjusted: boolean;
}

// =============================================================================
// USER SESSION TYPES
// =============================================================================

export interface UserSession {
  session_id: string;
  user_id: string;
  refresh_token_hash: string | null;
  device_info: Record<string, unknown> | null;
  ip_address: string | null;
  is_active: boolean;
  revoked_at: Date | null;
  revoke_reason: string | null;
  last_activity_at: Date;
  expires_at: Date;
  created_at: Date;
}

export interface UserSessionCreateInput {
  user_id: string;
  refresh_token_hash?: string;
  device_info?: Record<string, unknown>;
  ip_address?: string;
  expires_at: Date;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

// =============================================================================
// DASHBOARD TYPES
// =============================================================================

export interface DashboardSummary {
  totalIncomeYTD: number;
  incomeByPlatform: Record<string, number>;
  totalDeductionsYTD: number;
  deductionsByCategory: Record<string, number>;
  netProfitYTD: number;
  estimatedQuarterlyTax: number;
  estimatedYearlyTax: number;
  currentQuarter: number;
  nextDeadline: TaxDeadline | null;
  daysUntilDeadline: number | null;
  transactionsNeedingReview: number;
  connectedAccounts: number;
}

export interface DashboardFilters {
  dateRange: 'last_30_days' | 'last_90_days' | 'ytd' | 'custom';
  startDate?: Date;
  endDate?: Date;
  platform?: string;
}

// =============================================================================
// PLAID TYPES
// =============================================================================

export interface PlaidLinkToken {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface PlaidPublicTokenExchange {
  public_token: string;
  account_id?: string;
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  date: string;
  authorized_date: string | null;
  name: string;
  merchant_name: string | null;
  payment_channel: string;
  pending: boolean;
  personal_finance_category: {
    primary: string;
    detailed: string;
  } | null;
}

// =============================================================================
// CONSTANTS
// =============================================================================

// IRS 2026 Mileage Rate (placeholder - update when IRS announces)
export const IRS_MILEAGE_RATE_2026 = 0.67; // $ per mile

// Self-Employment Tax Constants
export const SE_TAX_RATE = 0.153; // 15.3%
export const SE_INCOME_MULTIPLIER = 0.9235; // 92.35% of net SE income

// Income Thresholds
export const IRS_REPORTING_THRESHOLD = 5000;
export const IRS_WARNING_THRESHOLD = 4000;

// Default Tax Rates
export const DEFAULT_MARGINAL_TAX_RATE = 22;
export const FEDERAL_TAX_BRACKETS_2026 = [
  { min: 0, max: 11600, rate: 10 },
  { min: 11600, max: 47150, rate: 12 },
  { min: 47150, max: 100525, rate: 22 },
  { min: 100525, max: 191950, rate: 24 },
  { min: 191950, max: 243725, rate: 32 },
  { min: 243725, max: 609350, rate: 35 },
  { min: 609350, max: Infinity, rate: 37 },
];
