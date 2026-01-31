/**
 * Notification Service
 * Manages notifications, alerts, and reminders
 *
 * Sprint 4 Implementation:
 * - CRUD operations for notifications
 * - Threshold alerts ($4K warning, $5K reached)
 * - Deadline reminders (7 days before quarterly due dates)
 * - In-app notification center
 * - Push notification integration (Firebase placeholder)
 */

import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import {
  Notification,
  NotificationCreateInput,
  NotificationType,
  NotificationPreferences,
  IRS_REPORTING_THRESHOLD,
  IRS_WARNING_THRESHOLD,
} from '../types';
import { NotFoundError, BadRequestError } from '../utils/errors';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationListResult {
  notifications: Notification[];
  unread_count: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface NotificationFilters {
  is_read?: boolean;
  notification_type?: NotificationType;
  start_date?: Date;
  end_date?: Date;
}

export interface ThresholdAlertData {
  current_income: number;
  threshold: number;
  percent_of_threshold: number;
  tax_year: number;
}

export interface DeadlineReminderData {
  tax_year: number;
  quarter: number;
  due_date: Date;
  days_until_due: number;
  estimated_payment: number;
}

// =============================================================================
// NOTIFICATION SERVICE CLASS
// =============================================================================

export class NotificationService {
  /**
   * Create a new notification
   */
  async createNotification(input: NotificationCreateInput): Promise<Notification> {
    const notificationId = uuidv4();

    const result = await query(
      `INSERT INTO notifications (
        notification_id, user_id, notification_type, title, message,
        action_type, action_url, action_data, delivery_channel,
        scheduled_for, expires_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *`,
      [
        notificationId,
        input.user_id,
        input.notification_type,
        input.title,
        input.message,
        input.action_type || null,
        input.action_url || null,
        input.action_data ? JSON.stringify(input.action_data) : null,
        input.delivery_channel || ['in_app'],
        input.scheduled_for || null,
        input.expires_at || null,
      ]
    );

    const notification = this.mapToNotification(result.rows[0]);

    // Attempt to send push notification if enabled
    if (input.delivery_channel?.includes('push')) {
      await this.sendPushNotification(notification);
    }

    return notification;
  }

  /**
   * Get notifications for a user with filtering and pagination
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<NotificationListResult> {
    const conditions: string[] = ['user_id = $1', 'is_dismissed = FALSE'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    // Filter out expired notifications
    conditions.push(`(expires_at IS NULL OR expires_at > NOW())`);

    // Filter out future scheduled notifications
    conditions.push(`(scheduled_for IS NULL OR scheduled_for <= NOW())`);

    if (filters.is_read !== undefined) {
      conditions.push(`is_read = $${paramIndex}`);
      params.push(filters.is_read);
      paramIndex++;
    }

    if (filters.notification_type) {
      conditions.push(`notification_type = $${paramIndex}`);
      params.push(filters.notification_type);
      paramIndex++;
    }

    if (filters.start_date) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(filters.end_date);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM notifications WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Get unread count
    const unreadResult = await query(
      `SELECT COUNT(*) as unread FROM notifications
       WHERE user_id = $1 AND is_read = FALSE AND is_dismissed = FALSE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (scheduled_for IS NULL OR scheduled_for <= NOW())`,
      [userId]
    );
    const unreadCount = parseInt(unreadResult.rows[0].unread, 10);

    // Get paginated notifications
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await query(
      `SELECT * FROM notifications
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return {
      notifications: result.rows.map(row => this.mapToNotification(row)),
      unread_count: unreadCount,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(userId: string, notificationId: string): Promise<Notification> {
    const result = await query(
      'SELECT * FROM notifications WHERE notification_id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    return this.mapToNotification(result.rows[0]);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE notification_id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Notification not found');
    }

    return this.mapToNotification(result.rows[0]);
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE, read_at = NOW()
       WHERE user_id = $1 AND is_read = FALSE AND is_dismissed = FALSE
       RETURNING notification_id`,
      [userId]
    );

    return result.rowCount || 0;
  }

  /**
   * Dismiss a notification
   */
  async dismissNotification(userId: string, notificationId: string): Promise<void> {
    const result = await query(
      `UPDATE notifications
       SET is_dismissed = TRUE, dismissed_at = NOW()
       WHERE notification_id = $1 AND user_id = $2`,
      [notificationId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Notification not found');
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM notifications
       WHERE user_id = $1 AND is_read = FALSE AND is_dismissed = FALSE
         AND (expires_at IS NULL OR expires_at > NOW())
         AND (scheduled_for IS NULL OR scheduled_for <= NOW())`,
      [userId]
    );

    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Create threshold alert notification ($4K warning or $5K reached)
   */
  async createThresholdAlert(
    userId: string,
    data: ThresholdAlertData
  ): Promise<Notification | null> {
    // Check if we've already sent this alert
    const existingResult = await query(
      `SELECT notification_id FROM notifications
       WHERE user_id = $1
         AND notification_type = 'threshold_alert'
         AND action_data->>'tax_year' = $2
         AND action_data->>'threshold' = $3`,
      [userId, data.tax_year.toString(), data.threshold.toString()]
    );

    if (existingResult.rows.length > 0) {
      return null; // Alert already sent
    }

    const isWarning = data.threshold === IRS_WARNING_THRESHOLD;
    const title = isWarning
      ? `Approaching $5,000 IRS Threshold`
      : `$5,000 IRS Reporting Threshold Reached`;

    const message = isWarning
      ? `You've earned $${data.current_income.toLocaleString()} in side income this year (${data.percent_of_threshold.toFixed(0)}% of the $5,000 IRS reporting threshold). Based on current IRS guidance, you may need to make quarterly tax payments.`
      : `Your side income has reached $${data.current_income.toLocaleString()} this year, exceeding the $5,000 IRS reporting threshold. Based on current IRS guidance, payment platforms will generally report this income to the IRS. You may need to consider quarterly tax payments.`;

    return this.createNotification({
      user_id: userId,
      notification_type: 'threshold_alert',
      title,
      message,
      action_type: 'navigate',
      action_url: '/tax/threshold',
      action_data: {
        tax_year: data.tax_year,
        threshold: data.threshold,
        current_income: data.current_income,
      },
      delivery_channel: ['in_app', 'push'],
    });
  }

  /**
   * Create deadline reminder notification
   */
  async createDeadlineReminder(
    userId: string,
    data: DeadlineReminderData
  ): Promise<Notification | null> {
    // Check if we've already sent a reminder for this deadline at this days_until_due
    const existingResult = await query(
      `SELECT notification_id FROM notifications
       WHERE user_id = $1
         AND notification_type = 'deadline_reminder'
         AND action_data->>'tax_year' = $2
         AND action_data->>'quarter' = $3
         AND action_data->>'days_until_due' = $4`,
      [userId, data.tax_year.toString(), data.quarter.toString(), data.days_until_due.toString()]
    );

    if (existingResult.rows.length > 0) {
      return null; // Reminder already sent
    }

    const dueDate = data.due_date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const title = data.days_until_due <= 1
      ? `Q${data.quarter} Tax Payment Due Tomorrow!`
      : `Q${data.quarter} Tax Payment Due in ${data.days_until_due} Days`;

    const paymentFormatted = data.estimated_payment.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const message = `Based on current IRS guidance, your Q${data.quarter} ${data.tax_year} estimated tax payment of ${paymentFormatted} is generally due by ${dueDate}. You may need to make this payment to avoid potential penalties.`;

    return this.createNotification({
      user_id: userId,
      notification_type: 'deadline_reminder',
      title,
      message,
      action_type: 'navigate',
      action_url: '/tax/payments',
      action_data: {
        tax_year: data.tax_year,
        quarter: data.quarter,
        due_date: data.due_date.toISOString(),
        days_until_due: data.days_until_due,
        estimated_payment: data.estimated_payment,
      },
      delivery_channel: ['in_app', 'push'],
    });
  }

  /**
   * Create connection error notification
   */
  async createConnectionErrorAlert(
    userId: string,
    accountName: string,
    errorMessage: string
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      notification_type: 'connection_error',
      title: `Reconnect ${accountName}`,
      message: `We couldn't sync your ${accountName} account. ${errorMessage} Please reconnect to continue importing transactions.`,
      action_type: 'navigate',
      action_url: '/accounts',
      action_data: { account_name: accountName },
      delivery_channel: ['in_app', 'push'],
    });
  }

  /**
   * Create review needed notification
   */
  async createReviewNeededAlert(
    userId: string,
    transactionCount: number
  ): Promise<Notification> {
    return this.createNotification({
      user_id: userId,
      notification_type: 'review_needed',
      title: `${transactionCount} Transactions Need Review`,
      message: `You have ${transactionCount} transaction${transactionCount > 1 ? 's' : ''} that need${transactionCount === 1 ? 's' : ''} to be categorized. Review them to ensure accurate tax calculations.`,
      action_type: 'navigate',
      action_url: '/transactions?filter=review_needed',
      action_data: { transaction_count: transactionCount },
      delivery_channel: ['in_app'],
    });
  }

  /**
   * Check and create threshold alerts for a user
   * Called after transaction sync
   */
  async checkThresholdAlerts(userId: string, totalIncome: number, taxYear: number): Promise<void> {
    // Check $4,000 warning threshold
    if (totalIncome >= IRS_WARNING_THRESHOLD && totalIncome < IRS_REPORTING_THRESHOLD) {
      await this.createThresholdAlert(userId, {
        current_income: totalIncome,
        threshold: IRS_WARNING_THRESHOLD,
        percent_of_threshold: (totalIncome / IRS_REPORTING_THRESHOLD) * 100,
        tax_year: taxYear,
      });
    }

    // Check $5,000 reached threshold
    if (totalIncome >= IRS_REPORTING_THRESHOLD) {
      await this.createThresholdAlert(userId, {
        current_income: totalIncome,
        threshold: IRS_REPORTING_THRESHOLD,
        percent_of_threshold: 100,
        tax_year: taxYear,
      });
    }
  }

  /**
   * Check and create deadline reminders for users
   * Should be run daily via cron job
   */
  async checkDeadlineReminders(): Promise<number> {
    const now = new Date();
    const reminderDays = [7, 3, 1]; // Send reminders at 7, 3, and 1 day(s) before

    // Get upcoming deadlines
    const deadlineResult = await query(
      `SELECT * FROM tax_deadlines
       WHERE due_date > $1
         AND due_date <= $1 + INTERVAL '8 days'
       ORDER BY due_date`,
      [now]
    );

    if (deadlineResult.rows.length === 0) {
      return 0;
    }

    let notificationsSent = 0;

    for (const deadline of deadlineResult.rows) {
      const dueDate = new Date(deadline.due_date);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (!reminderDays.includes(daysUntilDue)) {
        continue;
      }

      // Get all users with notification preferences enabled
      const usersResult = await query(
        `SELECT user_id FROM users
         WHERE notification_preferences->>'deadline_reminders' = 'true'`
      );

      for (const user of usersResult.rows) {
        // Get estimated payment for this user/quarter
        const taxEstimate = await query(
          `SELECT quarterly_payment_amount FROM tax_estimates
           WHERE user_id = $1 AND tax_year = $2 AND quarter = $3
           ORDER BY calculated_at DESC LIMIT 1`,
          [user.user_id, deadline.tax_year, deadline.quarter]
        );

        const estimatedPayment = taxEstimate.rows.length > 0
          ? parseFloat(taxEstimate.rows[0].quarterly_payment_amount)
          : 0;

        const notification = await this.createDeadlineReminder(user.user_id, {
          tax_year: deadline.tax_year,
          quarter: deadline.quarter,
          due_date: dueDate,
          days_until_due: daysUntilDue,
          estimated_payment: estimatedPayment,
        });

        if (notification) {
          notificationsSent++;
        }
      }
    }

    return notificationsSent;
  }

  /**
   * Send push notification (Firebase Cloud Messaging placeholder)
   * In production, implement actual FCM integration
   */
  private async sendPushNotification(notification: Notification): Promise<boolean> {
    // Check user's notification preferences
    const userResult = await query(
      'SELECT notification_preferences FROM users WHERE user_id = $1',
      [notification.user_id]
    );

    if (userResult.rows.length === 0) {
      return false;
    }

    const prefs = userResult.rows[0].notification_preferences as NotificationPreferences;

    if (!prefs.push_enabled) {
      return false;
    }

    // Check quiet hours
    if (prefs.quiet_hours_start && prefs.quiet_hours_end) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;

      const [startHour, startMin] = prefs.quiet_hours_start.split(':').map(Number);
      const [endHour, endMin] = prefs.quiet_hours_end.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;

      // Check if current time is within quiet hours
      if (startTime < endTime) {
        // Simple case: quiet hours don't span midnight
        if (currentTime >= startTime && currentTime < endTime) {
          return false; // In quiet hours, don't send push
        }
      } else {
        // Quiet hours span midnight
        if (currentTime >= startTime || currentTime < endTime) {
          return false; // In quiet hours, don't send push
        }
      }
    }

    // TODO: Implement actual Firebase Cloud Messaging
    // For now, just mark as sent (placeholder)
    console.log(`[PUSH] Would send notification to user ${notification.user_id}: ${notification.title}`);

    await query(
      `UPDATE notifications
       SET push_sent = TRUE, push_sent_at = NOW()
       WHERE notification_id = $1`,
      [notification.notification_id]
    );

    return true;
  }

  /**
   * Map database row to Notification object
   */
  private mapToNotification(row: Record<string, unknown>): Notification {
    return {
      notification_id: row.notification_id as string,
      user_id: row.user_id as string,
      notification_type: row.notification_type as NotificationType,
      title: row.title as string,
      message: row.message as string,
      action_type: row.action_type as Notification['action_type'],
      action_url: row.action_url as string | null,
      action_data: row.action_data as Record<string, unknown> | null,
      delivery_channel: row.delivery_channel as string[],
      push_sent: row.push_sent as boolean,
      push_sent_at: row.push_sent_at ? new Date(row.push_sent_at as string) : null,
      email_sent: row.email_sent as boolean,
      email_sent_at: row.email_sent_at ? new Date(row.email_sent_at as string) : null,
      is_read: row.is_read as boolean,
      read_at: row.read_at ? new Date(row.read_at as string) : null,
      is_dismissed: row.is_dismissed as boolean,
      dismissed_at: row.dismissed_at ? new Date(row.dismissed_at as string) : null,
      scheduled_for: row.scheduled_for ? new Date(row.scheduled_for as string) : null,
      expires_at: row.expires_at ? new Date(row.expires_at as string) : null,
      created_at: new Date(row.created_at as string),
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
