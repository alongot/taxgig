import jwt, { Secret } from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload, AuthTokens } from '../types';

/**
 * Generate access and refresh tokens for a user
 */
export const generateTokens = (userId: string, email: string): AuthTokens => {
  const accessToken = jwt.sign(
    { userId, email, type: 'access' } as TokenPayload,
    config.jwt.secret as Secret,
    { expiresIn: config.jwt.expiresIn } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { userId, email, type: 'refresh' } as TokenPayload,
    config.jwt.refreshSecret as Secret,
    { expiresIn: config.jwt.refreshExpiresIn } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

/**
 * Verify an access token
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as Secret) as TokenPayload;
    if (decoded.type !== 'access') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify a refresh token
 */
export const verifyRefreshToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret as Secret) as TokenPayload;
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

/**
 * Generate a password reset token (expires in 1 hour)
 */
export const generatePasswordResetToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email, type: 'password_reset' },
    config.jwt.secret as Secret,
    { expiresIn: '1h' } as jwt.SignOptions
  );
};

/**
 * Verify a password reset token
 */
export const verifyPasswordResetToken = (token: string): { userId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as Secret) as { userId: string; email: string; type: string };
    if (decoded.type !== 'password_reset') {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    return null;
  }
};
