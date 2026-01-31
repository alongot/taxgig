/**
 * Webhook Routes
 * API endpoints for receiving webhooks from external services
 *
 * Sprint 2 Implementation:
 * - Plaid webhook endpoint (no auth required - Plaid sends directly)
 */

import { Router } from 'express';
import {
  handlePlaidWebhook,
  verifyPlaidWebhook,
} from '../controllers/webhookController';

const router = Router();

// =============================================================================
// PLAID WEBHOOKS
// These endpoints do NOT require authentication as they are called by Plaid
// =============================================================================

/**
 * @route   GET /api/v1/webhooks/plaid
 * @desc    Verify Plaid webhook endpoint
 * @access  Public (Plaid only)
 */
router.get('/plaid', verifyPlaidWebhook);

/**
 * @route   POST /api/v1/webhooks/plaid
 * @desc    Handle Plaid webhooks (transactions, connection errors)
 * @access  Public (Plaid only)
 */
router.post('/plaid', handlePlaidWebhook);

export default router;
