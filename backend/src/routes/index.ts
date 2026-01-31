/**
 * API Routes Index
 * Central routing configuration for the Side Hustle Tax Tracker API
 *
 * Sprint 1: Auth, Users
 * Sprint 2: Accounts (Plaid), Transactions, Webhooks
 * Sprint 3: Expenses, Tax Calculator
 * Sprint 4: Reports, Notifications (placeholders)
 */

import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import accountRoutes from './accountRoutes';
import transactionRoutes from './transactionRoutes';
import categoryRuleRoutes from './categoryRuleRoutes';
import webhookRoutes from './webhookRoutes';
import expenseRoutes from './expenseRoutes';
import taxRoutes from './taxRoutes';
import reportRoutes from './reportRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * @route   GET /api/v1/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    sprint: 4,
  });
});

// =============================================================================
// SPRINT 1 ROUTES - Authentication & Users
// =============================================================================

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

// =============================================================================
// SPRINT 2 ROUTES - Plaid Integration & Income Import
// =============================================================================

router.use('/accounts', accountRoutes);
router.use('/transactions', transactionRoutes);
router.use('/rules', categoryRuleRoutes);
router.use('/webhooks', webhookRoutes);

// =============================================================================
// SPRINT 3 ROUTES - Expenses & Tax Calculator
// =============================================================================

/**
 * Expenses API - Sprint 3
 * Manual expense entry, receipt scanning, mileage tracking
 */
router.use('/expenses', expenseRoutes);

/**
 * Tax Calculation API - Sprint 3
 * Quarterly estimates, SE tax calculation, threshold tracking
 */
router.use('/tax', taxRoutes);

// =============================================================================
// SPRINT 4 ROUTES - Reports & Notifications
// =============================================================================

/**
 * Reports API - Sprint 4
 * Schedule C PDF reports, export functionality
 */
router.use('/reports', reportRoutes);

/**
 * Notifications API - Sprint 4
 * Alerts, reminders, notification preferences
 */
router.use('/notifications', notificationRoutes);

export default router;
