/**
 * Account Controller
 * Handles HTTP requests for bank account connections
 *
 * Sprint 2 Implementation:
 * - Plaid Link token generation
 * - Account connection via public token
 * - Account listing and management
 * - Connection health checks
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';
import { BadRequestError } from '../utils/errors';

/**
 * Create a Plaid Link token for connecting a new bank account
 * POST /api/v1/accounts/link-token
 */
export const createLinkToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    const result = await accountService.createLinkToken(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Plaid Link token for updating an existing connection
 * POST /api/v1/accounts/:accountId/update-link-token
 */
export const createUpdateLinkToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    const result = await accountService.createUpdateLinkToken(userId, accountId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Connect a bank account using Plaid public token
 * POST /api/v1/accounts/connect
 */
export const connectBankAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { public_token, account_ids, metadata } = req.body;

    if (!public_token) {
      throw new BadRequestError('public_token is required');
    }

    const accounts = await accountService.connectBankAccount({
      userId,
      publicToken: public_token,
      accountIds: account_ids,
      metadata,
    });

    // Trigger initial transaction sync for each account
    const syncPromises = accounts.map(async (account) => {
      try {
        await transactionService.syncAccountTransactions(account.account_id);
      } catch (error) {
        console.error(`Initial sync failed for account ${account.account_id}:`, error);
        // Don't fail the connection if sync fails
      }
    });

    // Don't wait for syncs to complete
    Promise.all(syncPromises).catch(console.error);

    res.status(201).json({
      success: true,
      message: `Connected ${accounts.length} account(s) successfully`,
      data: {
        accounts,
        sync_status: 'initiated',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all connected accounts for the user
 * GET /api/v1/accounts
 */
export const getUserAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    const summary = await accountService.getUserAccounts(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific account
 * GET /api/v1/accounts/:accountId
 */
export const getAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    const account = await accountService.getAccountById(userId, accountId);

    res.status(200).json({
      success: true,
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync transactions for an account
 * POST /api/v1/accounts/:accountId/sync
 */
export const syncAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    // Verify user owns the account
    await accountService.getAccountById(userId, accountId);

    // Trigger sync
    const result = await transactionService.syncAccountTransactions(accountId);

    res.status(200).json({
      success: true,
      message: 'Transaction sync completed',
      data: {
        added: result.added,
        modified: result.modified,
        removed: result.removed,
        total_transactions: result.added + result.modified,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check account connection health
 * GET /api/v1/accounts/:accountId/health
 */
export const checkAccountHealth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    // Verify user owns the account
    await accountService.getAccountById(userId, accountId);

    const health = await accountService.checkConnectionHealth(accountId);

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disconnect a bank account (hard delete)
 * DELETE /api/v1/accounts/:accountId
 */
export const disconnectAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    await accountService.disconnectAccount(userId, accountId);

    res.status(200).json({
      success: true,
      message: 'Account disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft disconnect a bank account (keep transaction history)
 * POST /api/v1/accounts/:accountId/disconnect
 */
export const softDisconnectAccount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;
    const { accountId } = req.params;

    const account = await accountService.softDisconnectAccount(userId, accountId);

    res.status(200).json({
      success: true,
      message: 'Account disconnected. Transaction history preserved.',
      data: account,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sync all connected accounts for the user
 * POST /api/v1/accounts/sync-all
 */
export const syncAllAccounts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.user_id;

    const accounts = await accountService.getAccountsForSync(userId);

    if (accounts.length === 0) {
      res.status(200).json({
        success: true,
        message: 'No accounts to sync',
        data: {
          accounts_synced: 0,
          total_added: 0,
          total_modified: 0,
          total_removed: 0,
        },
      });
      return;
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    const errors: { account_id: string; error: string }[] = [];

    for (const account of accounts) {
      try {
        const result = await transactionService.syncAccountTransactions(account.account_id);
        totalAdded += result.added;
        totalModified += result.modified;
        totalRemoved += result.removed;
      } catch (error) {
        errors.push({
          account_id: account.account_id,
          error: error instanceof Error ? error.message : 'Sync failed',
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Synced ${accounts.length - errors.length} of ${accounts.length} accounts`,
      data: {
        accounts_synced: accounts.length - errors.length,
        total_added: totalAdded,
        total_modified: totalModified,
        total_removed: totalRemoved,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    next(error);
  }
};
