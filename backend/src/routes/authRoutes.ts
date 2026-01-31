import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  handleValidationErrors,
  notificationPreferencesValidation,
  onboardingValidation,
} from '../middleware/validation';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with email/password
 * @access  Public
 */
router.post(
  '/register',
  registerValidation,
  handleValidationErrors,
  authController.register.bind(authController)
);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and password
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  handleValidationErrors,
  authController.login.bind(authController)
);

/**
 * @route   POST /api/auth/google
 * @desc    Login or register with Google OAuth
 * @access  Public
 * @body    { idToken: string }
 */
router.post(
  '/google',
  authController.googleAuth.bind(authController)
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken.bind(authController));

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post('/logout', authController.logout.bind(authController));

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, authController.me.bind(authController));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  forgotPasswordValidation,
  handleValidationErrors,
  authController.forgotPassword.bind(authController)
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  resetPasswordValidation,
  handleValidationErrors,
  authController.resetPassword.bind(authController)
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword.bind(authController));

/**
 * @route   GET /api/auth/notification-settings
 * @desc    Get notification settings for authenticated user
 * @access  Private
 */
router.get(
  '/notification-settings',
  authenticate,
  authController.getNotificationSettings.bind(authController)
);

/**
 * @route   PUT /api/auth/notification-settings
 * @desc    Update notification settings for authenticated user
 * @access  Private
 */
router.put(
  '/notification-settings',
  authenticate,
  notificationPreferencesValidation,
  handleValidationErrors,
  authController.updateNotificationSettings.bind(authController)
);

/**
 * @route   PUT /api/auth/onboarding
 * @desc    Update onboarding status for authenticated user
 * @access  Private
 */
router.put(
  '/onboarding',
  authenticate,
  onboardingValidation,
  handleValidationErrors,
  authController.updateOnboarding.bind(authController)
);

export default router;
