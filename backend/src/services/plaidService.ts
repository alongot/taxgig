/**
 * Plaid Service
 * Handles all Plaid API interactions for bank account connections and transaction sync
 *
 * Sprint 2 Implementation:
 * - Link token creation for Plaid Link UI
 * - Public token exchange for access tokens
 * - Transaction sync with cursor-based pagination
 * - Webhook handling for real-time updates
 */

import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  TransactionsSyncRequest,
  Transaction as PlaidTransactionType,
  RemovedTransaction,
  AccountBase,
  WebhookType,
} from 'plaid';
import { config } from '../config';
import { BadRequestError, ServiceUnavailableError } from '../utils/errors';

// Initialize Plaid client configuration
const plaidConfig = new Configuration({
  basePath: PlaidEnvironments[config.plaid.env as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': config.plaid.clientId,
      'PLAID-SECRET': config.plaid.secret,
    },
  },
});

// Create Plaid API client
const plaidClient = new PlaidApi(plaidConfig);

// =============================================================================
// TYPES
// =============================================================================

export interface LinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

export interface AccessTokenResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string | null;
  };
}

export interface TransactionSyncResult {
  added: PlaidTransactionType[];
  modified: PlaidTransactionType[];
  removed: RemovedTransaction[];
  next_cursor: string;
  has_more: boolean;
  accounts: AccountBase[];
  request_id: string;
}

export interface PlaidWebhookPayload {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  error?: {
    error_type: string;
    error_code: string;
    error_message: string;
  };
  new_transactions?: number;
  removed_transactions?: string[];
}

// =============================================================================
// PLAID SERVICE CLASS
// =============================================================================

export class PlaidService {
  /**
   * Create a Plaid Link token for initializing Plaid Link in the frontend
   * This token is used to securely connect bank accounts
   */
  async createLinkToken(userId: string, redirectUri?: string): Promise<LinkTokenResponse> {
    try {
      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: userId,
        },
        client_name: 'Side Hustle Tax Tracker',
        products: [Products.Transactions],
        country_codes: [CountryCode.Us],
        language: 'en',
        // Webhook URL for transaction updates (configure in production)
        webhook: config.plaid.env === 'production'
          ? `${config.urls.webApp}/api/v1/webhooks/plaid`
          : undefined,
        // For OAuth redirect (mobile apps)
        redirect_uri: redirectUri,
      };

      // In sandbox mode, enable all account types for testing
      if (config.plaid.env === 'sandbox') {
        request.products = [Products.Transactions];
      }

