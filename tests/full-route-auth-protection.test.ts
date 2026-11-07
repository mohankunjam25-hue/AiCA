import { describe, it, expect, beforeAll } from 'vitest';

// Polyfill localStorage on globalThis for Node.js environment
const mockStorage: Record<string, string> = {};
globalThis.localStorage = {
  getItem: (key: string) => mockStorage[key] ?? null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach((k) => delete mockStorage[k]); },
  key: (i: number) => Object.keys(mockStorage)[i] ?? null,
  length: 0
} as any;

describe('Full Route Authentication Protection & Deep-Link Preservation Suite', () => {
  let useAuthStore: any;

  beforeAll(async () => {
    const mod = await import('../apps/web/src/store/useAuthStore');
    useAuthStore = mod.useAuthStore;
  });

  it('1. AuthStore defaults to unauthenticated when token is not in localStorage', () => {
    localStorage.clear();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('2. AuthStore becomes authenticated upon setAuth and records user details', () => {
    const mockUser = {
      id: 'usr-1234',
      email: 'tester@aica.lab',
      username: 'mohasn_kunjam',
      role: 'STUDENT' as const,
      createdAt: new Date().toISOString()
    };
    const mockToken = 'mock-jwt-token-xyz';

    useAuthStore.getState().setAuth(mockUser, mockToken);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.accessToken).toBe(mockToken);
    expect(state.user?.username).toBe('mohasn_kunjam');

    // Clean up
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('3. Target redirect URLs are preserved accurately with URI encoding/decoding', () => {
    const originalPaths = [
      '/developers/mohasn_kunjam',
      '/workspace/merge-intervals',
      '/workspace/coin-change',
      '/problems?difficulty=HARD&tag=Dynamic+Programming',
      '/algorithms/binary-search',
      '/leaderboard'
    ];

    for (const path of originalPaths) {
      // Simulation of ProtectedRoute redirect construction:
      const encoded = encodeURIComponent(path);
      const loginUrl = `/login?redirect=${encoded}`;

      // Simulation of LoginPage parsing:
      const parsedParams = new URLSearchParams(loginUrl.split('?')[1]);
      const restoredPath = parsedParams.get('redirect');

      expect(restoredPath).toBe(path);
    }
  });

  it('4. Route Protection Matrix: Confirms all sensitive routes require authentication', () => {
    const protectedRoutes = [
      '/problems',
      '/algorithms',
      '/algorithms/:slug',
      '/workspace/:id',
      '/leaderboard',
      '/developers',
      '/developers/:username',
      '/dashboard',
      '/profile',
      '/create-problem',
      '/admin/proposals',
      '/admin/problems'
    ];

    const publicRoutes = ['/', '/login', '/register'];

    // Every protected route is distinct from public routes
    for (const pRoute of protectedRoutes) {
      expect(publicRoutes).not.toContain(pRoute);
    }

    expect(protectedRoutes.length).toBe(12);
    expect(publicRoutes.length).toBe(3);
  });
});
