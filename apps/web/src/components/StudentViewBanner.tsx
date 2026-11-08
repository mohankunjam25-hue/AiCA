import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export function StudentViewBanner() {
  const { user, isStudentPreviewMode, setStudentPreviewMode } = useAuthStore();
  const navigate = useNavigate();

  const isStaff = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  if (!isStaff || !isStudentPreviewMode) {
    return null;
  }

  const handleReturnToAdmin = () => {
    setStudentPreviewMode(false);
    navigate('/admin/dashboard');
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white px-4 py-2 text-xs font-sans shadow-md border-b border-purple-500/30 flex items-center justify-between sticky top-0 z-50 transition-all">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
          <Eye className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-bold text-purple-200 mr-1.5">Student Preview Mode Active:</span>
          <span className="text-slate-300 hidden sm:inline">
            You are browsing the platform from a student perspective.
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleReturnToAdmin}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition cursor-pointer shrink-0 shadow-2xs hover:border-purple-300"
      >
        <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
        <span>Return to Admin Console</span>
        <ArrowRight className="w-3 h-3 text-purple-300" />
      </button>
    </div>
  );
}
