import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { updateProfileValidation, handleValidationErrors } from '../middleware/validation';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', userController.getProfile.bind(userController));

/**
 * @route   PATCH /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.patch(
  '/profile',
  updateProfileValidation,
  handleValidationErrors,
  userController.updateProfile.bind(userController)
);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/account', userController.deleteAccount.bind(userController));

/**
 * @route   GET /api/users/export
 * @desc    Export all user data
 * @access  Private
 */
router.get('/export', userController.exportData.bind(userController));

export default router;
