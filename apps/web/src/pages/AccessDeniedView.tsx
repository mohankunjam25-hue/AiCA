import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, BookOpen, Lock } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { UserRole } from '@aica/shared';

interface AccessDeniedViewProps {
  requiredRoles?: UserRole[];
  currentRole?: UserRole;
}

export function AccessDeniedView({
  requiredRoles = ['ADMIN', 'INSTRUCTOR'],
  currentRole
}: AccessDeniedViewProps) {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const activeRole = currentRole || user?.role || 'STUDENT';

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] flex items-center justify-center px-4 py-16 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-6 sm:p-8 text-center shadow-sm space-y-5">
        {/* Shield Icon Pill */}
        <div className="w-14 h-14 rounded-2xl bg-[#ffebe9] dark:bg-[#f8514926] border border-[#ff818266] dark:border-[#f851494d] flex items-center justify-center mx-auto text-[#cf222e] dark:text-[#f85149]">
          <ShieldAlert className="w-7 h-7" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#8b949e] border border-[#d0d7de] dark:border-[#30363d]">
            HTTP 403 Forbidden
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
            Access Restricted
          </h1>
          <p className="text-xs sm:text-sm text-[#57606a] dark:text-[#8b949e] leading-relaxed">
            This module requires <strong className="text-[#1f2328] dark:text-[#f0f6fc]">{requiredRoles.join(' or ')}</strong> privileges.
          </p>
        </div>

        {/* Role Comparison Badge */}
        <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/70 dark:border-[#30363d] text-xs flex items-center justify-between">
          <span className="text-[#57606a] dark:text-[#8b949e]">Your Current Role:</span>
          <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff66] dark:border-[#388bfd4d]">
            {activeRole}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0969da] hover:bg-[#0854b0] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Daily Hub</span>
          </Link>

          <Link
            to="/problems"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse Problems</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
