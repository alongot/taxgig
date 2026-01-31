/**
 * Notification Routes
 * In-app notifications, alerts, and reminders
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getNotifications,
  getNotification,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  dismissNotification,
  createTestNotification,
  checkDeadlines,
} from '../controllers/notificationController';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20, max: 100)
 *   - is_read: Filter by read status (true/false)
 *   - type: Filter by notification type
 *   - start_date: Filter by created date range
 *   - end_date: Filter by created date range
 */
router.get('/', getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications (for badge)
 */
router.get('/unread-count', getUnreadCount);

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/mark-all-read', markAllAsRead);

/**
 * POST /api/notifications/test
 * Create a test notification (development only)
 * Body: { type: 'threshold_warning' | 'threshold_reached' | 'deadline' | 'connection_error' | 'review_needed' }
 */
router.post('/test', createTestNotification);

/**
 * POST /api/notifications/check-deadlines
 * Manually trigger deadline reminder check (cron job in production)
 */
router.post('/check-deadlines', checkDeadlines);

/**
 * GET /api/notifications/:id
 * Get a single notification
 */
router.get('/:id', getNotification);

/**
 * PATCH /api/notifications/:id/read
 * Mark a specific notification as read
 */
router.patch('/:id/read', markAsRead);

/**
 * DELETE /api/notifications/:id
 * Dismiss a notification
 */
router.delete('/:id', dismissNotification);

export default router;
