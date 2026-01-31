/**
 * Webhook Controller
 * Handles incoming webhooks from external services (Plaid)
 *
 * Sprint 2 Implementation:
 * - Plaid transaction webhooks for automatic updates
 * - Connection error notifications
 */

import { Request, Response, NextFunction } from 'express';
import { plaidService, PlaidWebhookPayload } from '../services/plaidService';
import { accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';

/**
 * Handle Plaid webhooks
 * POST /api/v1/webhooks/plaid
 *
 * Plaid sends webhooks for:
 * - TRANSACTIONS: New transactions available, transactions removed
 * - ITEM: Connection errors, pending expiration
 */
export const handlePlaidWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const payload = req.body as PlaidWebhookPayload;

    console.log('Received Plaid webhook:', {
      type: payload.webhook_type,
      code: payload.webhook_code,
      item_id: payload.item_id,
    });

    // Verify webhook authenticity (in production)
    // Note: Plaid webhook verification should be done in production
    const isValid = plaidService.verifyWebhook(payload);
    if (!isValid) {
      console.warn('Invalid Plaid webhook signature');
      res.status(401).json({ success: false, message: 'Invalid webhook signature' });
      return;
    }

    // Parse webhook and determine action
    const action = plaidService.parseWebhook(payload);

    switch (action.type) {
      case 'sync_required': {
        // Get accounts for this Plaid Item
        const accounts = await accountService.getAccountsByPlaidItemId(action.itemId);

        if (accounts.length === 0) {
          console.warn(`No accounts found for Plaid Item: ${action.itemId}`);
          break;
        }

        // Sync transactions for each account
        for (const account of accounts) {
          try {
            const result = await transactionService.syncAccountTransactions(account.account_id);
            console.log(`Synced account ${account.account_id}:`, {
              added: result.added,
              modified: result.modified,
              removed: result.removed,
            });
          } catch (error) {
            console.error(`Failed to sync account ${account.account_id}:`, error);
          }
        }
        break;
      }

      case 'error': {
        // Update account status to error
        const accounts = await accountService.getAccountsByPlaidItemId(action.itemId);

        for (const account of accounts) {
          const errorDetails = action.details?.error as {
            error_type?: string;
            error_code?: string;
            error_message?: string;
          } | undefined;

          await accountService.updateConnectionStatus(
            account.account_id,
            'error',
            errorDetails?.error_code || 'PLAID_ERROR',
            errorDetails?.error_message || 'Connection error'
          );

          console.log(`Updated account ${account.account_id} status to error`);

          // TODO: Create notification for user about connection error
          // This would be implemented in Sprint 3 with the notification system
        }
        break;
      }

      case 'remove': {
        // Handle item removal (user disconnected from bank side)
        const accounts = await accountService.getAccountsByPlaidItemId(action.itemId);

        for (const account of accounts) {
          await accountService.updateConnectionStatus(
            account.account_id,
            'disconnected',
            'ITEM_REMOVED',
            'Connection removed by bank or user'
          );
          console.log(`Account ${account.account_id} marked as disconnected`);
        }
        break;
      }

      case 'unknown':
      default:
        console.log('Unhandled webhook type:', payload.webhook_type, payload.webhook_code);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Plaid from retrying
    res.status(200).json({
      success: true,
      message: 'Webhook acknowledged (with errors)',
    });
  }
};

/**
 * Webhook verification endpoint (for Plaid to verify webhook URL)
 * GET /api/v1/webhooks/plaid
 */
export const verifyPlaidWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Plaid may send a GET request to verify the webhook URL
  res.status(200).json({
    success: true,
    message: 'Webhook endpoint active',
  });
};
