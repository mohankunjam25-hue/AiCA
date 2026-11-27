import { create } from 'zustand';
import axios from 'axios';
import { User, UserProfile } from '@aica/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/v1`
  : '/api/v1';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isStudentPreviewMode: boolean;
  initAuth: () => Promise<void>;
  setAuth: (user: User, token: string, profile?: UserProfile | null) => void;
  setAccessToken: (token: string) => void;
  setStudentPreviewMode: (enabled: boolean) => void;
  updateProfile: (updatedProfile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedUser = localStorage.getItem('aica_user');
  const savedProfile = localStorage.getItem('aica_profile');
  const savedPreview = localStorage.getItem('aica_student_preview') === 'true';

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    profile: savedProfile ? JSON.parse(savedProfile) : null,
    // Access token is strictly in-memory (never persisted to localStorage for XSS immunity)
    accessToken: null,
    isAuthenticated: false,
    isInitializing: true,
    isStudentPreviewMode: savedPreview,

    /**
     * Silent fast-path background rehydration.
     * Hits /api/v1/auth/refresh with HttpOnly cookie to acquire an in-memory access token.
     */
    initAuth: async () => {
      try {
        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        if (res.data?.data?.accessToken && res.data?.data?.user) {
          const { accessToken, user } = res.data.data;
          localStorage.setItem('aica_user', JSON.stringify(user));
          set({
            accessToken,
            user,
            isAuthenticated: true,
            isInitializing: false
          });
          return;
        }
      } catch {
        // No active session or expired cookie
      }
      set({
        accessToken: null,
        user: null,
        profile: null,
        isAuthenticated: false,
        isInitializing: false
      });
      localStorage.removeItem('aica_user');
      localStorage.removeItem('aica_profile');
    },

    setStudentPreviewMode: (enabled: boolean) => {
      localStorage.setItem('aica_student_preview', String(enabled));
      set({ isStudentPreviewMode: enabled });
    },

    setAuth: (user, token, profile) => {
      // Sensitive JWT is stored strictly in memory
      localStorage.setItem('aica_user', JSON.stringify(user));
      if (profile) {
        localStorage.setItem('aica_profile', JSON.stringify(profile));
      }
      set({
        user,
        profile: profile || null,
        accessToken: token,
        isAuthenticated: true,
        isInitializing: false
      });
    },

    setAccessToken: (token) => {
      set({ accessToken: token, isAuthenticated: true, isInitializing: false });
    },

    updateProfile: (updated) => {
      set((state) => {
        const newProfile = state.profile
          ? { ...state.profile, ...updated }
          : ({ ...updated } as UserProfile);
        localStorage.setItem('aica_profile', JSON.stringify(newProfile));
        return { profile: newProfile };
      });
    },

    logout: () => {
      localStorage.removeItem('aica_user');
      localStorage.removeItem('aica_profile');
      localStorage.removeItem('aica_student_preview');
      set({
        user: null,
        profile: null,
        accessToken: null,
        isAuthenticated: false,
        isInitializing: false,
        isStudentPreviewMode: false
      });
      // Fire-and-forget server cookie clearance
      axios.post(`${API_BASE_URL}/auth/logout`, {}, { withCredentials: true }).catch(() => {});
    }
  };
});
