/**
 * Account Routes
 * API endpoints for bank account connections and management
 *
 * Sprint 2 Implementation:
 * All routes require authentication
 */

import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createLinkToken,
  createUpdateLinkToken,
  connectBankAccount,
  getUserAccounts,
  getAccount,
  syncAccount,
  checkAccountHealth,
  disconnectAccount,
  softDisconnectAccount,
  syncAllAccounts,
} from '../controllers/accountController';

const router = Router();

// All account routes require authentication
router.use(authenticate);

// =============================================================================
// PLAID LINK ROUTES
// =============================================================================

/**
 * @route   POST /api/v1/accounts/link-token
 * @desc    Create a Plaid Link token for connecting a new bank account
 * @access  Private
 */
router.post('/link-token', createLinkToken);

/**
 * @route   POST /api/v1/accounts/:accountId/update-link-token
 * @desc    Create a Plaid Link token for updating an existing connection
 * @access  Private
 */
router.post(
  '/:accountId/update-link-token',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  createUpdateLinkToken
);

/**
 * @route   POST /api/v1/accounts/connect
 * @desc    Connect a bank account using Plaid public token
 * @access  Private
 */
router.post(
  '/connect',
  [
    body('public_token')
      .notEmpty()
      .withMessage('Public token is required'),
    body('account_ids')
      .optional()
      .isArray()
      .withMessage('Account IDs must be an array'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object'),
  ],
  validate,
  connectBankAccount
);

// =============================================================================
// ACCOUNT MANAGEMENT ROUTES
// =============================================================================

/**
 * @route   GET /api/v1/accounts
 * @desc    Get all connected accounts for the user
 * @access  Private
 */
router.get('/', getUserAccounts);

/**
 * @route   POST /api/v1/accounts/sync-all
 * @desc    Sync transactions for all connected accounts
 * @access  Private
 */
router.post('/sync-all', syncAllAccounts);

/**
 * @route   GET /api/v1/accounts/:accountId
 * @desc    Get a specific account
 * @access  Private
 */
router.get(
  '/:accountId',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  getAccount
);

/**
 * @route   POST /api/v1/accounts/:accountId/sync
 * @desc    Sync transactions for a specific account
 * @access  Private
 */
router.post(
  '/:accountId/sync',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  syncAccount
);

/**
 * @route   GET /api/v1/accounts/:accountId/health
 * @desc    Check account connection health
 * @access  Private
 */
router.get(
  '/:accountId/health',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  checkAccountHealth
);

/**
 * @route   POST /api/v1/accounts/:accountId/disconnect
 * @desc    Soft disconnect account (keep transaction history)
 * @access  Private
 */
router.post(
  '/:accountId/disconnect',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  softDisconnectAccount
);

/**
 * @route   DELETE /api/v1/accounts/:accountId
 * @desc    Hard delete account and all related data
 * @access  Private
 */
router.delete(
  '/:accountId',
  [
    param('accountId').isUUID().withMessage('Invalid account ID'),
  ],
  validate,
  disconnectAccount
);

export default router;
