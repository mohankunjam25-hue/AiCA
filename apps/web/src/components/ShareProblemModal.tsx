import React, { useState, useEffect } from 'react';
import { Share2, Copy, Check, X, ExternalLink, Smartphone, MessageCircle } from 'lucide-react';
import { toast } from '../store/useToastStore';

interface ShareProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  problem: {
    id?: string;
    title: string;
    slug?: string;
    difficulty?: string;
    tags?: string[];
  } | null;
}

export function ShareProblemModal({ isOpen, onClose, problem }: ShareProblemModalProps) {
  const [copied, setCopied] = useState(false);
  const canNativeShare = typeof navigator !== 'undefined' && Boolean(navigator.share);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !problem) return null;

  const problemIdentifier = problem.slug || problem.id || '';
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aica.app';
  const shareUrl = `${origin}/workspace/${problemIdentifier}`;

  const whatsappMessage = `🔥 Check out this coding challenge on AiCA:\n*${problem.title}* [${problem.difficulty || 'Challenge'}]\n\n👉 Solve it directly here: ${shareUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      toast.success('Question link copied! Ready to share with friends.');
      setTimeout(() => setCopied(false), 2200);
    } catch {
      toast.error('Failed to copy link to clipboard');
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: `${problem.title} | AiCA Challenge`,
        text: `Check out this problem "${problem.title}" on AiCA!`,
        url: shareUrl
      });
      toast.success('Shared successfully!');
      onClose();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Sharing failed, please use Copy Link instead.');
      }
    }
  };

  const getDifficultyBadge = (difficulty?: string) => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'HARD':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-problem-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#161b22] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="share-problem-title" className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Share Challenge
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Send to friends on WhatsApp or copy direct link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Problem Overview Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0d1117] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                {problem.title}
              </h3>
              {problem.difficulty && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 uppercase tracking-wider ${getDifficultyBadge(problem.difficulty)}`}>
                  {problem.difficulty}
                </span>
              )}
            </div>

            {problem.tags && problem.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {problem.tags.slice(0, 3).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Share Link Input with Copy Action */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Direct Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Problem Share Link"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-100 dark:bg-[#0d1117] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-hidden select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition shrink-0 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Social Share Primary Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {/* WhatsApp Direct Share Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.98] transition cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Share on WhatsApp</span>
              <ExternalLink className="w-3 h-3 opacity-80 ml-auto" />
            </a>

            {/* Native Mobile Share or Copy Alternative */}
            {canNativeShare ? (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition cursor-pointer shadow-2xs"
              >
                <Smartphone className="w-4 h-4" />
                <span>More Options</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-[#21262d] hover:bg-slate-200 dark:hover:bg-[#30363d] border border-slate-200 dark:border-slate-700 active:scale-[0.98] transition cursor-pointer shadow-2xs"
              >
                <Copy className="w-4 h-4" />
                <span>{copied ? 'Link Copied!' : 'Copy to Clipboard'}</span>
              </button>
            )}
          </div>

          {/* Recipient Flow Information Tip */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0d1117]/60 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50 flex items-center gap-2">
            <span className="text-base">💡</span>
            <span>
              Friends opening this link will land directly in this coding environment. New users will be asked to sign in first and seamlessly redirected back.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
