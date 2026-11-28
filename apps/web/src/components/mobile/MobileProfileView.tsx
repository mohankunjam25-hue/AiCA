import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Edit3,
  Share2,
  Check,
  Award,
  Flame,
  CheckCircle2,
  Clock,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  Laptop,
  Type,
  WrapText,
  Map as MapIcon,
  KeyRound,
  XCircle,
} from 'lucide-react';
import { useEditorPreferencesStore } from '../../store/useEditorPreferencesStore';
import { DynamicBadge } from '../../utils/badgeCalculator';

interface MobileProfileViewProps {
  username: string;
  fullName?: string;
  bio?: string;
  avatarUrl?: string;
  activityStats: { solved: number; total: number; streak: number; longestStreak: number };
  badges: DynamicBadge[];
  submissions: any[];
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  copiedLink: boolean;
  onShare: () => void;
  onOpenEditModal: () => void;
  onLogout: () => void;
  currentPassword: string;
  setCurrentPassword: (v: string) => void;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  passwordStatus: { type: 'success' | 'error'; message: string } | null;
  updatingPassword: boolean;
  onChangePassword: (e: React.FormEvent) => void;
}

export function MobileProfileView({
  username,
  fullName,
  bio,
  avatarUrl,
  activityStats,
  badges,
  submissions,
  theme,
  setTheme,
  copiedLink,
  onShare,
  onOpenEditModal,
  onLogout,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  passwordStatus,
  updatingPassword,
  onChangePassword,
}: MobileProfileViewProps) {
  const [segment, setSegment] = useState<'overview' | 'activity' | 'settings'>('overview');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const fontSize = useEditorPreferencesStore((s) => s.fontSize);
  const setFontSize = useEditorPreferencesStore((s) => s.setFontSize);
  const wordWrap = useEditorPreferencesStore((s) => s.wordWrap);
  const setWordWrap = useEditorPreferencesStore((s) => s.setWordWrap);
  const minimap = useEditorPreferencesStore((s) => s.minimap);
  const setMinimap = useEditorPreferencesStore((s) => s.setMinimap);

  return (
    <div className="md:hidden flex flex-col gap-4 px-3.5 py-4 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3]">
      {/* 1. Compact Profile Header Card */}
      <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-4 shadow-2xs space-y-3">
        <div className="flex items-center gap-3.5">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#2ea043]/40 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-[#2ea043]/15 text-[#1a7f37] dark:text-[#3fb950] font-black text-2xl flex items-center justify-center shrink-0">
              {username.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-base font-extrabold text-[#1f2328] dark:text-[#f0f6fc] truncate">
              {fullName || username}
            </h1>
            <p className="text-xs font-mono text-[#656d76] dark:text-[#848d97] truncate">
              @{username}
            </p>
            {bio && (
              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e] line-clamp-2 mt-1">
                {bio}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onOpenEditModal}
            className="h-9 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button
            type="button"
            onClick={onShare}
            className="h-9 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-[#1a7f37]" /> : <Share2 className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Share'}
          </button>
        </div>
      </div>

      {/* 2. Native Segmented Control */}
      <div className="p-1 rounded-2xl bg-[#eaeef2] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] grid grid-cols-3 gap-1">
        {(['overview', 'activity', 'settings'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setSegment(tab)}
            className={`h-9 rounded-xl text-xs font-bold capitalize transition active:scale-95 ${
              segment === tab
                ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] shadow-xs'
                : 'text-[#656d76] dark:text-[#848d97]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 3. Tab Views */}
      {segment === 'overview' && (
        <div className="space-y-4">
          {/* Horizontal Swipe Stat Cards */}
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5 snap-x">
            <div className="snap-start shrink-0 min-w-[125px] p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
              <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950] mb-1" />
              <div className="text-lg font-black font-mono">{activityStats.solved}</div>
              <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Problems Solved</div>
            </div>
            <div className="snap-start shrink-0 min-w-[125px] p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
              <Flame className="w-4 h-4 text-rose-500 mb-1" />
              <div className="text-lg font-black font-mono">{activityStats.streak}d</div>
              <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Current Streak</div>
            </div>
            <div className="snap-start shrink-0 min-w-[125px] p-3.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d]">
              <Award className="w-4 h-4 text-amber-500 mb-1" />
              <div className="text-lg font-black font-mono">{badges.filter((b) => b.unlocked).length}</div>
              <div className="text-[10px] text-[#656d76] dark:text-[#848d97]">Badges Earned</div>
            </div>
          </div>

          {/* Horizontal Badges Carousel */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Achievement Badges
            </h3>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-3.5 px-3.5">
              {badges.map((badge) => {
                const BadgeIcon = badge.icon;
                return (
                  <div
                    key={badge.id}
                    className={`shrink-0 w-[160px] p-3 rounded-2xl border ${
                      badge.unlocked
                        ? 'bg-white dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d]'
                        : 'bg-[#f6f8fa] dark:bg-[#0d1117] border-[#d0d7de]/50 dark:border-[#30363d]/50 opacity-55'
                    }`}
                  >
                    <div className="mb-1.5">
                      <BadgeIcon className={`w-5 h-5 ${badge.unlocked ? badge.color : 'text-[#8c959f]'}`} />
                    </div>
                    <div className="text-xs font-bold truncate">{badge.name}</div>
                    <div className="text-[10px] text-[#656d76] dark:text-[#848d97] line-clamp-2 mt-0.5">
                      {badge.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {segment === 'activity' && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
            Recent Submissions ({submissions.length})
          </h3>
          {submissions.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-center text-xs text-[#656d76]">
              No submissions recorded yet.
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] overflow-hidden">
              {submissions.slice(0, 15).map((sub) => {
                const isAccepted = sub.verdict === 'ACCEPTED';
                return (
                  <Link
                    key={sub.id}
                    to={`/workspace/${sub.problemSlug || sub.problemId}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 active:bg-[#eaeef2] dark:active:bg-[#21262d] transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isAccepted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950] shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-[#cf222e] dark:text-[#f85149] shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {sub.problemTitle || 'Coding Challenge'}
                        </div>
                        <div className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97] flex items-center gap-2">
                          <span>{sub.language}</span>
                          {sub.executionTimeMs !== undefined && (
                            <span className="flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" /> {sub.executionTimeMs}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#8c959f] shrink-0" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {segment === 'settings' && (
        <div className="space-y-4">
          {/* Appearance List Group */}
          <div className="space-y-1.5">
            <h4 className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Appearance
            </h4>
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] p-2 grid grid-cols-3 gap-1.5">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'Auto', icon: Laptop },
              ].map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id as any)}
                    className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition active:scale-95 ${
                      theme === opt.id
                        ? 'bg-[#0969da]/10 text-[#0969da] dark:text-[#58a6ff] border border-[#0969da]/40'
                        : 'text-[#656d76] dark:text-[#848d97]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Native Toggle List Group for Editor */}
          <div className="space-y-1.5">
            <h4 className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Mobile Code Editor
            </h4>
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <Type className="w-4 h-4 text-[#0969da]" /> Font Size
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.max(11, fontSize - 1))}
                    className="w-8 h-8 rounded-lg bg-[#f6f8fa] dark:bg-[#21262d] font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="font-mono text-xs w-8 text-center">{fontSize}</span>
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.min(20, fontSize + 1))}
                    className="w-8 h-8 rounded-lg bg-[#f6f8fa] dark:bg-[#21262d] font-bold text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <WrapText className="w-4 h-4 text-[#8250df]" /> Word Wrap
                </div>
                <span
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                    wordWrap === 'on' ? 'bg-[#1f883d]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      wordWrap === 'on' ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMinimap(!minimap)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold">
                  <MapIcon className="w-4 h-4 text-amber-500" /> Editor Minimap
                </div>
                <span
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors flex items-center ${
                    minimap ? 'bg-[#1f883d]' : 'bg-[#d0d7de] dark:bg-[#30363d]'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                      minimap ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          {/* Account & Security */}
          <div className="space-y-1.5">
            <h4 className="px-1 text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97]">
              Security & Session
            </h4>
            <div className="rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] divide-y divide-[#d0d7de]/70 dark:divide-[#30363d] overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPasswordForm((prev) => !prev)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-xs font-semibold"
              >
                <span className="flex items-center gap-2.5">
                  <KeyRound className="w-4 h-4 text-[#0969da]" /> Change Password
                </span>
                <ChevronRight className={`w-4 h-4 text-[#8c959f] transition-transform ${showPasswordForm ? 'rotate-90' : ''}`} />
              </button>

              {showPasswordForm && (
                <form onSubmit={onChangePassword} className="p-4 space-y-2.5 bg-[#f6f8fa] dark:bg-[#0d1117]">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full h-10 px-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs"
                  />
                  {passwordStatus && (
                    <p className={`text-[11px] font-semibold ${passwordStatus.type === 'success' ? 'text-[#1a7f37]' : 'text-[#cf222e]'}`}>
                      {passwordStatus.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={updatingPassword}
                    className="w-full h-10 rounded-xl bg-[#0969da] text-white text-xs font-bold"
                  >
                    {updatingPassword ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={onLogout}
                className="w-full px-4 py-3.5 flex items-center gap-2.5 text-xs font-bold text-[#cf222e] dark:text-[#f85149] active:bg-[#ffebe9] dark:active:bg-[#f851491a]"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
