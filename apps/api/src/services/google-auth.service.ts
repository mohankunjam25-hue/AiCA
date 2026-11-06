import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

export interface VerifiedGoogleUser {
  googleId: string;
  email: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
}

// Singleton OAuth2Client instance to preserve in-memory JWKS public key cache
// This reduces token verification latency from ~1000ms network roundtrip to <1ms in-memory crypto validation
const googleClientId = process.env.GOOGLE_CLIENT_ID || undefined;
const singletonOAuthClient = new OAuth2Client(googleClientId);

export class GoogleAuthService {
  /**
   * Cryptographically verifies Google ID Token using cached JWKS certs.
   * Enforces email_verified === true and audience matching.
   */
  static async verifyCredential(credentialToken: string): Promise<VerifiedGoogleUser> {
    if (!credentialToken || typeof credentialToken !== 'string') {
      throw new Error('Google credential token is missing or malformed');
    }

    // 1. Production / Authenticated verification path
    try {
      const ticket = await singletonOAuthClient.verifyIdToken({
        idToken: credentialToken,
        audience: googleClientId || undefined
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        throw new Error('Google ID token payload is missing subject or email');
      }

      // Strict Security Invariant: Ensure email is verified by Google
      if (payload.email_verified !== true) {
        throw new Error('Google account email has not been verified. Please verify your email with Google.');
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase().trim(),
        name: payload.name,
        picture: payload.picture,
        emailVerified: true
      };
    } catch (verifyErr: any) {
      // 2. Controlled Development Fallback ONLY if explicitly enabled
      const isDev = process.env.NODE_ENV !== 'production';
      const allowDevBypass = process.env.ALLOW_DEV_AUTH_BYPASS === 'true';

      if (isDev && allowDevBypass && credentialToken.startsWith('dev-mock-google-')) {
        const mockEmail = credentialToken.replace('dev-mock-google-', '').trim().toLowerCase() || 'developer@aica.lab';
        return {
          googleId: `dev-sub-${Buffer.from(mockEmail).toString('hex').slice(0, 16)}`,
          email: mockEmail,
          name: mockEmail.split('@')[0],
          picture: `https://api.dicebear.com/7.x/identicon/svg?seed=${mockEmail}`,
          emailVerified: true
        };
      }

      console.warn('[GoogleAuthService] Cryptographic verification failed:', verifyErr.message);
      throw new Error(verifyErr.message || 'Invalid or expired Google credential token');
    }
  }
}
