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
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface User {
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
  created_at: string;
}

// =============================================================================
// AUTH TYPES
// =============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  full_name: string;
}

// =============================================================================
// ACCOUNT TYPES
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
  connection_status: ConnectionStatus;
  last_synced_at: string | null;
  created_at: string;
}

// =============================================================================
// EXPENSE CATEGORY TYPES
// =============================================================================

export interface ExpenseCategory {
  category_id: string;
  category_name: string;
  category_code: string;
  irs_line_number: string | null;
  deduction_rate: number;
  description: string | null;
}

// =============================================================================
// TRANSACTION TYPES
// =============================================================================

export type TransactionType = 'income' | 'expense' | 'transfer' | 'refund' | 'unknown';
export type CategorizationSource = 'auto' | 'user' | 'rule' | 'ai';

export interface Transaction {
  transaction_id: string;
  user_id: string;
  account_id: string;
  transaction_date: string;
  amount: number;
  iso_currency_code: string;
  description: string | null;
  merchant_name: string | null;
  transaction_type: TransactionType;
  category_id: string | null;
  category_name?: string;
  is_business: boolean | null;
  business_percentage: number;
  categorization_source: CategorizationSource;
  reviewed_by_user: boolean;
  review_required: boolean;
  is_excluded: boolean;
  notes: string | null;
  created_at: string;
}

export interface TransactionFilters {
  page?: number;
  limit?: number;
  account_id?: string;
  transaction_type?: TransactionType;
  category_id?: string;
  is_business?: boolean;
  review_required?: boolean;
  start_date?: string;
  end_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

// =============================================================================
// MANUAL EXPENSE TYPES
// =============================================================================

export interface ManualExpense {
  manual_expense_id: string;
  user_id: string;
  expense_date: string;
  merchant: string;
  amount: number;
  category_id: string | null;
  category_name: string;
  is_business: boolean;
  business_percentage: number;
  notes: string | null;
  payment_method: string | null;
  is_mileage: boolean;
  miles: number | null;
  mileage_rate: number | null;
  start_location: string | null;
  end_location: string | null;
  created_at: string;
}

export interface CreateExpenseInput {
  expense_date: string;
  merchant: string;
  amount: number;
  category_name: string;
  category_id?: string;
  is_business?: boolean;
  business_percentage?: number;
  notes?: string;
  payment_method?: string;
}

export interface CreateMileageInput {
  expense_date: string;
  miles: number;
  start_location?: string;
  end_location?: string;
  notes?: string;
}

// =============================================================================
// TAX TYPES
// =============================================================================

export interface TaxEstimate {
  tax_estimate_id: string;
  user_id: string;
  tax_year: number;
  quarter: number;
  period_start_date: string;
  period_end_date: string;
  total_income: number;
  income_by_platform: Record<string, number>;
  total_deductions: number;
  deductions_by_category: Record<string, number>;
  net_profit: number;
  self_employment_tax: number;
  income_tax: number;
  total_tax_owed: number;
  quarterly_payment_amount: number;
  calculated_at: string;
}

export interface TaxSummary {
  currentQuarter: number;
  taxYear: number;
  ytd: {
    totalIncome: number;
    totalDeductions: number;
    netProfit: number;
    selfEmploymentTax: number;
    incomeTax: number;
    totalTaxOwed: number;
  };
  quarterly: {
    quarter: number;
    estimatedPayment: number;
    dueDate: string;
    isPaid: boolean;
  }[];
  thresholdStatus: {
    total1099Income: number;
    thresholdReached: boolean;
    percentToThreshold: number;
  };
  nextDeadline: TaxDeadline | null;
  daysUntilDeadline: number | null;
  // Dashboard-specific data
  transactionsNeedingReview?: number;
  connectedAccounts?: number;
}

export interface TaxDeadline {
  deadline_id: string;
  tax_year: number;
  quarter: number;
  period_start_date: string;
  period_end_date: string;
  due_date: string;
}

export interface TaxPayment {
  payment_id: string;
  user_id: string;
  tax_year: number;
  quarter: number;
  amount: number;
  payment_date: string;
  payment_method: string;
  confirmation_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface IncomeThreshold {
  threshold_id: string;
  user_id: string;
  tax_year: number;
  total_1099_income: number;
  total_platform_income: Record<string, number>;
  threshold_5000_reached: boolean;
  threshold_5000_reached_at: string | null;
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

export interface Notification {
  notification_id: string;
  user_id: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

// =============================================================================
// REPORT TYPES
// =============================================================================

export interface Report {
  report_id: string;
  user_id: string;
  tax_year: number;
  quarter: number | null;
  report_type: 'quarterly' | 'annual';
  file_url: string | null;
  created_at: string;
}

export interface ReportPreview {
  taxYear: number;
  quarter: number | null;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalIncome: number;
    totalDeductions: number;
    netProfit: number;
    estimatedTax: number;
  };
  incomeByPlatform: Record<string, number>;
  expensesByCategory: Record<string, number>;
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

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
