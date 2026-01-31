/**
 * Transaction Service
 * Manages transaction storage, sync, and retrieval
 *
 * Sprint 2 Implementation:
 * - Transaction sync from Plaid with cursor support
 * - Automatic categorization on import
 * - Deduplication using external_transaction_id
 * - CRUD operations with filtering and pagination
 */

import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database';
import { plaidService } from './plaidService';
import { accountService } from './accountService';
import { categorizationService, CategorizationResult } from './categorizationService';
import {
  Transaction,
  TransactionCreateInput,
  TransactionUpdateInput,
  TransactionType,
  CategorizationSource,
  Account,
} from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Transaction as PlaidTransactionType } from 'plaid';

// =============================================================================
// TYPES
// =============================================================================

export interface TransactionSyncResult {
  added: number;
  modified: number;
  removed: number;
  errors: string[];
}

export interface TransactionFilters {
  account_id?: string;
  transaction_type?: TransactionType;
  category_id?: string;
  is_business?: boolean;
  review_required?: boolean;
  start_date?: Date;
  end_date?: Date;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export interface TransactionListResult {
  transactions: TransactionWithCategory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  summary: {
    total_income: number;
    total_expenses: number;
    net: number;
    review_count: number;
  };
}

export interface TransactionWithCategory extends Transaction {
  category_name?: string;
  category_code?: string;
  account_name?: string;
  institution_name?: string;
}

// =============================================================================
// TRANSACTION SERVICE CLASS
// =============================================================================

export class TransactionService {
  /**
   * Sync transactions for a specific account
   * Uses Plaid's transactions/sync endpoint with cursor support
   */
  async syncAccountTransactions(accountId: string): Promise<TransactionSyncResult> {
    const result: TransactionSyncResult = {
      added: 0,
      modified: 0,
      removed: 0,
      errors: [],
    };

    // Get account with access token
    const accountResult = await query(
      'SELECT * FROM accounts WHERE account_id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    const account: Account = this.mapToAccount(accountResult.rows[0]);

    if (!account.plaid_access_token) {
      throw new BadRequestError('Account does not have a Plaid connection');
    }

    if (account.connection_status !== 'connected') {
      throw new BadRequestError('Account is not connected');
    }

    try {
      // Sync transactions from Plaid
      const syncResult = await plaidService.syncTransactions(
        account.plaid_access_token,
        account.sync_cursor || undefined
      );

      // Process added transactions
      for (const plaidTx of syncResult.added) {
        try {
          await this.processPlaidTransaction(account, plaidTx, 'add');
          result.added++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Add ${plaidTx.transaction_id}: ${message}`);
        }
      }

      // Process modified transactions
      for (const plaidTx of syncResult.modified) {
        try {
          await this.processPlaidTransaction(account, plaidTx, 'modify');
          result.modified++;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Modify ${plaidTx.transaction_id}: ${message}`);
        }
      }

      // Process removed transactions
      for (const removed of syncResult.removed) {
        try {
          const transactionId = removed.transaction_id || '';
          if (transactionId) {
            await this.markTransactionRemoved(account.account_id, transactionId);
            result.removed++;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`Remove ${removed.transaction_id || 'unknown'}: ${message}`);
        }
      }

      // Update sync cursor
      await accountService.updateSyncCursor(accountId, syncResult.next_cursor);

      // Update last synced timestamp
      await accountService.updateLastSynced(accountId);

    } catch (error) {
      // Update account status on error
      const message = error instanceof Error ? error.message : 'Sync failed';
      await accountService.updateConnectionStatus(accountId, 'error', 'SYNC_ERROR', message);
      throw error;
    }

    return result;
  }

