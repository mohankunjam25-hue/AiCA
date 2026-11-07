import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface GoogleSignInButtonProps {
  onError?: (errorMessage: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  label?: string;
  redirectUrl?: string;
}

export function GoogleSignInButton({ onError, text = 'signin_with', label, redirectUrl }: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isConfigured = Boolean(googleClientId && googleClientId !== 'your_google_client_id_here');

  const defaultLabel = text === 'signup_with' ? 'Sign up with Google' : 'Sign in with Google';
  const buttonLabel = label || defaultLabel;

  const targetPath = redirectUrl || '/dashboard';

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      onError?.('Google authentication did not provide a credential token');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        credential: credentialResponse.credential
      });

      const { user, profile, accessToken } = res.data.data;
      setAuth(user, accessToken, profile);
      navigate(targetPath);
    } catch (err: any) {
      console.error('[GoogleAuth] Backend verification failed:', err);
      const msg = err.response?.data?.error?.message || 'Google authentication failed. Please try again.';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('[GoogleAuth] Google Sign-In failed or popup was closed');
    onError?.('Google Sign-In initialization failed. Please ensure "http://localhost:5173" is added to "Authorized JavaScript origins" in Google Cloud Console.');
  };

  const handleDevMockLogin = async () => {
    setLoading(true);
    try {
      const devEmail = `developer.${Date.now().toString().slice(-4)}@aica.lab`;
      const res = await api.post('/auth/google', {
        credential: `dev-mock-google-${devEmail}`
      });
      const { user, profile, accessToken } = res.data.data;
      setAuth(user, accessToken, profile);
      navigate(targetPath);
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Dev Google login failed';
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {isConfigured ? (
        <div className="w-full flex justify-center [&>div]:w-full [&>div>iframe]:!w-full [&>div>iframe]:!mx-auto">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            theme="outline"
            shape="rectangular"
            size="large"
            width="340"
            text={text}
          />
        </div>
      ) : import.meta.env.DEV ? (
        <button
          type="button"
          onClick={handleDevMockLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-md bg-white hover:bg-slate-100 active:scale-[0.99] text-slate-700 font-medium text-sm shadow-sm border border-slate-200 transition flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
        >
          {/* Google "G" Logo */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="text-slate-700 font-semibold">
            {loading ? 'Connecting...' : `${buttonLabel} (Dev Mode)`}
          </span>
        </button>
      ) : (
        <div className="w-full py-2 px-3 rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
          Google OAuth is not configured in this environment. Please sign in with email.
        </div>
      )}
    </div>
  );
}
