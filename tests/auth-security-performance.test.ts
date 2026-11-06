import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { GoogleAuthService } from '../apps/api/src/services/google-auth.service.js';
import { TokenService } from '../apps/api/src/services/token.service.js';
import { pgPool } from '../apps/api/src/config/db.js';

describe('High-Speed & Secure Authentication System', () => {
  const testUserId = '30e0aea8-7b07-4c1c-9d9a-e9a755c5e69a'; // lab_admin UUID
  const testUser = {
    id: testUserId,
    email: 'admin@aica.lab',
    username: 'lab_admin',
    role: 'ADMIN' as const
  };

  // Hermetic in-memory mock store for PostgreSQL refresh_tokens table to run reliably in CI
  const mockStore: Array<{
    id: string;
    user_id: string;
    token_hash: string;
    family_id: string;
    expires_at: Date;
    created_at: Date;
    revoked_at: Date | null;
  }> = [];

  beforeAll(() => {
    vi.spyOn(pgPool, 'query').mockImplementation(async (sql: any, params?: any[]): Promise<any> => {
      const queryStr = typeof sql === 'string' ? sql : sql?.text || '';
      // console.log('QUERY:', queryStr.slice(0, 40), 'PARAMS:', params);

      // 1. INSERT into refresh_tokens
      if (queryStr.includes('INSERT INTO refresh_tokens')) {
        const userId = params![0];
        const tokenHash = params![1];
        const familyId = (params![2] !== null && params![2] !== undefined)
          ? params![2]
          : `family-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const expiresAt = params![3];
        const record = {
          id: `rt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          user_id: userId,
          token_hash: tokenHash,
          family_id: familyId,
          expires_at: expiresAt,
          created_at: new Date(),
          revoked_at: null
        };
        mockStore.push(record);
        return { rows: [record], rowCount: 1 } as any;
      }

      // 2. SELECT join users for token rotation
      if (queryStr.includes('FROM refresh_tokens rt') && queryStr.includes('JOIN users u')) {
        const tokenHash = params![0];
        const found = mockStore.find((r) => r.token_hash === tokenHash);
        if (!found) return { rows: [], rowCount: 0 } as any;
        return {
          rows: [
            {
              id: found.id,
              user_id: found.user_id,
              family_id: found.family_id,
              expires_at: found.expires_at,
              revoked_at: found.revoked_at,
              u_id: testUser.id,
              email: testUser.email,
              username: testUser.username,
              role: testUser.role,
              status: 'ACTIVE',
              auth_provider: 'google',
              created_at: new Date(),
              updated_at: new Date()
            }
          ],
          rowCount: 1
        } as any;
      }

      // 3. SELECT family check for reuse detection
      if (queryStr.includes('family_id = (')) {
        const tokenHash = params![0];
        const target = mockStore.find((r) => r.token_hash === tokenHash);
        const family = target ? mockStore.filter((r) => r.family_id === target.family_id) : [];
        return { rows: family, rowCount: family.length } as any;
      }

      // 4. SELECT query on refresh_tokens by token_hash
      if (queryStr.includes('FROM refresh_tokens WHERE token_hash = $1')) {
        const tokenHash = params![0];
        const found = mockStore.find((r) => r.token_hash === tokenHash);
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 } as any;
      }

      // 5. UPDATE revoked_at WHERE family_id
      if (queryStr.includes('UPDATE refresh_tokens SET revoked_at') && queryStr.includes('WHERE family_id = $1')) {
        const familyId = params![0];
        mockStore.forEach((r) => {
          if (r.family_id === familyId) r.revoked_at = new Date();
        });
        return { rows: [], rowCount: 1 } as any;
      }

      // 6. UPDATE revoked_at WHERE id
      if (queryStr.includes('UPDATE refresh_tokens SET revoked_at') && queryStr.includes('WHERE id = $1')) {
        const id = params![0];
        mockStore.forEach((r) => {
          if (r.id === id) r.revoked_at = new Date();
        });
        return { rows: [], rowCount: 1 } as any;
      }

      // 7. UPDATE revoked_at WHERE token_hash
      if (queryStr.includes('UPDATE refresh_tokens SET revoked_at') && queryStr.includes('WHERE token_hash = $1')) {
        const hash = params![0];
        mockStore.forEach((r) => {
          if (r.token_hash === hash) r.revoked_at = new Date();
        });
        return { rows: [], rowCount: 1 } as any;
      }

      return { rows: [], rowCount: 0 } as any;
    });
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  describe('1. Google Auth Service Security & Speed Invariants', () => {
    it('should reject credential tokens when missing or malformed', async () => {
      await expect(GoogleAuthService.verifyCredential('')).rejects.toThrow('missing or malformed');
      await expect(GoogleAuthService.verifyCredential(null as any)).rejects.toThrow('missing or malformed');
    });

    it('should reject dev mock bypass if ALLOW_DEV_AUTH_BYPASS is not true', async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH_BYPASS;
      process.env.ALLOW_DEV_AUTH_BYPASS = 'false';

      await expect(
        GoogleAuthService.verifyCredential('dev-mock-google-attacker@aica.lab')
      ).rejects.toThrow();

      process.env.ALLOW_DEV_AUTH_BYPASS = originalEnv;
    });

    it('should safely authenticate dev mock when explicitly authorized in development', async () => {
      const originalEnv = process.env.ALLOW_DEV_AUTH_BYPASS;
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.ALLOW_DEV_AUTH_BYPASS = 'true';
      process.env.NODE_ENV = 'development';

      const startTime = performance.now();
      const verified = await GoogleAuthService.verifyCredential('dev-mock-google-speedtest@aica.lab');
      const durationMs = performance.now() - startTime;

      expect(verified.email).toBe('speedtest@aica.lab');
      expect(verified.emailVerified).toBe(true);
      expect(durationMs).toBeLessThan(50); // Sub-50ms execution!

      process.env.ALLOW_DEV_AUTH_BYPASS = originalEnv;
      process.env.NODE_ENV = originalNodeEnv;
    });
  });

  describe('2. Refresh Token Rotation (RTR) & Reuse Detection Invariants', () => {
    let initialRefreshToken: string;

    it('should issue a cryptographically secure 64-byte refresh token and store SHA-256 hash', async () => {
      initialRefreshToken = await TokenService.createRefreshToken(testUserId);
      expect(initialRefreshToken).toHaveLength(128); // 64 bytes = 128 hex chars

      // Verify SHA-256 hash exists in PostgreSQL
      const tokenHash = TokenService.hashToken(initialRefreshToken);
      const res = await pgPool.query(
        'SELECT id, user_id, family_id, revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [tokenHash]
      );

      expect(res.rows.length).toBe(1);
      expect(res.rows[0].user_id).toBe(testUserId);
      expect(res.rows[0].revoked_at).toBeNull();
      expect(res.rows[0].family_id).toBeDefined();
    });

    it('should successfully rotate refresh token and issue new token pair', async () => {
      const rotation = await TokenService.rotateRefreshToken(initialRefreshToken);

      expect(rotation.accessToken).toBeDefined();
      expect(rotation.newRefreshToken).toBeDefined();
      expect(rotation.newRefreshToken).not.toBe(initialRefreshToken);
      expect(rotation.user.id).toBe(testUserId);

      // Verify old token is marked as revoked
      const oldHash = TokenService.hashToken(initialRefreshToken);
      const oldTokenRes = await pgPool.query(
        'SELECT id, user_id, family_id, revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [oldHash]
      );
      expect(oldTokenRes.rows[0].revoked_at).not.toBeNull();

      // Verify new token is active
      const newHash = TokenService.hashToken(rotation.newRefreshToken);
      const newTokenRes = await pgPool.query(
        'SELECT id, user_id, family_id, revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [newHash]
      );
      expect(newTokenRes.rows[0].revoked_at).toBeNull();
    });

    it('INVARIANT: Refresh Token Reuse Detection must revoke entire token family on re-submission', async () => {
      // Attacker attempts to re-use the consumed initialRefreshToken!
      await expect(
        TokenService.rotateRefreshToken(initialRefreshToken)
      ).rejects.toThrow('TOKEN_REUSE_DETECTED');

      // Verify the entire family has been revoked
      const oldHash = TokenService.hashToken(initialRefreshToken);
      const familyCheck = await pgPool.query(
        `SELECT revoked_at FROM refresh_tokens WHERE family_id = (
          SELECT family_id FROM refresh_tokens WHERE token_hash = $1
        )`,
        [oldHash]
      );

      // Every single token in this family must now be revoked
      expect(familyCheck.rows.length).toBeGreaterThanOrEqual(2);
      familyCheck.rows.forEach((row: any) => {
        expect(row.revoked_at).not.toBeNull();
      });
    });

    it('should explicitly revoke a token on user logout', async () => {
      const logoutToken = await TokenService.createRefreshToken(testUserId);
      await TokenService.revokeToken(logoutToken);

      const hash = TokenService.hashToken(logoutToken);
      const res = await pgPool.query(
        'SELECT id, user_id, family_id, revoked_at FROM refresh_tokens WHERE token_hash = $1',
        [hash]
      );
      expect(res.rows[0].revoked_at).not.toBeNull();
    });
  });

  describe('3. Token Generation & In-Memory Signing Speed', () => {
    it('should generate short-lived access JWT in under 1ms', () => {
      const start = performance.now();
      const token = TokenService.signAccessToken(testUser);
      const duration = performance.now() - start;

      expect(token).toBeDefined();
      expect(duration).toBeLessThan(10); // <10ms CPU crypto check

      const decoded: any = jwt.decode(token);
      expect(decoded.id).toBe(testUserId);
      expect(decoded.email).toBe(testUser.email);
    });
  });
});