  /**
   * Process a single Plaid transaction (add or modify)
   */
  private async processPlaidTransaction(
    account: Account,
    plaidTx: PlaidTransactionType,
    action: 'add' | 'modify'
  ): Promise<void> {
    // Skip pending transactions
    if (plaidTx.pending) {
      return;
    }

    // Run categorization
    const categorization = await categorizationService.categorizeTransaction({
      amount: plaidTx.amount,
      description: plaidTx.name,
      original_description: plaidTx.original_description || null,
      merchant_name: plaidTx.merchant_name || null,
      mcc_code: plaidTx.merchant_entity_id || null,
      plaid_category: plaidTx.personal_finance_category?.detailed || null,
      payment_channel: plaidTx.payment_channel,
    }, account.user_id);

    if (action === 'add') {
      // Check for duplicate
      const existing = await query(
        'SELECT transaction_id FROM transactions WHERE account_id = $1 AND external_transaction_id = $2',
        [account.account_id, plaidTx.transaction_id]
      );

      if (existing.rows.length > 0) {
        // Already exists, treat as modify
        await this.updateTransactionFromPlaid(existing.rows[0].transaction_id, plaidTx, categorization);
        return;
      }

      // Insert new transaction
      await this.createTransactionFromPlaid(account, plaidTx, categorization);
    } else {
      // Modify existing transaction
      const existing = await query(
        'SELECT transaction_id FROM transactions WHERE account_id = $1 AND external_transaction_id = $2',
        [account.account_id, plaidTx.transaction_id]
      );

      if (existing.rows.length > 0) {
        await this.updateTransactionFromPlaid(existing.rows[0].transaction_id, plaidTx, categorization);
      } else {
        // Doesn't exist, create it
        await this.createTransactionFromPlaid(account, plaidTx, categorization);
      }
    }
  }

  /**
   * Create a new transaction from Plaid data
   */
  private async createTransactionFromPlaid(
    account: Account,
    plaidTx: PlaidTransactionType,
    categorization: CategorizationResult
  ): Promise<void> {
    const transactionId = uuidv4();

    // Plaid amounts: positive = money leaving account (expense), negative = money entering (income)
    // Our convention: positive = income, negative = expense
    // So we need to flip the sign
    const amount = -plaidTx.amount;

    await query(
      `INSERT INTO transactions (
        transaction_id, user_id, account_id,
        external_transaction_id, plaid_transaction_id,
        transaction_date, posted_date, amount, iso_currency_code,
        description, original_description, merchant_name, merchant_category,
        mcc_code, transaction_type, category_id, is_business, business_percentage,
        categorization_source, categorization_confidence, review_required,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW(), NOW()
      )`,
      [
        transactionId,
        account.user_id,
        account.account_id,
        plaidTx.transaction_id,
        plaidTx.transaction_id,
        plaidTx.date,
        plaidTx.authorized_date || plaidTx.date,
        amount,
        plaidTx.iso_currency_code || 'USD',
        plaidTx.name,
        plaidTx.original_description || null,
        plaidTx.merchant_name || null,
        plaidTx.personal_finance_category?.detailed || null,
        plaidTx.merchant_entity_id || null,
        categorization.transaction_type,
        categorization.category_id,
        categorization.is_business,
        100.00, // Default 100% business use
        categorization.source,
        categorization.confidence,
        categorization.review_required,
      ]
    );
  }

  /**
   * Update an existing transaction with new Plaid data
   */
  private async updateTransactionFromPlaid(
    transactionId: string,
    plaidTx: PlaidTransactionType,
    categorization: CategorizationResult
  ): Promise<void> {
    const amount = -plaidTx.amount;

    // Only update fields from Plaid, preserve user categorizations
    await query(
      `UPDATE transactions SET
        transaction_date = $1,
        posted_date = $2,
        amount = $3,
        description = $4,
        original_description = $5,
        merchant_name = $6,
        merchant_category = $7,
        updated_at = NOW()
      WHERE transaction_id = $8
        AND reviewed_by_user = FALSE`, // Don't overwrite user-reviewed transactions
      [
        plaidTx.date,
        plaidTx.authorized_date || plaidTx.date,
        amount,
        plaidTx.name,
        plaidTx.original_description || null,
        plaidTx.merchant_name || null,
        plaidTx.personal_finance_category?.detailed || null,
        transactionId,
      ]
    );
  }

