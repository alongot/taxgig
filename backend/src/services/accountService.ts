/**
 * Account Service
 * Manages connected financial accounts (Plaid bank connections)
 *
 * Sprint 2 Implementation:
 * - Account CRUD operations
 * - Plaid Link flow integration
 * - Sync cursor management
 * - Connection status tracking
 */

import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../config/database';
import { plaidService, PlaidAccount } from './plaidService';
import {
  Account,
  AccountCreateInput,
  PlatformType,
  ConnectionStatus,
} from '../types';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface ConnectBankAccountInput {
  userId: string;
  publicToken: string;
  accountIds?: string[]; // Optional: specific accounts to connect
  metadata?: {
    institution_id?: string;
    institution_name?: string;
  };
}

export interface AccountWithBalance extends Account {
  balance_available?: number | null;
  balance_current?: number | null;
}

export interface AccountSummary {
  total_accounts: number;
  connected_accounts: number;
  error_accounts: number;
  accounts: AccountWithBalance[];
}

// =============================================================================
// ACCOUNT SERVICE CLASS
// =============================================================================

export class AccountService {
  /**
   * Create a Plaid Link token for the user to connect a bank account
   */
  async createLinkToken(userId: string): Promise<{ link_token: string; expiration: string }> {
    const response = await plaidService.createLinkToken(userId);
    return {
      link_token: response.link_token,
      expiration: response.expiration,
    };
  }

  /**
   * Create a Link token to update an existing connection
   */
  async createUpdateLinkToken(userId: string, accountId: string): Promise<{ link_token: string; expiration: string }> {
    const account = await this.getAccountById(userId, accountId);

    if (!account.plaid_access_token) {
      throw new BadRequestError('Account does not have a Plaid connection');
    }

    const response = await plaidService.createUpdateLinkToken(userId, account.plaid_access_token);
    return {
      link_token: response.link_token,
      expiration: response.expiration,
    };
  }

  /**
   * Connect a bank account using Plaid public token
   * This is called after user completes Plaid Link flow
   */
  async connectBankAccount(input: ConnectBankAccountInput): Promise<Account[]> {
    const { userId, publicToken, accountIds, metadata } = input;

    // Exchange public token for access token
    const { access_token, item_id } = await plaidService.exchangePublicToken(publicToken);

    // Get accounts from Plaid
    const plaidAccounts = await plaidService.getAccounts(access_token);

    // Filter to selected accounts if specified
    const accountsToConnect = accountIds && accountIds.length > 0
      ? plaidAccounts.filter(a => accountIds.includes(a.account_id))
      : plaidAccounts;

    if (accountsToConnect.length === 0) {
      throw new BadRequestError('No valid accounts selected');
    }

    // Get institution info
    let institutionName = metadata?.institution_name || 'Unknown Bank';
    const institutionId = metadata?.institution_id;

    if (institutionId && !metadata?.institution_name) {
      try {
        const institution = await plaidService.getInstitution(institutionId);
        institutionName = institution.name;
      } catch {
        // Keep default name if lookup fails
      }
    }

    // Create account records in database
    const createdAccounts: Account[] = [];

    for (const plaidAccount of accountsToConnect) {
      // Check if account already connected
      const existing = await query(
        'SELECT account_id FROM accounts WHERE plaid_account_id = $1 AND user_id = $2',
        [plaidAccount.account_id, userId]
      );

      if (existing.rows.length > 0) {
        // Update existing connection
        const updateResult = await query(
          `UPDATE accounts SET
            plaid_access_token = $1,
            plaid_item_id = $2,
            connection_status = 'connected',
            connection_error_code = NULL,
            connection_error_message = NULL,
            updated_at = NOW()
          WHERE account_id = $3 AND user_id = $4
          RETURNING *`,
          [access_token, item_id, existing.rows[0].account_id, userId]
        );
        createdAccounts.push(this.mapToAccount(updateResult.rows[0]));
      } else {
        // Create new account
        const accountId = uuidv4();
        const accountName = plaidAccount.official_name || plaidAccount.name;

        const result = await query(
          `INSERT INTO accounts (
            account_id, user_id, platform, account_name, account_type,
            account_mask, institution_name, institution_id,
            plaid_access_token, plaid_item_id, plaid_account_id,
            connection_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING *`,
          [
            accountId,
            userId,
            'plaid_bank',
            accountName,
            `${plaidAccount.type}${plaidAccount.subtype ? `_${plaidAccount.subtype}` : ''}`,
            plaidAccount.mask,
            institutionName,
            institutionId,
            access_token,
            item_id,
            plaidAccount.account_id,
            'connected',
          ]
        );

        createdAccounts.push(this.mapToAccount(result.rows[0]));
      }
    }

    return createdAccounts;
  }

