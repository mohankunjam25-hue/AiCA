import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { GoogleSignInButton } from '../components/GoogleSignInButton';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/register', { email, username, password });
      const { user, accessToken, profile } = res.data.data;
      setAuth(user, accessToken, profile);
      navigate(redirectUrl || '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-[calc(100vh-120px)]">
      <div className="w-full max-w-[420px] px-8 sm:px-10 py-10 rounded-2xl bg-white dark:bg-[#232936] border border-slate-200 dark:border-slate-800/80 shadow-xl dark:shadow-2xl">
        {/* Brand Logo Header */}
        <div className="text-center pb-8 pt-2">
          <h1 className="text-4xl font-extrabold italic tracking-tight text-slate-900 dark:text-white font-sans select-none">
            AiCA
          </h1>
        </div>

        {/* Redirect Notice Banner */}
        {redirectUrl && (
          <div className="mb-6 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Please create an account to access your requested page.</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 dark:text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="relative">
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-[#ee495c] pb-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition text-sm font-sans"
            />
          </div>

          <div className="relative pt-1">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-[#ee495c] pb-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition text-sm font-sans"
            />
          </div>

          <div className="relative pt-1">
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (Min 8 chars, 1 uppercase, 1 digit)"
              className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 focus:border-[#ee495c] pb-2.5 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-400 focus:outline-none transition text-sm font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3 rounded-md bg-[#ee495c] hover:bg-[#e03a4e] active:scale-[0.99] text-white font-bold text-sm tracking-wider uppercase shadow-md transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="w-full border-t border-slate-200 dark:border-slate-700/80" />
          <span className="absolute bg-white dark:bg-[#232936] px-3 text-xs text-slate-500 dark:text-slate-400 font-normal">
            or
          </span>
        </div>

        {/* Google Authentication Button */}
        <GoogleSignInButton
          onError={(msg) => setError(msg)}
          text="signup_with"
          label="Sign up with Google"
          redirectUrl={redirectUrl || undefined}
        />

        {/* Bottom Switcher */}
        <div className="border-t border-slate-200 dark:border-slate-700/80 my-8" />

        <div className="text-center text-xs text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to={redirectUrl ? `/login?redirect=${encodeURIComponent(redirectUrl)}` : '/login'}
            className="text-[#ee495c] hover:text-[#ff6b7e] font-bold uppercase tracking-wide ml-1 transition"
          >
            LOG IN NOW
          </Link>
        </div>
      </div>
    </div>
  );
}
