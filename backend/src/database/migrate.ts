import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

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
 * Database migrations for Side Hustle Tax & Income Tracker
 * Run with: npm run migrate
 *
 * Supports two modes:
 * 1. Inline migrations (defined in this file) - for backward compatibility
 * 2. SQL file migrations (in ./migrations folder) - for complex schemas
 */

// Inline migrations for backward compatibility and quick updates
const inlineMigrations = [
  // Migration 001: Create users table (basic)
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        full_name VARCHAR(255) NOT NULL,
        tax_filing_status VARCHAR(50) DEFAULT 'single'
          CHECK (tax_filing_status IN ('single', 'married_joint', 'married_separate', 'head_of_household')),
        marginal_tax_rate DECIMAL(5,2) DEFAULT 22.00,
        w2_withholding_annual DECIMAL(12,2) DEFAULT 0.00,
        google_id VARCHAR(255) UNIQUE,
        primary_platform VARCHAR(50),
        onboarding_completed BOOLEAN DEFAULT FALSE,
        onboarding_step INTEGER DEFAULT 0,
        notification_preferences JSONB DEFAULT '{
          "push_enabled": true,
          "email_enabled": true,
          "threshold_alerts": true,
          "deadline_reminders": true,
          "weekly_digest": true,
          "transaction_review": true,
          "quiet_hours_start": null,
          "quiet_hours_end": null
        }'::jsonb,
        email_verified_at TIMESTAMP,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
    `,
    down: `DROP TABLE IF EXISTS users CASCADE;`,
  },

  // Migration 002: Create expense_categories table
  {
    name: '002_create_expense_categories_table',
    up: `
      CREATE TABLE IF NOT EXISTS expense_categories (
        category_id UUID PRIMARY KEY,
        category_name VARCHAR(100) NOT NULL UNIQUE,
        category_code VARCHAR(20) NOT NULL UNIQUE,
        irs_line_number VARCHAR(10),
        deduction_rate DECIMAL(3,2) DEFAULT 1.00,
        description TEXT,
        keywords TEXT[],
        mcc_codes VARCHAR(10)[],
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_expense_categories_code ON expense_categories(category_code);
    `,
    down: `DROP TABLE IF EXISTS expense_categories CASCADE;`,
  },

  // Migration 003: Create accounts table (for Plaid connections)
  {
    name: '003_create_accounts_table',
    up: `
      CREATE TABLE IF NOT EXISTS accounts (
        account_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL
          CHECK (platform IN ('plaid_bank', 'venmo', 'paypal', 'cashapp', 'stripe', 'manual')),
        account_name VARCHAR(255) NOT NULL,
        account_type VARCHAR(50),
        account_mask VARCHAR(10),
        institution_name VARCHAR(255),
        institution_id VARCHAR(100),
        plaid_access_token TEXT,
        plaid_item_id VARCHAR(255),
        plaid_account_id VARCHAR(255),
        stripe_account_id VARCHAR(255),
        connection_status VARCHAR(50) DEFAULT 'connected'
          CHECK (connection_status IN ('connected', 'disconnected', 'error', 'pending')),
        connection_error_code VARCHAR(100),
        connection_error_message TEXT,
        last_synced_at TIMESTAMP,
        sync_cursor VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_plaid_item_id ON accounts(plaid_item_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_plaid_account_id ON accounts(plaid_account_id);
      CREATE INDEX IF NOT EXISTS idx_accounts_stripe_account_id ON accounts(stripe_account_id);
    `,
    down: `DROP TABLE IF EXISTS accounts CASCADE;`,
  },

  // Migration 004: Create transactions table
  {
    name: '004_create_transactions_table',
    up: `
      CREATE TABLE IF NOT EXISTS transactions (
        transaction_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
        external_transaction_id VARCHAR(255) NOT NULL,
        plaid_transaction_id VARCHAR(255),
        transaction_date DATE NOT NULL,
        posted_date DATE,
        amount DECIMAL(12,2) NOT NULL,
        iso_currency_code VARCHAR(3) DEFAULT 'USD',
        description TEXT,
        original_description TEXT,
        merchant_name VARCHAR(255),
        merchant_category VARCHAR(255),
        mcc_code VARCHAR(10),
        transaction_type VARCHAR(50) NOT NULL
          CHECK (transaction_type IN ('income', 'expense', 'transfer', 'refund', 'unknown')),
        category_id UUID REFERENCES expense_categories(category_id),
        is_business BOOLEAN,
        business_percentage DECIMAL(5,2) DEFAULT 100.00,
        categorization_source VARCHAR(50) DEFAULT 'auto'
          CHECK (categorization_source IN ('auto', 'user', 'rule', 'ai')),
        categorization_confidence DECIMAL(3,2),
        reviewed_by_user BOOLEAN DEFAULT FALSE,
        review_required BOOLEAN DEFAULT FALSE,
        is_duplicate BOOLEAN DEFAULT FALSE,
        is_excluded BOOLEAN DEFAULT FALSE,
        exclude_reason VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT unique_external_transaction UNIQUE (account_id, external_transaction_id)
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_plaid_id ON transactions(plaid_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
      CREATE INDEX IF NOT EXISTS idx_transactions_is_business ON transactions(is_business);
      CREATE INDEX IF NOT EXISTS idx_transactions_review ON transactions(user_id, review_required) WHERE review_required = TRUE;
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
    `,
    down: `DROP TABLE IF EXISTS transactions CASCADE;`,
  },

  // Migration 005: Create manual_expenses table
  {
    name: '005_create_manual_expenses_table',
    up: `
      CREATE TABLE IF NOT EXISTS manual_expenses (
        manual_expense_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        expense_date DATE NOT NULL,
        merchant VARCHAR(255) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        category_id UUID REFERENCES expense_categories(category_id),
        category_name VARCHAR(100) NOT NULL,
        is_business BOOLEAN DEFAULT TRUE,
        business_percentage DECIMAL(5,2) DEFAULT 100.00,
        notes TEXT,
        payment_method VARCHAR(50),
        receipt_photo_url VARCHAR(500),
        receipt_thumbnail_url VARCHAR(500),
        ocr_raw_text TEXT,
        ocr_confidence DECIMAL(3,2),
        ocr_extracted_data JSONB,
        is_mileage BOOLEAN DEFAULT FALSE,
        miles DECIMAL(10,2),
        mileage_rate DECIMAL(4,2),
        start_location VARCHAR(255),
        end_location VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_manual_expenses_user_id ON manual_expenses(user_id);
      CREATE INDEX IF NOT EXISTS idx_manual_expenses_date ON manual_expenses(expense_date);
      CREATE INDEX IF NOT EXISTS idx_manual_expenses_category ON manual_expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_manual_expenses_user_date ON manual_expenses(user_id, expense_date DESC);
    `,
    down: `DROP TABLE IF EXISTS manual_expenses CASCADE;`,
  },

  // Migration 006: Create category_rules table
  {
    name: '006_create_category_rules_table',
    up: `
      CREATE TABLE IF NOT EXISTS category_rules (
        rule_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        rule_type VARCHAR(50) NOT NULL
          CHECK (rule_type IN ('keyword', 'merchant', 'mcc', 'amount_range', 'combined')),
        rule_name VARCHAR(255),
        keyword_pattern VARCHAR(255),
        merchant_pattern VARCHAR(255),
        mcc_codes VARCHAR(10)[],
        amount_min DECIMAL(12,2),
        amount_max DECIMAL(12,2),
        category_id UUID REFERENCES expense_categories(category_id),
        is_business BOOLEAN,
        transaction_type VARCHAR(50),
        match_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 0,
        is_system_rule BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_category_rules_user_id ON category_rules(user_id);
      CREATE INDEX IF NOT EXISTS idx_category_rules_active ON category_rules(user_id, is_active) WHERE is_active = TRUE;
    `,
    down: `DROP TABLE IF EXISTS category_rules CASCADE;`,
  },

  // Migration 007: Create tax_estimates table
  {
    name: '007_create_tax_estimates_table',
    up: `
      CREATE TABLE IF NOT EXISTS tax_estimates (
        tax_estimate_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        tax_year INTEGER NOT NULL,
        quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
        income_by_platform JSONB DEFAULT '{}'::jsonb,
        total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
        deductions_by_category JSONB DEFAULT '{}'::jsonb,
        net_profit DECIMAL(12,2) NOT NULL DEFAULT 0,
        se_taxable_income DECIMAL(12,2) NOT NULL DEFAULT 0,
        self_employment_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
        se_tax_deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
        taxable_income DECIMAL(12,2) NOT NULL DEFAULT 0,
        income_tax DECIMAL(12,2) NOT NULL DEFAULT 0,
        effective_tax_rate DECIMAL(5,2),
        w2_withholding_applied DECIMAL(12,2) DEFAULT 0,
        total_tax_owed DECIMAL(12,2) NOT NULL DEFAULT 0,
        quarterly_payment_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        calculation_status VARCHAR(50) DEFAULT 'current'
          CHECK (calculation_status IN ('current', 'stale', 'manual_override')),
        calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT unique_user_quarter UNIQUE (user_id, tax_year, quarter)
      );

      CREATE INDEX IF NOT EXISTS idx_tax_estimates_user_year_quarter
        ON tax_estimates(user_id, tax_year, quarter);
    `,
    down: `DROP TABLE IF EXISTS tax_estimates CASCADE;`,
  },

  // Migration 008: Create income_thresholds table
  {
    name: '008_create_income_thresholds_table',
    up: `
      CREATE TABLE IF NOT EXISTS income_thresholds (
        threshold_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        tax_year INTEGER NOT NULL,
        total_1099_income DECIMAL(12,2) DEFAULT 0,
        total_platform_income JSONB DEFAULT '{}'::jsonb,
        threshold_5000_reached BOOLEAN DEFAULT FALSE,
        threshold_5000_reached_at TIMESTAMP,
        threshold_4000_alert_sent BOOLEAN DEFAULT FALSE,
        threshold_4000_alert_sent_at TIMESTAMP,
        threshold_5000_alert_sent BOOLEAN DEFAULT FALSE,
        threshold_5000_alert_sent_at TIMESTAMP,
        last_calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT unique_user_threshold_year UNIQUE (user_id, tax_year)
      );

      CREATE INDEX IF NOT EXISTS idx_income_thresholds_user_year ON income_thresholds(user_id, tax_year);
    `,
    down: `DROP TABLE IF EXISTS income_thresholds CASCADE;`,
  },

  // Migration 009: Create notifications table
  {
    name: '009_create_notifications_table',
    up: `
      CREATE TABLE IF NOT EXISTS notifications (
        notification_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        notification_type VARCHAR(50) NOT NULL
          CHECK (notification_type IN (
            'threshold_alert',
            'deadline_reminder',
            'review_needed',
            'connection_error',
            'weekly_digest',
            'system_announcement',
            'tax_tip'
          )),
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        action_type VARCHAR(50),
        action_url VARCHAR(500),
        action_data JSONB,
        delivery_channel VARCHAR(50)[] DEFAULT ARRAY['in_app'],
        push_sent BOOLEAN DEFAULT FALSE,
        push_sent_at TIMESTAMP,
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        is_dismissed BOOLEAN DEFAULT FALSE,
        dismissed_at TIMESTAMP,
        scheduled_for TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
      CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
    `,
    down: `DROP TABLE IF EXISTS notifications CASCADE;`,
  },

  // Migration 010: Create tax_deadlines table
  {
    name: '010_create_tax_deadlines_table',
    up: `
      CREATE TABLE IF NOT EXISTS tax_deadlines (
        deadline_id UUID PRIMARY KEY,
        tax_year INTEGER NOT NULL,
        quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
        period_start_date DATE NOT NULL,
        period_end_date DATE NOT NULL,
        due_date DATE NOT NULL,
        original_due_date DATE,
        holiday_adjusted BOOLEAN DEFAULT FALSE,

        CONSTRAINT unique_deadline_year_quarter UNIQUE (tax_year, quarter)
      );

      CREATE INDEX IF NOT EXISTS idx_tax_deadlines_year ON tax_deadlines(tax_year);
    `,
    down: `DROP TABLE IF EXISTS tax_deadlines CASCADE;`,
  },

  // Migration 011: Create user_sessions table
  {
    name: '011_create_user_sessions_table',
    up: `
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        refresh_token_hash VARCHAR(255),
        device_info JSONB,
        ip_address VARCHAR(45),
        is_active BOOLEAN DEFAULT TRUE,
        revoked_at TIMESTAMP,
        revoke_reason VARCHAR(255),
        last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = TRUE;
    `,
    down: `DROP TABLE IF EXISTS user_sessions CASCADE;`,
  },

  // Migration 012: Create estimated_payments table
  {
    name: '012_create_estimated_payments_table',
    up: `
      CREATE TABLE IF NOT EXISTS estimated_payments (
        payment_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        tax_year INTEGER NOT NULL,
        quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
        payment_date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        confirmation_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_estimated_payments_user_id ON estimated_payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_estimated_payments_user_year ON estimated_payments(user_id, tax_year);
      CREATE INDEX IF NOT EXISTS idx_estimated_payments_quarter ON estimated_payments(user_id, tax_year, quarter);
    `,
    down: `DROP TABLE IF EXISTS estimated_payments CASCADE;`,
  },

  // Migration 013: Create generated_reports table (Sprint 4)
  {
    name: '013_create_generated_reports_table',
    up: `
      CREATE TABLE IF NOT EXISTS generated_reports (
        report_id UUID PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        report_type VARCHAR(50) NOT NULL
          CHECK (report_type IN ('quarterly', 'annual', 'custom')),
        tax_year INTEGER NOT NULL,
        quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        file_size_bytes INTEGER,
        download_count INTEGER DEFAULT 0,
        last_downloaded_at TIMESTAMP,
        email_sent_to VARCHAR(255),
        email_sent_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_generated_reports_user_id ON generated_reports(user_id);
      CREATE INDEX IF NOT EXISTS idx_generated_reports_user_year ON generated_reports(user_id, tax_year);
    `,
    down: `DROP TABLE IF EXISTS generated_reports CASCADE;`,
  },

  // Migration 014: Create email_logs table (Sprint 4)
  {
    name: '014_create_email_logs_table',
    up: `
      CREATE TABLE IF NOT EXISTS email_logs (
        email_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        email_type VARCHAR(50) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        subject VARCHAR(500),
        sent_at TIMESTAMP NOT NULL DEFAULT NOW(),
        success BOOLEAN NOT NULL DEFAULT TRUE,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_logs_type ON email_logs(email_type);
    `,
    down: `DROP TABLE IF EXISTS email_logs CASCADE;`,
  },

  // Migration 015: Create updated_at triggers
  {
    name: '015_create_updated_at_triggers',
    up: `
      -- Function to update updated_at timestamp automatically
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Apply updated_at triggers to relevant tables
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
      CREATE TRIGGER update_accounts_updated_at
        BEFORE UPDATE ON accounts
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
      CREATE TRIGGER update_transactions_updated_at
        BEFORE UPDATE ON transactions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_manual_expenses_updated_at ON manual_expenses;
      CREATE TRIGGER update_manual_expenses_updated_at
        BEFORE UPDATE ON manual_expenses
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_category_rules_updated_at ON category_rules;
      CREATE TRIGGER update_category_rules_updated_at
        BEFORE UPDATE ON category_rules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_income_thresholds_updated_at ON income_thresholds;
      CREATE TRIGGER update_income_thresholds_updated_at
        BEFORE UPDATE ON income_thresholds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `,
    down: `
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
      DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
      DROP TRIGGER IF EXISTS update_manual_expenses_updated_at ON manual_expenses;
      DROP TRIGGER IF EXISTS update_category_rules_updated_at ON category_rules;
      DROP TRIGGER IF EXISTS update_income_thresholds_updated_at ON income_thresholds;
      DROP FUNCTION IF EXISTS update_updated_at_column();
    `,
  },
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('Starting database migrations...\n');

    // First, create the migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Get list of executed migrations
    const result = await client.query('SELECT name FROM migrations');
    const executedMigrations = new Set(result.rows.map(row => row.name));

    // Run pending inline migrations
    let migrationsRun = 0;

    for (const migration of inlineMigrations) {
      if (executedMigrations.has(migration.name)) {
        console.log(`[SKIP] ${migration.name} (already executed)`);
        continue;
      }

      console.log(`[RUN] ${migration.name}...`);

      await client.query('BEGIN');

      try {
        await client.query(migration.up);
        await client.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
        await client.query('COMMIT');
        console.log(`[OK] ${migration.name}`);
        migrationsRun++;
      } catch (error) {
        await client.query('ROLLBACK');
        console.error(`[FAIL] ${migration.name}:`, error);
        throw error;
      }
    }

    // Run SQL file migrations if they exist
    const migrationsDir = path.join(__dirname, 'migrations');

    if (fs.existsSync(migrationsDir)) {
      const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        if (executedMigrations.has(file)) {
          console.log(`[SKIP] ${file} (already executed)`);
          continue;
        }

        console.log(`[RUN] ${file}...`);

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        await client.query('BEGIN');

        try {
          await client.query(sql);
          await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`[OK] ${file}`);
          migrationsRun++;
        } catch (error) {
          await client.query('ROLLBACK');
          console.error(`[FAIL] ${file}:`, error);
          throw error;
        }
      }
    }

    console.log(`\nMigrations complete. ${migrationsRun} migration(s) executed.`);

    // Run seed files if they exist
    const seedsDir = path.join(__dirname, 'seeds');

    if (fs.existsSync(seedsDir)) {
      const seedFiles = fs.readdirSync(seedsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      if (seedFiles.length > 0) {
        console.log(`\nRunning seed files...`);

        for (const file of seedFiles) {
          const seedName = `seed_${file}`;

          if (executedMigrations.has(seedName)) {
            console.log(`[SKIP] ${file} (already seeded)`);
            continue;
          }

          console.log(`[SEED] ${file}...`);

          const filePath = path.join(seedsDir, file);
          const sql = fs.readFileSync(filePath, 'utf-8');

          await client.query('BEGIN');

          try {
            await client.query(sql);
            await client.query('INSERT INTO migrations (name) VALUES ($1)', [seedName]);
            await client.query('COMMIT');
            console.log(`[OK] ${file}`);
          } catch (error) {
            await client.query('ROLLBACK');
            console.error(`[FAIL] ${file}:`, error);
            // Seeds are optional, continue with other seeds
            console.log(`[WARN] Seed ${file} failed but continuing...`);
          }
        }
      }
    }

    console.log('\nAll migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
