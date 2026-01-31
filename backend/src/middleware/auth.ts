import { Response, NextFunction } from 'express';
import { AuthRequest, NotificationPreferences } from '../types';
import { verifyAccessToken, extractTokenFromHeader } from '../utils/jwt';
import { UnauthorizedError } from '../utils/errors';
import { query } from '../config/database';

// Default notification preferences
const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  push_enabled: true,
  email_enabled: true,
  threshold_alerts: true,
  deadline_reminders: true,
  weekly_digest: true,
  transaction_review: true,
  quiet_hours_start: null,
  quiet_hours_end: null,
};

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const payload = verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Fetch user from database
    const result = await query(
      `SELECT user_id, email, full_name, tax_filing_status,
              marginal_tax_rate, w2_withholding_annual, primary_platform,
              onboarding_completed, onboarding_step, notification_preferences, created_at
       FROM users WHERE user_id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const row = result.rows[0];

    // Attach user to request with proper type mapping
    req.user = {
      user_id: row.user_id,
      email: row.email,
      full_name: row.full_name,
      tax_filing_status: row.tax_filing_status,
      marginal_tax_rate: parseFloat(row.marginal_tax_rate) || 22,
      w2_withholding_annual: parseFloat(row.w2_withholding_annual) || 0,
      primary_platform: row.primary_platform,
      onboarding_completed: row.onboarding_completed,
      onboarding_step: row.onboarding_step,
      notification_preferences: typeof row.notification_preferences === 'string'
        ? JSON.parse(row.notification_preferences)
        : row.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
      created_at: new Date(row.created_at),
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Attaches user to request if token is valid, but doesn't require auth
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyAccessToken(token);

      if (payload) {
        const result = await query(
          `SELECT user_id, email, full_name, tax_filing_status,
                  marginal_tax_rate, w2_withholding_annual, primary_platform,
                  onboarding_completed, onboarding_step, notification_preferences, created_at
           FROM users WHERE user_id = $1`,
          [payload.userId]
        );

        if (result.rows.length > 0) {
          const row = result.rows[0];
          req.user = {
            user_id: row.user_id,
            email: row.email,
            full_name: row.full_name,
            tax_filing_status: row.tax_filing_status,
            marginal_tax_rate: parseFloat(row.marginal_tax_rate) || 22,
            w2_withholding_annual: parseFloat(row.w2_withholding_annual) || 0,
            primary_platform: row.primary_platform,
            onboarding_completed: row.onboarding_completed,
            onboarding_step: row.onboarding_step,
            notification_preferences: typeof row.notification_preferences === 'string'
              ? JSON.parse(row.notification_preferences)
              : row.notification_preferences || DEFAULT_NOTIFICATION_PREFERENCES,
            created_at: new Date(row.created_at),
          };
        }
      }
    }
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
