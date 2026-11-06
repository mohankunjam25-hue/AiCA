import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { User } from '@aica/shared';
import { pgPool } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_access_key_min_32_characters_for_security_2026';
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class TokenService {
  /**
   * Generates a short-lived access JWT for API authentication.
   */
  static signAccessToken(user: Partial<User>): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
  }

  /**
   * Generates a cryptographically secure 64-byte random string for refresh token.
   */
  static generateRandomToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Hashes token with SHA-256 for secure database storage.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Creates a new Refresh Token in a new or existing family and stores SHA-256 hash in DB.
   */
  static async createRefreshToken(userId: string, existingFamilyId?: string): Promise<string> {
    const rawToken = this.generateRandomToken();
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await pgPool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, family_id, expires_at)
       VALUES ($1, $2, COALESCE($3::uuid, gen_random_uuid()), $4)`,
      [userId, tokenHash, existingFamilyId || null, expiresAt]
    );

    return rawToken;
  }

  /**
   * Performs Refresh Token Rotation (RTR) with Reuse Detection.
   * If a revoked token is re-submitted, the entire family is invalidated to thwart token theft.
   */
  static async rotateRefreshToken(rawToken: string): Promise<{ accessToken: string; newRefreshToken: string; user: User }> {
    const tokenHash = this.hashToken(rawToken);

    // 1. Look up token in database
    const tokenRes = await pgPool.query(
      `SELECT rt.id, rt.user_id, rt.family_id, rt.expires_at, rt.revoked_at,
              u.id as u_id, u.email, u.username, u.role, u.status, u.auth_provider, u.created_at, u.updated_at
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1
       LIMIT 1`,
      [tokenHash]
    );

    if (tokenRes.rows.length === 0) {
      throw new Error('INVALID_REFRESH_TOKEN: Token not found');
    }

    const row = tokenRes.rows[0];

    // 2. REUSE DETECTION INVARIANT:
    // If token was already revoked, someone is trying to use an old token!
    // Invalidate the ENTIRE token family immediately to protect the legitimate user.
    if (row.revoked_at !== null) {
      await pgPool.query(
        `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE family_id = $1`,
        [row.family_id]
      );
      console.warn(`[SecurityAlert] Refresh token reuse detected for user ${row.user_id}! Revoked family ${row.family_id}`);
      throw new Error('TOKEN_REUSE_DETECTED: Suspicious token reuse. All active sessions have been revoked for your safety.');
    }

    // 3. Expiration Check
    if (new Date(row.expires_at) < new Date()) {
      throw new Error('EXPIRED_REFRESH_TOKEN: Refresh token has expired. Please log in again.');
    }

    // 4. User Status Check
    if (row.status !== 'ACTIVE') {
      throw new Error('ACCOUNT_INACTIVE: Account is suspended or inactive.');
    }

    // 5. Invalidate the consumed token
    await pgPool.query(
      `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [row.id]
    );

    const user: User = {
      id: row.u_id,
      email: row.email,
      username: row.username,
      role: row.role,
      status: row.status,
      authProvider: row.auth_provider,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    // 6. Issue new rotated Refresh Token in the same family
    const newRefreshToken = await this.createRefreshToken(user.id, row.family_id);
    const newAccessToken = this.signAccessToken(user);

    return {
      accessToken: newAccessToken,
      newRefreshToken,
      user
    };
  }

  /**
   * Revokes a specific refresh token (used on logout).
   */
  static async revokeToken(rawToken: string): Promise<void> {
    const tokenHash = this.hashToken(rawToken);
    await pgPool.query(
      `UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = $1`,
      [tokenHash]
    );
  }

  /**
   * Sets secure HttpOnly cookie on express response.
   */
  static setRefreshCookie(res: Response, rawToken: string): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('refreshToken', rawToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/v1/auth',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    });
  }

  /**
   * Clears the refresh token cookie.
   */
  static clearRefreshCookie(res: Response): void {
    const isProd = process.env.NODE_ENV === 'production';
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/api/v1/auth'
    });
  }
}
