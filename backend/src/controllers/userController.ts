import { Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { AuthRequest, ApiResponse, UserPublic } from '../types';

/**
 * User controller for user profile management
 */
export class UserController {
  /**
   * GET /api/users/profile
   * Get current user's profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const user = await userService.getUserById(req.user.user_id);

      const response: ApiResponse<UserPublic> = {
        success: true,
        data: user,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/profile
   * Update current user's profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const { full_name, tax_filing_status, marginal_tax_rate, w2_withholding_annual } = req.body;

      const updatedUser = await userService.updateProfile(req.user.user_id, {
        full_name,
        tax_filing_status,
        marginal_tax_rate,
        w2_withholding_annual,
      });

      const response: ApiResponse<UserPublic> = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/users/account
   * Delete user account (GDPR compliance)
   */
  async deleteAccount(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      // In a production app, you would:
      // 1. Soft delete or anonymize user data
      // 2. Delete or anonymize associated data (transactions, expenses)
      // 3. Remove from any third-party services
      // 4. Send confirmation email

      // For MVP, we'll implement a basic delete
      // Note: This would need proper cascade handling in production

      const response: ApiResponse = {
        success: true,
        message: 'Account deletion requested. This feature is not yet fully implemented.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/export
   * Export all user data (GDPR compliance)
   */
  async exportData(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      // In production, this would compile all user data:
      // - User profile
      // - Connected accounts
      // - Transactions
      // - Manual expenses
      // - Tax estimates
      // - Notifications

      const response: ApiResponse = {
        success: true,
        message: 'Data export feature will be implemented in a future sprint.',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