  /**
   * Get all accounts for a user
   */
  async getUserAccounts(userId: string): Promise<AccountSummary> {
    const result = await query(
      `SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const accounts = result.rows.map(row => this.mapToAccount(row));

    return {
      total_accounts: accounts.length,
      connected_accounts: accounts.filter(a => a.connection_status === 'connected').length,
      error_accounts: accounts.filter(a => a.connection_status === 'error').length,
      accounts,
    };
  }

  /**
   * Get a specific account
   */
  async getAccountById(userId: string, accountId: string): Promise<Account> {
    const result = await query(
      'SELECT * FROM accounts WHERE account_id = $1 AND user_id = $2',
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    return this.mapToAccount(result.rows[0]);
  }

  /**
   * Get account by Plaid Item ID (for webhook handling)
   */
  async getAccountByPlaidItemId(itemId: string): Promise<Account | null> {
    const result = await query(
      'SELECT * FROM accounts WHERE plaid_item_id = $1 LIMIT 1',
      [itemId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapToAccount(result.rows[0]);
  }

  /**
   * Get all accounts with same Plaid Item ID (multiple accounts from one bank)
   */
  async getAccountsByPlaidItemId(itemId: string): Promise<Account[]> {
    const result = await query(
      'SELECT * FROM accounts WHERE plaid_item_id = $1',
      [itemId]
    );

    return result.rows.map(row => this.mapToAccount(row));
  }

  /**
   * Update account sync cursor
   */
  async updateSyncCursor(accountId: string, cursor: string): Promise<void> {
    await query(
      `UPDATE accounts SET
        sync_cursor = $1,
        last_synced_at = NOW(),
        updated_at = NOW()
      WHERE account_id = $2`,
      [cursor, accountId]
    );
  }

  /**
   * Update connection status
   */
  async updateConnectionStatus(
    accountId: string,
    status: ConnectionStatus,
    errorCode?: string,
    errorMessage?: string
  ): Promise<void> {
    await query(
      `UPDATE accounts SET
        connection_status = $1,
        connection_error_code = $2,
        connection_error_message = $3,
        updated_at = NOW()
      WHERE account_id = $4`,
      [status, errorCode || null, errorMessage || null, accountId]
    );
  }

  /**
   * Update last synced timestamp
   */
  async updateLastSynced(accountId: string): Promise<void> {
    await query(
      `UPDATE accounts SET
        last_synced_at = NOW(),
        updated_at = NOW()
      WHERE account_id = $1`,
      [accountId]
    );
  }

  /**
   * Disconnect a bank account
   */
  async disconnectAccount(userId: string, accountId: string): Promise<void> {
    const account = await this.getAccountById(userId, accountId);

    // Remove Plaid item if it has one
    if (account.plaid_access_token) {
      try {
        await plaidService.removeItem(account.plaid_access_token);
      } catch (error) {
        // Log but don't fail if Plaid removal fails
        console.error('Failed to remove Plaid item:', error);
      }
    }

    // Delete account from database
    await query(
      'DELETE FROM accounts WHERE account_id = $1 AND user_id = $2',
      [accountId, userId]
    );
  }

  /**
   * Soft disconnect (mark as disconnected but keep data)
   */
  async softDisconnectAccount(userId: string, accountId: string): Promise<Account> {
    const result = await query(
      `UPDATE accounts SET
        connection_status = 'disconnected',
        updated_at = NOW()
      WHERE account_id = $1 AND user_id = $2
      RETURNING *`,
      [accountId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    return this.mapToAccount(result.rows[0]);
  }

  /**
   * Check connection health and update status
   */
  async checkConnectionHealth(accountId: string): Promise<{
    healthy: boolean;
    status: ConnectionStatus;
    error?: string;
  }> {
    const result = await query(
      'SELECT * FROM accounts WHERE account_id = $1',
      [accountId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Account not found');
    }

    const account = this.mapToAccount(result.rows[0]);

    if (!account.plaid_access_token) {
      return {
        healthy: false,
        status: 'error',
        error: 'No Plaid access token',
      };
    }

    try {
      const itemStatus = await plaidService.getItemStatus(account.plaid_access_token);

      if (itemStatus.error) {
        await this.updateConnectionStatus(
          accountId,
          'error',
          itemStatus.error.error_code,
          itemStatus.error.error_message
        );

        return {
          healthy: false,
          status: 'error',
          error: itemStatus.error.error_message,
        };
      }

      // Connection is healthy
      if (account.connection_status !== 'connected') {
        await this.updateConnectionStatus(accountId, 'connected');
      }

      return {
        healthy: true,
        status: 'connected',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection check failed';

      await this.updateConnectionStatus(accountId, 'error', 'CONNECTION_CHECK_FAILED', errorMessage);

      return {
        healthy: false,
        status: 'error',
        error: errorMessage,
      };
    }
  }

  /**
   * Get accounts that need syncing (connected accounts)
   */
  async getAccountsForSync(userId?: string): Promise<Account[]> {
    let queryText = `
      SELECT * FROM accounts
      WHERE connection_status = 'connected'
        AND plaid_access_token IS NOT NULL
    `;
    const params: unknown[] = [];

    if (userId) {
      queryText += ' AND user_id = $1';
      params.push(userId);
    }

    queryText += ' ORDER BY last_synced_at ASC NULLS FIRST';

    const result = await query(queryText, params);
    return result.rows.map(row => this.mapToAccount(row));
  }

  /**
   * Map database row to Account object
   */
  private mapToAccount(row: Record<string, unknown>): Account {
    return {
      account_id: row.account_id as string,
      user_id: row.user_id as string,
      platform: row.platform as PlatformType,
      account_name: row.account_name as string,
      account_type: row.account_type as string | null,
      account_mask: row.account_mask as string | null,
      institution_name: row.institution_name as string | null,
      institution_id: row.institution_id as string | null,
      plaid_access_token: row.plaid_access_token as string | null,
      plaid_item_id: row.plaid_item_id as string | null,
      plaid_account_id: row.plaid_account_id as string | null,
      stripe_account_id: row.stripe_account_id as string | null,
      connection_status: row.connection_status as ConnectionStatus,
      connection_error_code: row.connection_error_code as string | null,
      connection_error_message: row.connection_error_message as string | null,
      last_synced_at: row.last_synced_at ? new Date(row.last_synced_at as string) : null,
      sync_cursor: row.sync_cursor as string | null,
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }
}

// Export singleton instance
export const accountService = new AccountService();
