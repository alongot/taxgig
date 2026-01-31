import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';
import { GoogleOAuthPayload } from '../types';
import { BadRequestError } from '../utils/errors';

/**
 * Google OAuth Service
 * Handles verification of Google OAuth tokens
 */
class GoogleAuthService {
  private client: OAuth2Client;

  constructor() {
    this.client = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret
    );
  }

  /**
   * Verify a Google ID token and extract user information
   * @param idToken - The Google ID token from the client
   * @returns GoogleOAuthPayload with user information
   */
  async verifyIdToken(idToken: string): Promise<GoogleOAuthPayload> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();

      if (!payload) {
        throw new BadRequestError('Invalid Google token: No payload');
      }

      if (!payload.email) {
        throw new BadRequestError('Invalid Google token: No email in payload');
      }

      if (!payload.email_verified) {
        throw new BadRequestError('Google account email is not verified');
      }

      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        given_name: payload.given_name,
        family_name: payload.family_name,
      };
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }

      // Handle specific Google auth errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage.includes('Token used too late') || errorMessage.includes('expired')) {
        throw new BadRequestError('Google token has expired. Please sign in again.');
      }

      if (errorMessage.includes('Wrong recipient') || errorMessage.includes('audience')) {
        throw new BadRequestError('Invalid Google token: Wrong application');
      }

      throw new BadRequestError(`Failed to verify Google token: ${errorMessage}`);
    }
  }

  /**
   * Check if Google OAuth is configured
   * @returns boolean indicating if Google OAuth is available
   */
  isConfigured(): boolean {
    return Boolean(config.google.clientId && config.google.clientSecret);
  }
}

export const googleAuthService = new GoogleAuthService();