  /**
   * Mark a transaction as removed (when Plaid reports it removed)
   */
  private async markTransactionRemoved(accountId: string, plaidTransactionId: string): Promise<void> {
    await query(
      `UPDATE transactions SET
        is_excluded = TRUE,
        exclude_reason = 'Removed by bank',
        updated_at = NOW()
      WHERE account_id = $1 AND plaid_transaction_id = $2`,
      [accountId, plaidTransactionId]
    );
  }

  /**
   * Get transactions for a user with filtering and pagination
   */
  async getTransactions(
    userId: string,
    filters: TransactionFilters = {},
    page: number = 1,
    limit: number = 50
  ): Promise<TransactionListResult> {
    const conditions: string[] = ['t.user_id = $1', 't.is_excluded = FALSE'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters.account_id) {
      conditions.push(`t.account_id = $${paramIndex}`);
      params.push(filters.account_id);
      paramIndex++;
    }

    if (filters.transaction_type) {
      conditions.push(`t.transaction_type = $${paramIndex}`);
      params.push(filters.transaction_type);
      paramIndex++;
    }

    if (filters.category_id) {
      conditions.push(`t.category_id = $${paramIndex}`);
      params.push(filters.category_id);
      paramIndex++;
    }

    if (filters.is_business !== undefined) {
      conditions.push(`t.is_business = $${paramIndex}`);
      params.push(filters.is_business);
      paramIndex++;
    }

    if (filters.review_required !== undefined) {
      conditions.push(`t.review_required = $${paramIndex}`);
      params.push(filters.review_required);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`t.transaction_date >= $${paramIndex}`);
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`t.transaction_date <= $${paramIndex}`);
      params.push(filters.end_date);
      paramIndex++;
    }

    if (filters.min_amount !== undefined) {
      conditions.push(`ABS(t.amount) >= $${paramIndex}`);
      params.push(filters.min_amount);
      paramIndex++;
    }

    if (filters.max_amount !== undefined) {
      conditions.push(`ABS(t.amount) <= $${paramIndex}`);
      params.push(filters.max_amount);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(
        t.description ILIKE $${paramIndex}
        OR t.merchant_name ILIKE $${paramIndex}
        OR t.original_description ILIKE $${paramIndex}
      )`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM transactions t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get summary
    const summaryResult = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(t.amount), 0) as net,
        COUNT(CASE WHEN t.review_required = TRUE THEN 1 END) as review_count
      FROM transactions t WHERE ${whereClause}`,
      params
    );