      const response = await plaidClient.linkTokenCreate(request);

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id,
      };
    } catch (error) {
      console.error('Plaid Link token creation failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to create bank connection link');
    }
  }

  /**
   * Create a Link token for updating an existing connection
   * Used when a bank connection needs re-authentication
   */
  async createUpdateLinkToken(userId: string, accessToken: string): Promise<LinkTokenResponse> {
    try {
      const request: LinkTokenCreateRequest = {
        user: {
          client_user_id: userId,
        },
        client_name: 'Side Hustle Tax Tracker',
        country_codes: [CountryCode.Us],
        language: 'en',
        access_token: accessToken,
      };

      const response = await plaidClient.linkTokenCreate(request);

      return {
        link_token: response.data.link_token,
        expiration: response.data.expiration,
        request_id: response.data.request_id,
      };
    } catch (error) {
      console.error('Plaid update Link token creation failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to create bank update link');
    }
  }

  /**
   * Exchange a public token for an access token
   * Called after user completes Plaid Link flow
   */
  async exchangePublicToken(publicToken: string): Promise<AccessTokenResponse> {
    try {
      const request: ItemPublicTokenExchangeRequest = {
        public_token: publicToken,
      };

      const response = await plaidClient.itemPublicTokenExchange(request);

      return {
        access_token: response.data.access_token,
        item_id: response.data.item_id,
        request_id: response.data.request_id,
      };
    } catch (error) {
      console.error('Plaid public token exchange failed:', error);
      this.handlePlaidError(error);
      throw new BadRequestError('Failed to connect bank account');
    }
  }

  /**
   * Get accounts associated with an access token
   */
  async getAccounts(accessToken: string): Promise<PlaidAccount[]> {
    try {
      const response = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      return response.data.accounts.map((account) => ({
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        balances: {
          available: account.balances.available,
          current: account.balances.current,
          limit: account.balances.limit,
          iso_currency_code: account.balances.iso_currency_code,
        },
      }));
    } catch (error) {
      console.error('Plaid get accounts failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to retrieve account information');
    }
  }

  /**
   * Get institution information
   */
  async getInstitution(institutionId: string): Promise<{ name: string; institution_id: string }> {
    try {
      const response = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: [CountryCode.Us],
      });

      return {
        name: response.data.institution.name,
        institution_id: response.data.institution.institution_id,
      };
    } catch (error) {
      console.error('Plaid get institution failed:', error);
      // Return default if institution lookup fails
      return {
        name: 'Unknown Institution',
        institution_id: institutionId,
      };
    }
  }

  /**
   * Sync transactions using cursor-based pagination
   * This is the recommended approach per Isaac's technical guidance
   *
   * Key features:
   * - Incremental updates (only fetches new/modified transactions)
   * - Cursor stored in accounts table for resuming
   * - Handles added, modified, and removed transactions
   */
  async syncTransactions(accessToken: string, cursor?: string): Promise<TransactionSyncResult> {
    try {
      let allAdded: PlaidTransactionType[] = [];
      let allModified: PlaidTransactionType[] = [];
      let allRemoved: RemovedTransaction[] = [];
      let currentCursor = cursor || '';
      let hasMore = true;
      let accounts: AccountBase[] = [];
      let requestId = '';

      // Paginate through all available updates
      while (hasMore) {
        const request: TransactionsSyncRequest = {
          access_token: accessToken,
          cursor: currentCursor || undefined,
          count: 500, // Maximum per request
        };

        const response = await plaidClient.transactionsSync(request);

        allAdded = allAdded.concat(response.data.added);
        allModified = allModified.concat(response.data.modified);
        allRemoved = allRemoved.concat(response.data.removed);

        hasMore = response.data.has_more;
        currentCursor = response.data.next_cursor;
        accounts = response.data.accounts;
        requestId = response.data.request_id;
      }

      return {
        added: allAdded,
        modified: allModified,
        removed: allRemoved,
        next_cursor: currentCursor,
        has_more: false, // All pages fetched
        accounts,
        request_id: requestId,
      };
    } catch (error) {
      console.error('Plaid transaction sync failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to sync transactions');
    }
  }

  /**
   * Remove an Item (disconnect bank account)
   */
  async removeItem(accessToken: string): Promise<void> {
    try {
      await plaidClient.itemRemove({
        access_token: accessToken,
      });
    } catch (error) {
      console.error('Plaid item removal failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to disconnect bank account');
    }
  }

  /**
   * Get Item status (for checking connection health)
   */
  async getItemStatus(accessToken: string): Promise<{
    available_products: string[];
    billed_products: string[];
    error: { error_type: string; error_code: string; error_message: string } | null;
    institution_id: string | null;
  }> {
    try {
      const response = await plaidClient.itemGet({
        access_token: accessToken,
      });

      const item = response.data.item;

      return {
        available_products: item.available_products,
        billed_products: item.billed_products,
        error: item.error ? {
          error_type: item.error.error_type,
          error_code: item.error.error_code,
          error_message: item.error.error_message,
        } : null,
        institution_id: item.institution_id || null,
      };
    } catch (error) {
      console.error('Plaid item status check failed:', error);
      this.handlePlaidError(error);
      throw new ServiceUnavailableError('Failed to check account status');
    }
  }

  /**
   * Verify webhook authenticity (production use)
   * In sandbox mode, this is not strictly necessary
   */
  verifyWebhook(webhookBody: PlaidWebhookPayload, verificationKey?: string): boolean {
    // In production, implement proper webhook verification
    // using Plaid's webhook verification endpoint
    if (config.plaid.env === 'sandbox') {
      return true;
    }

    // TODO: Implement production webhook verification
    // using plaidClient.webhookVerificationKeyGet()
    return true;
  }

  /**
   * Parse webhook payload and determine action needed
   */
  parseWebhook(payload: PlaidWebhookPayload): {
    type: 'sync_required' | 'error' | 'remove' | 'unknown';
    itemId: string;
    details?: Record<string, unknown>;
  } {
    const { webhook_type, webhook_code, item_id, error } = payload;

    // Handle transaction webhooks
    if (webhook_type === 'TRANSACTIONS') {
      switch (webhook_code) {
        case 'SYNC_UPDATES_AVAILABLE':
        case 'INITIAL_UPDATE':
        case 'HISTORICAL_UPDATE':
        case 'DEFAULT_UPDATE':
          return {
            type: 'sync_required',
            itemId: item_id,
            details: { newTransactions: payload.new_transactions },
          };
        case 'TRANSACTIONS_REMOVED':
          return {
            type: 'sync_required',
            itemId: item_id,
            details: { removedTransactions: payload.removed_transactions },
          };
        default:
          return { type: 'unknown', itemId: item_id };
      }
    }

    // Handle item webhooks (connection issues)
    if (webhook_type === 'ITEM') {
      switch (webhook_code) {
        case 'ERROR':
          return {
            type: 'error',
            itemId: item_id,
            details: { error },
          };
        case 'PENDING_EXPIRATION':
          return {
            type: 'error',
            itemId: item_id,
            details: { error: { message: 'Connection will expire soon' } },
          };
        default:
          return { type: 'unknown', itemId: item_id };
      }
    }

    return { type: 'unknown', itemId: item_id };
  }

  /**
   * Handle Plaid-specific errors and convert to appropriate app errors
   */
  private handlePlaidError(error: unknown): void {
    if (error && typeof error === 'object' && 'response' in error) {
      const plaidError = error as {
        response?: {
          data?: {
            error_type?: string;
            error_code?: string;
            error_message?: string;
          };
        };
      };

      const errorData = plaidError.response?.data;

      if (errorData) {
        console.error('Plaid API Error:', {
          type: errorData.error_type,
          code: errorData.error_code,
          message: errorData.error_message,
        });

        // Handle specific error types
        switch (errorData.error_type) {
          case 'INVALID_REQUEST':
            throw new BadRequestError(errorData.error_message || 'Invalid request to banking service');
          case 'ITEM_ERROR':
            // Connection issues - need re-authentication
            throw new BadRequestError('Bank connection requires re-authentication');
          case 'RATE_LIMIT_EXCEEDED':
            throw new ServiceUnavailableError('Too many requests. Please try again later.');
          default:
            // Generic error
            break;
        }
      }
    }
  }
}

// Export singleton instance
export const plaidService = new PlaidService();
