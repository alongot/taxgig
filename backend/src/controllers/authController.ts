import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { googleAuthService } from '../services/googleAuthService';
import { AuthRequest, ApiResponse, UserPublic, AuthTokens, NotificationPreferences } from '../types';
import { BadRequestError } from '../utils/errors';

/**
 * Auth controller for handling authentication endpoints
 */
export class AuthController {
  /**
   * POST /api/auth/register
   * Register a new user with email/password
   */
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, full_name, tax_filing_status } = req.body;

      const result = await userService.createUser({
        email,
        password,
        full_name,
        tax_filing_status,
      });

      const response: ApiResponse<{ user: UserPublic; tokens: AuthTokens }> = {
        success: true,
        data: result,
        message: 'Registration successful',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await userService.login(email, password);

      const response: ApiResponse<{ user: UserPublic; tokens: AuthTokens }> = {
        success: true,
        data: result,
        message: 'Login successful',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/google
   * Login or register with Google OAuth
   * Expects: { idToken: string } in request body
   */
  async googleAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        throw new BadRequestError('Google ID token is required');
      }

      // Check if Google OAuth is configured
      if (!googleAuthService.isConfigured()) {
        throw new BadRequestError('Google authentication is not configured');
      }

      // Verify Google token and get user info
      const googlePayload = await googleAuthService.verifyIdToken(idToken);

      // Create or login user
      const result = await userService.googleAuth(googlePayload);

      const response: ApiResponse<{
        user: UserPublic;
        tokens: AuthTokens;
        isNewUser: boolean;
      }> = {
        success: true,
        data: result,
        message: result.isNewUser
          ? 'Account created successfully with Google'
          : 'Login successful with Google',
      };

      res.status(result.isNewUser ? 201 : 200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh
   * Refresh access token using refresh token
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const tokens = await userService.refreshToken(refreshToken);

      const response: ApiResponse<AuthTokens> = {
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Logout user (client should discard tokens)
   */
  async logout(_req: Request, res: Response): Promise<void> {
    // In a more advanced implementation, you might want to:
    // - Blacklist the current token
    // - Clear server-side session if using sessions
    // For JWT-based auth, logout is primarily client-side

    const response: ApiResponse = {
      success: true,
      message: 'Logout successful',
    };

    res.status(200).json(response);
  }

  /**
   * GET /api/auth/me
   * Get current authenticated user
   */
  async me(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const response: ApiResponse<UserPublic> = {
        success: true,
        data: req.user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      const resetToken = await userService.forgotPassword(email);

      // In production, don't return the token - send via email
      const response: ApiResponse<{ resetToken: string }> = {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent',
        data: { resetToken }, // Remove in production
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      await userService.resetPassword(token, password);

      const response: ApiResponse = {
        success: true,
        message: 'Password has been reset successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/change-password
   * Change password for authenticated user
   */
  async changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      await userService.changePassword(req.user.user_id, currentPassword, newPassword);

      const response: ApiResponse = {
        success: true,
        message: 'Password changed successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/notification-settings
   * Get notification settings for authenticated user
   */
  async getNotificationSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        data: req.user.notification_preferences,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/notification-settings
   * Update notification settings for authenticated user
   */
  async updateNotificationSettings(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const preferences = req.body;

      const updatedPreferences = await userService.updateNotificationPreferences(
        req.user.user_id,
        preferences
      );

      const response: ApiResponse<NotificationPreferences> = {
        success: true,
        data: updatedPreferences,
        message: 'Notification settings updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/auth/onboarding
   * Update onboarding status for authenticated user
   */
  async updateOnboarding(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const { onboarding_step, onboarding_completed, primary_platform } = req.body;

      const updatedUser = await userService.updateProfile(req.user.user_id, {
        onboarding_step,
        onboarding_completed,
        primary_platform,
      });

      const response: ApiResponse<UserPublic> = {
        success: true,
        data: updatedUser,
        message: 'Onboarding status updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