    // Get paginated transactions
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const transactionsResult = await query(
      `SELECT
        t.*,
        ec.category_name,
        ec.category_code,
        a.account_name,
        a.institution_name
      FROM transactions t
      LEFT JOIN expense_categories ec ON t.category_id = ec.category_id
      LEFT JOIN accounts a ON t.account_id = a.account_id
      WHERE ${whereClause}
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    const transactions = transactionsResult.rows.map(row => this.mapToTransactionWithCategory(row));

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
      summary: {
        total_income: parseFloat(summaryResult.rows[0].total_income) || 0,
        total_expenses: parseFloat(summaryResult.rows[0].total_expenses) || 0,
        net: parseFloat(summaryResult.rows[0].net) || 0,
        review_count: parseInt(summaryResult.rows[0].review_count, 10) || 0,
      },
    };
  }

  /**
   * Get a single transaction by ID
   */
  async getTransactionById(userId: string, transactionId: string): Promise<TransactionWithCategory> {
    const result = await query(
      `SELECT
        t.*,
        ec.category_name,
        ec.category_code,
        a.account_name,
        a.institution_name
      FROM transactions t
      LEFT JOIN expense_categories ec ON t.category_id = ec.category_id
      LEFT JOIN accounts a ON t.account_id = a.account_id
      WHERE t.transaction_id = $1 AND t.user_id = $2`,
      [transactionId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Transaction not found');
    }

    return this.mapToTransactionWithCategory(result.rows[0]);
  }

  /**
   * Update a transaction (category, business flag, notes, etc.)
   */
  async updateTransaction(
    userId: string,
    transactionId: string,
    updates: TransactionUpdateInput
  ): Promise<TransactionWithCategory> {
    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.category_id !== undefined) {
      setClause.push(`category_id = $${paramIndex}`);
      values.push(updates.category_id);
      paramIndex++;

      // When user sets category, update categorization source
      setClause.push(`categorization_source = 'user'`);
    }

    if (updates.is_business !== undefined) {
      setClause.push(`is_business = $${paramIndex}`);
      values.push(updates.is_business);
      paramIndex++;
    }

    if (updates.business_percentage !== undefined) {
      setClause.push(`business_percentage = $${paramIndex}`);
      values.push(updates.business_percentage);
      paramIndex++;
    }

    if (updates.reviewed_by_user !== undefined) {
      setClause.push(`reviewed_by_user = $${paramIndex}`);
      values.push(updates.reviewed_by_user);
      paramIndex++;

      // Clear review flag when user reviews
      if (updates.reviewed_by_user) {
        setClause.push(`review_required = FALSE`);
      }
    }

    if (updates.is_excluded !== undefined) {
      setClause.push(`is_excluded = $${paramIndex}`);
      values.push(updates.is_excluded);
      paramIndex++;
    }

    if (updates.exclude_reason !== undefined) {
      setClause.push(`exclude_reason = $${paramIndex}`);
      values.push(updates.exclude_reason);
      paramIndex++;
    }

    if (updates.notes !== undefined) {
      setClause.push(`notes = $${paramIndex}`);
      values.push(updates.notes);
      paramIndex++;
    }

    if (setClause.length === 0) {
      return this.getTransactionById(userId, transactionId);
    }

    setClause.push(`updated_at = NOW()`);
    values.push(transactionId, userId);

    await query(
      `UPDATE transactions SET ${setClause.join(', ')}
       WHERE transaction_id = $${paramIndex} AND user_id = $${paramIndex + 1}`,
      values
    );

    return this.getTransactionById(userId, transactionId);
  }

  /**
   * Bulk update transactions (for batch categorization)
   */
  async bulkUpdateTransactions(
    userId: string,
    transactionIds: string[],
    updates: Partial<TransactionUpdateInput>
  ): Promise<{ updated: number }> {
    if (transactionIds.length === 0) {
      return { updated: 0 };
    }

    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.category_id !== undefined) {
      setClause.push(`category_id = $${paramIndex}`);
      values.push(updates.category_id);
      paramIndex++;
      setClause.push(`categorization_source = 'user'`);
    }

    if (updates.is_business !== undefined) {
      setClause.push(`is_business = $${paramIndex}`);
      values.push(updates.is_business);
      paramIndex++;
    }

    if (updates.reviewed_by_user !== undefined && updates.reviewed_by_user) {
      setClause.push(`reviewed_by_user = TRUE`);
      setClause.push(`review_required = FALSE`);
    }

    if (setClause.length === 0) {
      return { updated: 0 };
    }

    setClause.push(`updated_at = NOW()`);

    // Create placeholders for transaction IDs
    const idPlaceholders = transactionIds.map((_, i) => `$${paramIndex + i}`).join(', ');
    values.push(...transactionIds, userId);

    const result = await query(
      `UPDATE transactions SET ${setClause.join(', ')}
       WHERE transaction_id IN (${idPlaceholders})
         AND user_id = $${paramIndex + transactionIds.length}`,
      values
    );

    return { updated: result.rowCount || 0 };
  }

  /**
   * Get transactions that need review
   */
  async getTransactionsForReview(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<TransactionListResult> {
    return this.getTransactions(
      userId,
      { review_required: true },
      page,
      limit
    );
  }

  /**
   * Get transaction statistics for a date range
   */
  async getTransactionStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total_income: number;
    total_expenses: number;
    net_profit: number;
    business_income: number;
    business_expenses: number;
    transaction_count: number;
    categorized_count: number;
    reviewed_count: number;
    income_by_platform: Record<string, number>;
    expenses_by_category: Record<string, number>;
  }> {
    // Main stats - joins expense_categories to apply IRS deduction rates
    const statsResult = await query(
      `SELECT
        COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN t.amount < 0 THEN ABS(t.amount) ELSE 0 END), 0) as total_expenses,
        COALESCE(SUM(t.amount), 0) as net_profit,
        COALESCE(SUM(CASE WHEN t.amount > 0 AND t.is_business = TRUE THEN t.amount ELSE 0 END), 0) as business_income,
        COALESCE(SUM(CASE WHEN t.amount < 0 AND t.is_business = TRUE
          THEN ABS(t.amount) * t.business_percentage / 100 * COALESCE(ec.deduction_rate, 100) / 100
          ELSE 0 END), 0) as business_expenses,
        COUNT(*) as transaction_count,
        COUNT(CASE WHEN t.category_id IS NOT NULL THEN 1 END) as categorized_count,
        COUNT(CASE WHEN t.reviewed_by_user = TRUE THEN 1 END) as reviewed_count
      FROM transactions t
      LEFT JOIN expense_categories ec ON t.category_id = ec.category_id
      WHERE t.user_id = $1
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
        AND t.is_excluded = FALSE`,
      [userId, startDate, endDate]
    );

    // Income by platform (using merchant name patterns)
    const incomeByPlatformResult = await query(
      `SELECT
        COALESCE(
          CASE
            WHEN LOWER(merchant_name) LIKE '%uber%' THEN 'Uber'
            WHEN LOWER(merchant_name) LIKE '%lyft%' THEN 'Lyft'
            WHEN LOWER(merchant_name) LIKE '%doordash%' THEN 'DoorDash'
            WHEN LOWER(merchant_name) LIKE '%grubhub%' THEN 'Grubhub'
            WHEN LOWER(merchant_name) LIKE '%instacart%' THEN 'Instacart'
            WHEN LOWER(merchant_name) LIKE '%upwork%' THEN 'Upwork'
            WHEN LOWER(merchant_name) LIKE '%fiverr%' THEN 'Fiverr'
            WHEN LOWER(merchant_name) LIKE '%etsy%' THEN 'Etsy'
            WHEN LOWER(merchant_name) LIKE '%paypal%' THEN 'PayPal'
            WHEN LOWER(merchant_name) LIKE '%stripe%' THEN 'Stripe'
            ELSE 'Other'
          END,
          'Other'
        ) as platform,
        SUM(amount) as total
      FROM transactions
      WHERE user_id = $1
        AND transaction_date >= $2
        AND transaction_date <= $3
        AND amount > 0
        AND is_excluded = FALSE
      GROUP BY platform`,
      [userId, startDate, endDate]
    );

    // Expenses by category - returns raw business amounts (business_percentage only)
    // Deduction rate is applied separately in reports for display purposes
    const expensesByCategoryResult = await query(
      `SELECT
        COALESCE(ec.category_code, 'uncategorized') as category,
        COALESCE(ec.category_name, 'Uncategorized') as category_name,
        SUM(ABS(t.amount) * t.business_percentage / 100) as total
      FROM transactions t
      LEFT JOIN expense_categories ec ON t.category_id = ec.category_id
      WHERE t.user_id = $1
        AND t.transaction_date >= $2
        AND t.transaction_date <= $3
        AND t.amount < 0
        AND t.is_business = TRUE
        AND t.is_excluded = FALSE
      GROUP BY ec.category_code, ec.category_name
      ORDER BY total DESC`,
      [userId, startDate, endDate]
    );

    const incomeByPlatform: Record<string, number> = {};
    for (const row of incomeByPlatformResult.rows) {
      incomeByPlatform[row.platform] = parseFloat(row.total) || 0;
    }

    const expensesByCategory: Record<string, number> = {};
    for (const row of expensesByCategoryResult.rows) {
      expensesByCategory[row.category] = parseFloat(row.total) || 0;
    }

    const stats = statsResult.rows[0];

    return {
      total_income: parseFloat(stats.total_income) || 0,
      total_expenses: parseFloat(stats.total_expenses) || 0,
      net_profit: parseFloat(stats.net_profit) || 0,
      business_income: parseFloat(stats.business_income) || 0,
      business_expenses: parseFloat(stats.business_expenses) || 0,
      transaction_count: parseInt(stats.transaction_count, 10) || 0,
      categorized_count: parseInt(stats.categorized_count, 10) || 0,
      reviewed_count: parseInt(stats.reviewed_count, 10) || 0,
      income_by_platform: incomeByPlatform,
      expenses_by_category: expensesByCategory,
    };
  }

  /**
   * Map database row to Account object
   */
  private mapToAccount(row: Record<string, unknown>): Account {
    return {
      account_id: row.account_id as string,
      user_id: row.user_id as string,
      platform: row.platform as 'plaid_bank' | 'venmo' | 'paypal' | 'cashapp' | 'stripe' | 'manual',
      account_name: row.account_name as string,
      account_type: row.account_type as string | null,
      account_mask: row.account_mask as string | null,
      institution_name: row.institution_name as string | null,
      institution_id: row.institution_id as string | null,
      plaid_access_token: row.plaid_access_token as string | null,
      plaid_item_id: row.plaid_item_id as string | null,
      plaid_account_id: row.plaid_account_id as string | null,
      stripe_account_id: row.stripe_account_id as string | null,
      connection_status: row.connection_status as 'connected' | 'disconnected' | 'error' | 'pending',
      connection_error_code: row.connection_error_code as string | null,
      connection_error_message: row.connection_error_message as string | null,
      last_synced_at: row.last_synced_at ? new Date(row.last_synced_at as string) : null,
      sync_cursor: row.sync_cursor as string | null,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  /**
   * Map database row to TransactionWithCategory object
   */
  private mapToTransactionWithCategory(row: Record<string, unknown>): TransactionWithCategory {
    return {
      transaction_id: row.transaction_id as string,
      user_id: row.user_id as string,
      account_id: row.account_id as string,
      external_transaction_id: row.external_transaction_id as string,
      plaid_transaction_id: row.plaid_transaction_id as string | null,
      transaction_date: new Date(row.transaction_date as string),
      posted_date: row.posted_date ? new Date(row.posted_date as string) : null,
      amount: parseFloat(row.amount as string),
      iso_currency_code: row.iso_currency_code as string,
      description: row.description as string | null,
      original_description: row.original_description as string | null,
      merchant_name: row.merchant_name as string | null,
      merchant_category: row.merchant_category as string | null,
      mcc_code: row.mcc_code as string | null,
      transaction_type: row.transaction_type as TransactionType,
      category_id: row.category_id as string | null,
      is_business: row.is_business as boolean | null,
      business_percentage: parseFloat(row.business_percentage as string) || 100,
      categorization_source: row.categorization_source as CategorizationSource,
      categorization_confidence: row.categorization_confidence ? parseFloat(row.categorization_confidence as string) : null,
      reviewed_by_user: row.reviewed_by_user as boolean,
      review_required: row.review_required as boolean,
      is_duplicate: row.is_duplicate as boolean,
      is_excluded: row.is_excluded as boolean,
      exclude_reason: row.exclude_reason as string | null,
      notes: row.notes as string | null,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
      // Extended fields
      category_name: row.category_name as string | undefined,
      category_code: row.category_code as string | undefined,
      account_name: row.account_name as string | undefined,
      institution_name: row.institution_name as string | undefined,
    };
  }
}

// Export singleton instance
export const transactionService = new TransactionService();
