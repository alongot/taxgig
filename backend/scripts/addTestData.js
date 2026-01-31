const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function addTestData() {
  const client = await pool.connect();
  try {
    // Get user_id and an account_id (use the user with accounts)
    const userResult = await client.query("SELECT user_id FROM users WHERE email = 'alon@haircompounds.com' LIMIT 1");
    const userId = userResult.rows[0].user_id;

    const accountResult = await client.query('SELECT account_id FROM accounts WHERE user_id = $1 LIMIT 1', [userId]);
    const accountId = accountResult.rows[0].account_id;

    // Get category IDs
    const categories = await client.query('SELECT category_id, category_code FROM expense_categories');
    const catMap = {};
    categories.rows.forEach(c => catMap[c.category_code] = c.category_id);

    console.log('User ID:', userId);
    console.log('Account ID:', accountId);
    console.log('Categories:', Object.keys(catMap));

    // Realistic side hustle income transactions (2026)
    const incomeTransactions = [
      // Uber income
      { date: '2026-01-02', amount: 187.50, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-05', amount: 234.80, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-09', amount: 156.25, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-12', amount: 298.40, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-16', amount: 212.75, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-19', amount: 189.30, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-23', amount: 267.90, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      { date: '2026-01-26', amount: 203.15, merchant: 'UBER', desc: 'UBER BV PAYMENT' },
      // DoorDash income
      { date: '2026-01-03', amount: 145.20, merchant: 'DOORDASH', desc: 'DOORDASH DIRECT DEP' },
      { date: '2026-01-10', amount: 178.90, merchant: 'DOORDASH', desc: 'DOORDASH DIRECT DEP' },
      { date: '2026-01-17', amount: 156.45, merchant: 'DOORDASH', desc: 'DOORDASH DIRECT DEP' },
      { date: '2026-01-24', amount: 189.30, merchant: 'DOORDASH', desc: 'DOORDASH DIRECT DEP' },
      // Upwork freelance income
      { date: '2026-01-07', amount: 850.00, merchant: 'UPWORK', desc: 'UPWORK ESCROW INC' },
      { date: '2026-01-21', amount: 1250.00, merchant: 'UPWORK', desc: 'UPWORK ESCROW INC' },
      // Etsy sales
      { date: '2026-01-08', amount: 89.99, merchant: 'ETSY', desc: 'ETSY INC PAYMENT' },
      { date: '2026-01-15', amount: 124.50, merchant: 'ETSY', desc: 'ETSY INC PAYMENT' },
      { date: '2026-01-22', amount: 67.25, merchant: 'ETSY', desc: 'ETSY INC PAYMENT' },
    ];

    // Realistic business expense transactions (2026)
    const expenseTransactions = [
      // Gas/Fuel
      { date: '2026-01-02', amount: -45.50, merchant: 'SHELL', desc: 'SHELL OIL', category: 'vehicle_expenses' },
      { date: '2026-01-08', amount: -52.30, merchant: 'CHEVRON', desc: 'CHEVRON GAS', category: 'vehicle_expenses' },
      { date: '2026-01-15', amount: -48.75, merchant: 'EXXON', desc: 'EXXONMOBIL', category: 'vehicle_expenses' },
      { date: '2026-01-22', amount: -55.20, merchant: 'BP', desc: 'BP GAS STATION', category: 'vehicle_expenses' },
      // Car maintenance
      { date: '2026-01-10', amount: -89.99, merchant: 'JIFFY LUBE', desc: 'JIFFY LUBE OIL CHANGE', category: 'vehicle_expenses' },
      // Phone bill (partial business use)
      { date: '2026-01-05', amount: -85.00, merchant: 'VERIZON', desc: 'VERIZON WIRELESS', category: 'utilities' },
      // Office supplies
      { date: '2026-01-06', amount: -34.99, merchant: 'OFFICE DEPOT', desc: 'OFFICE DEPOT', category: 'supplies' },
      { date: '2026-01-18', amount: -22.50, merchant: 'STAPLES', desc: 'STAPLES OFFICE', category: 'supplies' },
      // Software subscriptions
      { date: '2026-01-01', amount: -14.99, merchant: 'ADOBE', desc: 'ADOBE CREATIVE CLOUD', category: 'other' },
      { date: '2026-01-01', amount: -12.99, merchant: 'QUICKBOOKS', desc: 'INTUIT QUICKBOOKS', category: 'other' },
      // Internet (partial business use)
      { date: '2026-01-03', amount: -79.99, merchant: 'COMCAST', desc: 'COMCAST XFINITY', category: 'utilities' },
      // Business meals
      { date: '2026-01-11', amount: -28.50, merchant: 'STARBUCKS', desc: 'STARBUCKS CLIENT MTG', category: 'meals' },
      { date: '2026-01-19', amount: -45.80, merchant: 'PANERA', desc: 'PANERA BREAD CLIENT', category: 'meals' },
      // Advertising
      { date: '2026-01-12', amount: -50.00, merchant: 'FACEBOOK', desc: 'FACEBOOK ADS', category: 'advertising' },
      // Professional services
      { date: '2026-01-20', amount: -150.00, merchant: 'LEGALZOOM', desc: 'LEGALZOOM LLC FILING', category: 'legal_professional' },
      // Car wash
      { date: '2026-01-14', amount: -15.00, merchant: 'CAR WASH', desc: 'SPARKLE CAR WASH', category: 'vehicle_expenses' },
    ];

    // Insert income transactions
    for (const tx of incomeTransactions) {
      await client.query(`
        INSERT INTO transactions (
          transaction_id, user_id, account_id, external_transaction_id,
          transaction_date, amount, iso_currency_code,
          description, merchant_name, transaction_type,
          is_business, business_percentage, categorization_source,
          categorization_confidence, review_required, is_excluded,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'USD', $7, $8, 'income',
          TRUE, 100, 'auto', 0.85, FALSE, FALSE, NOW(), NOW()
        )
      `, [uuidv4(), userId, accountId, 'test-' + uuidv4(), tx.date, tx.amount, tx.desc, tx.merchant]);
    }
    console.log('Added', incomeTransactions.length, 'income transactions');

    // Insert expense transactions
    for (const tx of expenseTransactions) {
      const categoryId = catMap[tx.category] || null;
      await client.query(`
        INSERT INTO transactions (
          transaction_id, user_id, account_id, external_transaction_id,
          transaction_date, amount, iso_currency_code,
          description, merchant_name, transaction_type, category_id,
          is_business, business_percentage, categorization_source,
          categorization_confidence, review_required, is_excluded,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 'USD', $7, $8, 'expense', $9,
          TRUE, 100, 'auto', 0.80, FALSE, FALSE, NOW(), NOW()
        )
      `, [uuidv4(), userId, accountId, 'test-' + uuidv4(), tx.date, tx.amount, tx.desc, tx.merchant, categoryId]);
    }
    console.log('Added', expenseTransactions.length, 'expense transactions');

    // Get updated totals for 2026
    const stats = await client.query(`
      SELECT
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
      FROM transactions
      WHERE transaction_date >= '2026-01-01'
        AND is_business = TRUE
        AND is_excluded = FALSE
    `);
    console.log('\n2026 YTD Totals:');
    console.log('  Income: $' + parseFloat(stats.rows[0].income).toFixed(2));
    console.log('  Expenses: $' + parseFloat(stats.rows[0].expenses).toFixed(2));
    console.log('  Net Profit: $' + (parseFloat(stats.rows[0].income) - parseFloat(stats.rows[0].expenses)).toFixed(2));

  } finally {
    client.release();
    pool.end();
  }
}

addTestData().catch(err => {
  console.error(err);
  process.exit(1);
});
