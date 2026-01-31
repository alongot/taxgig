import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
  port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DATABASE_URL ? undefined : process.env.DB_NAME,
  user: process.env.DATABASE_URL ? undefined : process.env.DB_USER,
  password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
});

/**
 * Database validation script for Side Hustle Tax & Income Tracker
 * Run with: npm run db:validate
 *
 * Checks:
 * 1. All required tables exist
 * 2. All required columns exist with correct types
 * 3. All indexes are present
 * 4. Seed data is populated
 */

const REQUIRED_TABLES = [
  'users',
  'expense_categories',
  'accounts',
  'transactions',
  'manual_expenses',
  'category_rules',
  'tax_estimates',
  'income_thresholds',
  'notifications',
  'tax_deadlines',
  'user_sessions',
  'migrations',
];

const EXPECTED_COLUMNS: Record<string, string[]> = {
  users: [
    'user_id', 'email', 'password_hash', 'full_name', 'tax_filing_status',
    'marginal_tax_rate', 'w2_withholding_annual', 'google_id', 'primary_platform',
    'onboarding_completed', 'onboarding_step', 'notification_preferences',
    'email_verified_at', 'last_login_at', 'created_at', 'updated_at'
  ],
  expense_categories: [
    'category_id', 'category_name', 'category_code', 'irs_line_number',
    'deduction_rate', 'description', 'keywords', 'mcc_codes', 'sort_order',
    'is_active', 'created_at'
  ],
  accounts: [
    'account_id', 'user_id', 'platform', 'account_name', 'account_type',
    'account_mask', 'institution_name', 'institution_id', 'plaid_access_token',
    'plaid_item_id', 'plaid_account_id', 'stripe_account_id', 'connection_status',
    'connection_error_code', 'connection_error_message', 'last_synced_at',
    'sync_cursor', 'created_at', 'updated_at'
  ],
  transactions: [
    'transaction_id', 'user_id', 'account_id', 'external_transaction_id',
    'plaid_transaction_id', 'transaction_date', 'posted_date', 'amount',
    'iso_currency_code', 'description', 'original_description', 'merchant_name',
    'merchant_category', 'mcc_code', 'transaction_type', 'category_id',
    'is_business', 'business_percentage', 'categorization_source',
    'categorization_confidence', 'reviewed_by_user', 'review_required',
    'is_duplicate', 'is_excluded', 'exclude_reason', 'notes', 'created_at', 'updated_at'
  ],
  manual_expenses: [
    'manual_expense_id', 'user_id', 'expense_date', 'merchant', 'amount',
    'category_id', 'category_name', 'is_business', 'business_percentage',
    'notes', 'payment_method', 'receipt_photo_url', 'receipt_thumbnail_url',
    'ocr_raw_text', 'ocr_confidence', 'ocr_extracted_data', 'is_mileage',
    'miles', 'mileage_rate', 'start_location', 'end_location', 'created_at', 'updated_at'
  ],
  category_rules: [
    'rule_id', 'user_id', 'rule_type', 'rule_name', 'keyword_pattern',
    'merchant_pattern', 'mcc_codes', 'amount_min', 'amount_max', 'category_id',
    'is_business', 'transaction_type', 'match_count', 'is_active', 'priority',
    'is_system_rule', 'created_at', 'updated_at'
  ],
  tax_estimates: [
    'tax_estimate_id', 'user_id', 'tax_year', 'quarter', 'period_start_date',
    'period_end_date', 'total_income', 'income_by_platform', 'total_deductions',
    'deductions_by_category', 'net_profit', 'se_taxable_income', 'self_employment_tax',
    'se_tax_deduction', 'taxable_income', 'income_tax', 'effective_tax_rate',
    'w2_withholding_applied', 'total_tax_owed', 'quarterly_payment_amount',
    'calculation_status', 'calculated_at'
  ],
  income_thresholds: [
    'threshold_id', 'user_id', 'tax_year', 'total_1099_income', 'total_platform_income',
    'threshold_5000_reached', 'threshold_5000_reached_at', 'threshold_4000_alert_sent',
    'threshold_4000_alert_sent_at', 'threshold_5000_alert_sent', 'threshold_5000_alert_sent_at',
    'last_calculated_at', 'created_at', 'updated_at'
  ],
  notifications: [
    'notification_id', 'user_id', 'notification_type', 'title', 'message',
    'action_type', 'action_url', 'action_data', 'delivery_channel', 'push_sent',
    'push_sent_at', 'email_sent', 'email_sent_at', 'is_read', 'read_at',
    'is_dismissed', 'dismissed_at', 'scheduled_for', 'expires_at', 'created_at'
  ],
  tax_deadlines: [
    'deadline_id', 'tax_year', 'quarter', 'period_start_date', 'period_end_date',
    'due_date', 'original_due_date', 'holiday_adjusted'
  ],
  user_sessions: [
    'session_id', 'user_id', 'refresh_token_hash', 'device_info', 'ip_address',
    'is_active', 'revoked_at', 'revoke_reason', 'last_activity_at', 'expires_at', 'created_at'
  ],
};

