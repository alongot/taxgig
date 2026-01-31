import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateTokens, verifyRefreshToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt';
import {
  User,
  UserCreateInput,
  UserPublic,
  UserUpdateInput,
  AuthTokens,
  TaxFilingStatus,
  GoogleOAuthPayload,
  NotificationPreferences,
} from '../types';
import { ConflictError, NotFoundError, UnauthorizedError, BadRequestError } from '../utils/errors';

// Default notification preferences for new users
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
 * User service for authentication and user management
 */
export class UserService {
  /**
   * Create a new user with email/password
   */
  async createUser(input: UserCreateInput): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await query(
      'SELECT user_id FROM users WHERE email = $1',
      [input.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new ConflictError('A user with this email already exists');
    }

    // Validate password for non-OAuth users
    if (!input.google_id && !input.password) {
      throw new BadRequestError('Password is required for email registration');
    }

    // Hash password if provided
    const passwordHash = input.password ? await hashPassword(input.password) : null;

    // Create user
    const userId = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO users (
        user_id, email, password_hash, full_name, tax_filing_status,
        marginal_tax_rate, w2_withholding_annual, google_id,
        notification_preferences, onboarding_completed, onboarding_step,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING user_id, email, full_name, tax_filing_status,
                marginal_tax_rate, w2_withholding_annual, primary_platform,
                onboarding_completed, onboarding_step, notification_preferences, created_at`,
      [
        userId,
        input.email.toLowerCase(),
        passwordHash,
        input.full_name,
        input.tax_filing_status || 'single',
        22.00, // Default marginal tax rate
        0.00,  // Default W2 withholding
        input.google_id || null,
        JSON.stringify(DEFAULT_NOTIFICATION_PREFERENCES),
        false, // onboarding_completed
        0,     // onboarding_step
        now,
        now,
      ]
    );

    const user = this.mapToUserPublic(result.rows[0]);
    const tokens = generateTokens(user.user_id, user.email);

    return { user, tokens };
  }

  /**
   * Create or login a user via Google OAuth
   */
  async googleAuth(googlePayload: GoogleOAuthPayload): Promise<{ user: UserPublic; tokens: AuthTokens; isNewUser: boolean }> {
    // Check if user exists by Google ID first
    let result = await query(
      `SELECT user_id, email, full_name, tax_filing_status,
              marginal_tax_rate, w2_withholding_annual, primary_platform,
              onboarding_completed, onboarding_step, notification_preferences, created_at
       FROM users WHERE google_id = $1`,
      [googlePayload.sub]
    );

    if (result.rows.length > 0) {
      // Existing user - update last login and return
      const user = this.mapToUserPublic(result.rows[0]);
      await this.updateLastLogin(user.user_id);
      const tokens = generateTokens(user.user_id, user.email);
      return { user, tokens, isNewUser: false };
    }

    // Check if user exists by email (they registered with email but are now using Google)
    result = await query(
      `SELECT user_id, email, full_name, google_id, tax_filing_status,
              marginal_tax_rate, w2_withholding_annual, primary_platform,
              onboarding_completed, onboarding_step, notification_preferences, created_at
       FROM users WHERE email = $1`,
      [googlePayload.email.toLowerCase()]
    );

    if (result.rows.length > 0) {
      // Link Google account to existing user
      const existingUser = result.rows[0];

      await query(
        `UPDATE users SET google_id = $1, email_verified_at = $2, updated_at = $3
         WHERE user_id = $4`,
        [googlePayload.sub, new Date(), new Date(), existingUser.user_id]
      );

      const user = this.mapToUserPublic({ ...existingUser, google_id: googlePayload.sub });
      await this.updateLastLogin(user.user_id);
      const tokens = generateTokens(user.user_id, user.email);
      return { user, tokens, isNewUser: false };
    }

    // Create new user
    const { user, tokens } = await this.createUser({
      email: googlePayload.email,
      full_name: googlePayload.name,
      google_id: googlePayload.sub,
    });

    // Mark email as verified since it's from Google
    await query(
      'UPDATE users SET email_verified_at = $1 WHERE user_id = $2',
      [new Date(), user.user_id]
    );

    return { user, tokens, isNewUser: true };
  }

  /**
   * Authenticate user with email and password
   */
  async login(email: string, password: string): Promise<{ user: UserPublic; tokens: AuthTokens }> {
    // Find user by email
    const result = await query(
      `SELECT user_id, email, password_hash, full_name, google_id, tax_filing_status,
              marginal_tax_rate, w2_withholding_annual, primary_platform,
              onboarding_completed, onboarding_step, notification_preferences, created_at
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const dbUser = result.rows[0] as User;

    // Check if user has a password (non-OAuth user)
    if (!dbUser.password_hash) {
      throw new UnauthorizedError(
        'This account uses Google Sign-In. Please use the Google login option.'
      );
    }

    // Verify password
    const isValidPassword = await comparePassword(password, dbUser.password_hash);

    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Update last login
    await this.updateLastLogin(dbUser.user_id);

    // Generate tokens
    const tokens = generateTokens(dbUser.user_id, dbUser.email);

    const user = this.mapToUserPublic(dbUser as unknown as Record<string, unknown>);

    return { user, tokens };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify user still exists
    const result = await query(
      'SELECT user_id, email FROM users WHERE user_id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedError('User not found');
    }

    const user = result.rows[0];
    return generateTokens(user.user_id, user.email);
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserPublic> {
    const result = await query(
      `SELECT user_id, email, full_name, tax_filing_status,
              marginal_tax_rate, w2_withholding_annual, primary_platform,
              onboarding_completed, onboarding_step, notification_preferences, created_at
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapToUserPublic(result.rows[0]);
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: UserUpdateInput): Promise<UserPublic> {
    const setClause: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.full_name !== undefined) {
      setClause.push(`full_name = $${paramIndex}`);
      values.push(updates.full_name);
      paramIndex++;
    }

    if (updates.tax_filing_status !== undefined) {
      setClause.push(`tax_filing_status = $${paramIndex}`);
      values.push(updates.tax_filing_status);
      paramIndex++;
    }

    if (updates.marginal_tax_rate !== undefined) {
      setClause.push(`marginal_tax_rate = $${paramIndex}`);
      values.push(updates.marginal_tax_rate);
      paramIndex++;
    }

    if (updates.w2_withholding_annual !== undefined) {
      setClause.push(`w2_withholding_annual = $${paramIndex}`);
      values.push(updates.w2_withholding_annual);
      paramIndex++;
    }

    if (updates.primary_platform !== undefined) {
      setClause.push(`primary_platform = $${paramIndex}`);
      values.push(updates.primary_platform);
      paramIndex++;
    }

    if (updates.onboarding_completed !== undefined) {
      setClause.push(`onboarding_completed = $${paramIndex}`);
      values.push(updates.onboarding_completed);
      paramIndex++;
    }

    if (updates.onboarding_step !== undefined) {
      setClause.push(`onboarding_step = $${paramIndex}`);
      values.push(updates.onboarding_step);
      paramIndex++;
    }

    if (updates.notification_preferences !== undefined) {
      // Get current preferences and merge
      const currentUser = await this.getUserById(userId);
      const mergedPreferences = {
        ...currentUser.notification_preferences,
        ...updates.notification_preferences,
      };
      setClause.push(`notification_preferences = $${paramIndex}`);
      values.push(JSON.stringify(mergedPreferences));
      paramIndex++;
    }

    if (setClause.length === 0) {
      return this.getUserById(userId);
    }

    setClause.push(`updated_at = $${paramIndex}`);
    values.push(new Date());
    paramIndex++;

    values.push(userId);

    const result = await query(
      `UPDATE users SET ${setClause.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING user_id, email, full_name, tax_filing_status,
                 marginal_tax_rate, w2_withholding_annual, primary_platform,
                 onboarding_completed, onboarding_step, notification_preferences, created_at`,
      values
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    return this.mapToUserPublic(result.rows[0]);
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    const currentUser = await this.getUserById(userId);
    const mergedPreferences = {
      ...currentUser.notification_preferences,
      ...preferences,
    };

    await query(
      `UPDATE users SET notification_preferences = $1, updated_at = $2
       WHERE user_id = $3`,
      [JSON.stringify(mergedPreferences), new Date(), userId]
    );

    return mergedPreferences;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    const dbUser = result.rows[0];

    // Check if user has a password (non-OAuth user)
    if (!dbUser.password_hash) {
      throw new BadRequestError(
        'This account uses Google Sign-In and does not have a password to change.'
      );
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, dbUser.password_hash);

    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Hash and update new password
    const newPasswordHash = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE user_id = $3',
      [newPasswordHash, new Date(), userId]
    );
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(email: string): Promise<string> {
    const result = await query(
      'SELECT user_id, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // Always return success message to prevent email enumeration
    if (result.rows.length === 0) {
      // In production, you would still return success but not send email
      // For now, we'll throw an error for testing
      throw new NotFoundError('No account found with this email');
    }

    const user = result.rows[0];

    // Check if user has a password (non-OAuth user)
    if (!user.password_hash) {
      throw new BadRequestError(
        'This account uses Google Sign-In. Please use Google to access your account.'
      );
    }

    const resetToken = generatePasswordResetToken(user.user_id, user.email);

    // In production, send email with reset link
    // For now, return token directly (for testing)
    return resetToken;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const payload = verifyPasswordResetToken(token);

    if (!payload) {
      throw new BadRequestError('Invalid or expired reset token');
    }

    // Verify user still exists
    const result = await query(
      'SELECT user_id FROM users WHERE user_id = $1',
      [payload.userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found');
    }

    // Hash and update password
    const passwordHash = await hashPassword(newPassword);

    await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE user_id = $3',
      [passwordHash, new Date(), payload.userId]
    );
  }

  /**
   * Update last login timestamp
   */
  private async updateLastLogin(userId: string): Promise<void> {
    await query(
      'UPDATE users SET last_login_at = $1, updated_at = $2 WHERE user_id = $3',
      [new Date(), new Date(), userId]
    );
  }

  /**
   * Map database row to UserPublic object
   */
  private mapToUserPublic(row: Record<string, unknown>): UserPublic {
    return {
      user_id: row.user_id as string,
      email: row.email as string,
      full_name: row.full_name as string,
      tax_filing_status: row.tax_filing_status as TaxFilingStatus,
      marginal_tax_rate: parseFloat(row.marginal_tax_rate as string) || 22,
      w2_withholding_annual: parseFloat(row.w2_withholding_annual as string) || 0,
      primary_platform: row.primary_platform as string | null,
      onboarding_completed: row.onboarding_completed as boolean,
      onboarding_step: row.onboarding_step as number,
      notification_preferences: typeof row.notification_preferences === 'string'
        ? JSON.parse(row.notification_preferences)
        : (row.notification_preferences as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFERENCES,
      created_at: new Date(row.created_at as string),
    };
  }
}

export const userService = new UserService();
