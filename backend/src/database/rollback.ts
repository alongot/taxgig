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
 * Rollback migrations for Side Hustle Tax & Income Tracker
 * Run with: npm run migrate:rollback
 * Run with: npm run migrate:rollback -- --all (to rollback all migrations)
 *
 * Migration list must match migrate.ts exactly
 */
const migrations = [
  {
    name: '001_create_users_table',
    down: `DROP TABLE IF EXISTS users CASCADE;`,
  },
  {
    name: '002_create_expense_categories_table',
    down: `DROP TABLE IF EXISTS expense_categories CASCADE;`,
  },
  {
    name: '003_create_accounts_table',
    down: `DROP TABLE IF EXISTS accounts CASCADE;`,
  },
  {
    name: '004_create_transactions_table',
    down: `DROP TABLE IF EXISTS transactions CASCADE;`,
  },
  {
    name: '005_create_manual_expenses_table',
    down: `DROP TABLE IF EXISTS manual_expenses CASCADE;`,
  },
  {
    name: '006_create_category_rules_table',
    down: `DROP TABLE IF EXISTS category_rules CASCADE;`,
  },
  {
    name: '007_create_tax_estimates_table',
    down: `DROP TABLE IF EXISTS tax_estimates CASCADE;`,
  },
  {
    name: '008_create_income_thresholds_table',
    down: `DROP TABLE IF EXISTS income_thresholds CASCADE;`,
  },
  {
    name: '009_create_notifications_table',
    down: `DROP TABLE IF EXISTS notifications CASCADE;`,
  },
  {
    name: '010_create_tax_deadlines_table',
    down: `DROP TABLE IF EXISTS tax_deadlines CASCADE;`,
  },
  {
    name: '011_create_user_sessions_table',
    down: `DROP TABLE IF EXISTS user_sessions CASCADE;`,
  },
  {
    name: '012_create_updated_at_triggers',
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

async function rollbackLastMigration() {
  const client = await pool.connect();

  try {
    console.log('Rolling back last migration...\n');

    // Check if migrations table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'migrations'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('No migrations table found. Nothing to rollback.');
      return;
    }

    // Get last executed migration
    const result = await client.query(`
      SELECT name FROM migrations
      ORDER BY id DESC
      LIMIT 1
    `);

    if (result.rows.length === 0) {
      console.log('No migrations to rollback.');
      return;
    }

    const lastMigration = result.rows[0].name;
    const migration = migrations.find(m => m.name === lastMigration);

    if (!migration) {
      console.error(`Migration "${lastMigration}" not found in migration list.`);
      console.log('Available migrations:', migrations.map(m => m.name).join(', '));
      return;
    }

    console.log(`Rolling back: ${lastMigration}...`);

    await client.query('BEGIN');

    try {
      await client.query(migration.down);
      await client.query('DELETE FROM migrations WHERE name = $1', [lastMigration]);
      await client.query('COMMIT');
      console.log(`[ROLLED BACK] ${lastMigration}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`[FAIL] Rollback failed:`, error);
      throw error;
    }

    console.log('\nRollback completed successfully!');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Check for --all flag to rollback all migrations
const rollbackAll = process.argv.includes('--all');

async function rollbackAllMigrations() {
  const client = await pool.connect();

  try {
    console.log('Rolling back ALL migrations...\n');
    console.log('WARNING: This will drop all tables!\n');

    // Reverse the migrations array to rollback in reverse order
    const reversedMigrations = [...migrations].reverse();

    for (const migration of reversedMigrations) {
      console.log(`Rolling back: ${migration.name}...`);
      try {
        await client.query(migration.down);
        console.log(`[ROLLED BACK] ${migration.name}`);
      } catch (error) {
        console.log(`[SKIP] ${migration.name} (may not exist)`);
      }
    }

    // Also remove seed entries from migrations table
    try {
      await client.query(`DELETE FROM migrations WHERE name LIKE 'seed_%'`);
      console.log('[CLEARED] Seed tracking records');
    } catch (error) {
      // Ignore if migrations table doesn't exist
    }

    // Drop migrations table itself
    try {
      await client.query('DROP TABLE IF EXISTS migrations CASCADE');
      console.log('[DROPPED] migrations table');
    } catch (error) {
      // Ignore
    }

    console.log('\nAll migrations rolled back!');
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (rollbackAll) {
  rollbackAllMigrations();
} else {
  rollbackLastMigration();
}
