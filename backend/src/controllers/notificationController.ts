/**
 * Notification Controller
 * Handles notification API endpoints
 */

import { Response, NextFunction } from 'express';
import { notificationService, NotificationFilters } from '../services/notificationService';
import { AuthRequest, NotificationType } from '../types';
import { BadRequestError } from '../utils/errors';

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 */
export async function getNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;

    // Parse query parameters
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

    const filters: NotificationFilters = {};

    if (req.query.is_read !== undefined) {
      filters.is_read = req.query.is_read === 'true';
    }

    if (req.query.type) {
      filters.notification_type = req.query.type as NotificationType;
    }

    if (req.query.start_date) {
      filters.start_date = new Date(req.query.start_date as string);
    }

    if (req.query.end_date) {
      filters.end_date = new Date(req.query.end_date as string);
    }

    const result = await notificationService.getNotifications(userId, filters, page, limit);

    res.json({
      success: true,
      data: result.notifications,
      unread_count: result.unread_count,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get a single notification
 * GET /api/notifications/:id
 */
export async function getNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;

    const notification = await notificationService.getNotificationById(userId, id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { unread_count: count },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
export async function markAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;

    const notification = await notificationService.markAsRead(userId, id);

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Mark all notifications as read
 * POST /api/notifications/mark-all-read
 */
export async function markAllAsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;

    const count = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      data: { marked_count: count },
      message: `${count} notification(s) marked as read`,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Dismiss a notification
 * DELETE /api/notifications/:id
 */
export async function dismissNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { id } = req.params;

    await notificationService.dismissNotification(userId, id);

    res.json({
      success: true,
      message: 'Notification dismissed',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Test endpoint: Create a test notification
 * POST /api/notifications/test
 * (Development only)
 */
export async function createTestNotification(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.user_id;
    const { type } = req.body;

    let notification;

    switch (type) {
      case 'threshold_warning':
        notification = await notificationService.createThresholdAlert(userId, {
          current_income: 4200,
          threshold: 4000,
          percent_of_threshold: 84,
          tax_year: new Date().getFullYear(),
        });
        break;

      case 'threshold_reached':
        notification = await notificationService.createThresholdAlert(userId, {
          current_income: 5500,
          threshold: 5000,
          percent_of_threshold: 100,
          tax_year: new Date().getFullYear(),
        });
        break;

      case 'deadline':
        notification = await notificationService.createDeadlineReminder(userId, {
          tax_year: new Date().getFullYear(),
          quarter: Math.ceil((new Date().getMonth() + 1) / 3),
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          days_until_due: 7,
          estimated_payment: 1250,
        });
        break;

      case 'connection_error':
        notification = await notificationService.createConnectionErrorAlert(
          userId,
          'Chase Bank',
          'Your login credentials have expired.'
        );
        break;

      case 'review_needed':
        notification = await notificationService.createReviewNeededAlert(userId, 15);
        break;

      default:
        throw new BadRequestError(
          'Invalid test type. Use: threshold_warning, threshold_reached, deadline, connection_error, or review_needed'
        );
    }

    if (!notification) {
      res.json({
        success: true,
        message: 'Notification already exists or was not created',
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Test notification created',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Trigger deadline reminder check
 * POST /api/notifications/check-deadlines
 * (Should be called by cron job in production)
 */
export async function checkDeadlines(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const count = await notificationService.checkDeadlineReminders();

    res.json({
      success: true,
      data: { notifications_sent: count },
      message: `Sent ${count} deadline reminder notification(s)`,
    });
  } catch (error) {
    next(error);
  }
}
