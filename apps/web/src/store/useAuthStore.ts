import { create } from 'zustand';
import { User, UserProfile } from '@aica/shared';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, profile?: UserProfile) => void;
  setAccessToken: (token: string) => void;
  updateProfile: (updatedProfile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedToken = localStorage.getItem('aica_token');
  const savedUser = localStorage.getItem('aica_user');
  const savedProfile = localStorage.getItem('aica_profile');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    profile: savedProfile ? JSON.parse(savedProfile) : null,
    accessToken: savedToken,
    isAuthenticated: Boolean(savedToken),

    setAuth: (user, token, profile) => {
      localStorage.setItem('aica_token', token);
      localStorage.setItem('aica_user', JSON.stringify(user));
      if (profile) {
        localStorage.setItem('aica_profile', JSON.stringify(profile));
      }
      set({
        user,
        profile: profile || null,
        accessToken: token,
        isAuthenticated: true
      });
    },

    setAccessToken: (token) => {
      localStorage.setItem('aica_token', token);
      set({ accessToken: token, isAuthenticated: true });
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
      localStorage.removeItem('aica_token');
      localStorage.removeItem('aica_user');
      localStorage.removeItem('aica_profile');
      set({
        user: null,
        profile: null,
        accessToken: null,
        isAuthenticated: false
      });
    }
  };
});