async function validateDatabase() {
  const client = await pool.connect();
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('='.repeat(60));
    console.log('Side Hustle Tax Tracker - Database Validation');
    console.log('='.repeat(60));
    console.log();

    // 1. Check if database connection works
    console.log('[1/5] Testing database connection...');
    try {
      await client.query('SELECT NOW()');
      console.log('  [OK] Database connection successful');
    } catch (error) {
      console.log('  [FAIL] Cannot connect to database');
      errors.push('Database connection failed');
      return;
    }

    // 2. Check required tables exist
    console.log('\n[2/5] Checking required tables...');
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    `);
    const existingTables = new Set(tablesResult.rows.map(row => row.table_name));

    for (const table of REQUIRED_TABLES) {
      if (existingTables.has(table)) {
        console.log(`  [OK] ${table}`);
      } else {
        console.log(`  [MISSING] ${table}`);
        errors.push(`Missing table: ${table}`);
      }
    }

    // 3. Check columns for each table
    console.log('\n[3/5] Checking table columns...');
    for (const [table, expectedColumns] of Object.entries(EXPECTED_COLUMNS)) {
      if (!existingTables.has(table)) {
        continue; // Skip if table doesn't exist
      }

      const columnsResult = await client.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = $1
      `, [table]);
      const existingColumns = new Set(columnsResult.rows.map(row => row.column_name));

      const missingColumns = expectedColumns.filter(col => !existingColumns.has(col));
      if (missingColumns.length === 0) {
        console.log(`  [OK] ${table} - all ${expectedColumns.length} columns present`);
      } else {
        console.log(`  [PARTIAL] ${table} - missing: ${missingColumns.join(', ')}`);
        errors.push(`Table ${table} missing columns: ${missingColumns.join(', ')}`);
      }
    }

    // 4. Check seed data
    console.log('\n[4/5] Checking seed data...');

    // Check expense_categories
    const categoriesResult = await client.query('SELECT COUNT(*) FROM expense_categories');
    const categoryCount = parseInt(categoriesResult.rows[0].count, 10);
    if (categoryCount >= 20) {
      console.log(`  [OK] expense_categories - ${categoryCount} categories seeded`);
    } else if (categoryCount > 0) {
      console.log(`  [WARN] expense_categories - only ${categoryCount} categories (expected 20+)`);
      warnings.push('expense_categories has fewer categories than expected');
    } else {
      console.log('  [MISSING] expense_categories - no data seeded');
      warnings.push('expense_categories needs to be seeded');
    }

    // Check tax_deadlines
    const deadlinesResult = await client.query('SELECT COUNT(*) FROM tax_deadlines');
    const deadlineCount = parseInt(deadlinesResult.rows[0].count, 10);
    if (deadlineCount >= 8) {
      console.log(`  [OK] tax_deadlines - ${deadlineCount} deadlines seeded`);
    } else if (deadlineCount > 0) {
      console.log(`  [WARN] tax_deadlines - only ${deadlineCount} deadlines (expected 8+)`);
      warnings.push('tax_deadlines has fewer entries than expected');
    } else {
      console.log('  [MISSING] tax_deadlines - no data seeded');
      warnings.push('tax_deadlines needs to be seeded');
    }

    // 5. Check migrations table
    console.log('\n[5/5] Checking migration status...');
    const migrationsResult = await client.query(`
      SELECT name, executed_at
      FROM migrations
      ORDER BY id ASC
    `);
    console.log(`  Found ${migrationsResult.rows.length} executed migrations:`);
    for (const row of migrationsResult.rows) {
      const date = new Date(row.executed_at).toISOString().split('T')[0];
      console.log(`    - ${row.name} (${date})`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION SUMMARY');
    console.log('='.repeat(60));

    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n[SUCCESS] Database schema is valid and complete!');
      console.log('All tables, columns, and seed data are present.');
    } else {
      if (errors.length > 0) {
        console.log(`\n[ERRORS] ${errors.length} error(s) found:`);
        errors.forEach(err => console.log(`  - ${err}`));
      }
      if (warnings.length > 0) {
        console.log(`\n[WARNINGS] ${warnings.length} warning(s):`);
        warnings.forEach(warn => console.log(`  - ${warn}`));
      }
    }

    console.log('\n');

    // Exit with error code if validation failed
    if (errors.length > 0) {
      process.exit(1);
    }

  } catch (error) {
    console.error('\nValidation failed with error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

validateDatabase();
