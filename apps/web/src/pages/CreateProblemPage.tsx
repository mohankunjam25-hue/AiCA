import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Bot,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Cpu,
  RefreshCw,
  Terminal,
  Code2,
  FileCheck,
  PenTool,
  Sparkles
} from 'lucide-react';
import {
  ProblemProposal,
  ProposalStatus,
  ProblemProposalClarification
} from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { ProblemAuthoringStudio } from '../components/ProblemAuthoringStudio';

const QUICK_PROMPTS = [
  '🏢 FAANG: Given an integer array nums and an integer k, return the total number of continuous subarrays whose sum equals to k in O(n) time.',
  '🏢 Google L5: Given a grid with obstacles, find the shortest path from top-left to bottom-right eliminating at most k obstacles.',
  '🏢 Amazon: Given an array of strings words and an integer k, return the k most frequent strings sorted by frequency and lexicographical order.',
  '🏢 Meta: Serialize and deserialize an N-ary tree with compact bracket notation, ensuring linear time and space.',
  '🏢 Apple: Design a Time-Based Key-Value Store with TTL expiration and binary-search timestamp lookups.'
];

const STAGES: { key: string; label: string; description: string }[] = [
  { key: 'QUEUED_FOR_GENERATION', label: '1. Ingestion', description: 'Queued in BullMQ worker' },
  { key: 'AI_ANALYZING', label: '2. Ambiguity Check', description: 'AI checking requirements & constraints' },
  { key: 'AWAITING_CLARIFICATION', label: '3. Clarification', description: 'Interactive student questionnaire' },
  { key: 'GENERATED', label: '4. Synthesis', description: 'Drafting statement, tests & dual oracles' },
  { key: 'VALIDATING', label: '5. Dual Sandbox', description: 'Differential execution in Judge0 sandboxes' },
  { key: 'PENDING_REVIEW', label: '6. Review Ready', description: 'Validated & awaiting instructor approval' }
];

export function CreateProblemPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creationMode, setCreationMode] = useState<'manual' | 'ai'>(
    searchParams.get('mode') === 'ai' ? 'ai' : 'manual'
  );

  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingInstantPractice, setIsGeneratingInstantPractice] = useState(false);
  const [instantSuccessProblem, setInstantSuccessProblem] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeProposal, setActiveProposal] = useState<ProblemProposal | null>(null);
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<string, string>>({});
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);
  const [activeTab, setActiveTab] = useState<'statement' | 'validation' | 'tests'>('statement');

  const pollIntervalRef = useRef<any>(null);

  // Require authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/create-problem');
    }
  }, [isAuthenticated, navigate]);

  // Polling for proposal status updates
  useEffect(() => {
    if (!activeProposal) return;
    const proposalId = activeProposal.id || (activeProposal as any).proposalId;
    if (!proposalId || proposalId === 'undefined') return;

    const terminalStatuses: ProposalStatus[] = [
      'AWAITING_CLARIFICATION',
      'PENDING_REVIEW',
      'PUBLISHED',
      'REJECTED',
      'VALIDATION_FAILED'
    ];

    let failureCount = 0;

    const poll = async () => {
      try {
        const res = await api.get(`/problem-proposals/${proposalId}`);
        const updated: ProblemProposal = res.data.data;
        setActiveProposal(updated);
        failureCount = 0; // reset on success

        // Pre-fill existing answers if in clarification state
        if (updated.status === 'AWAITING_CLARIFICATION' && updated.clarifications) {
          const initialAnswers: Record<string, string> = {};
          updated.clarifications.forEach((c) => {
            if (c.userAnswer) initialAnswers[c.id] = c.userAnswer;
          });
          setClarificationAnswers((prev) => ({ ...initialAnswers, ...prev }));
        }

        if (terminalStatuses.includes(updated.status)) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err: any) {
        failureCount++;
        console.warn(`[Polling] Attempt ${failureCount} failed:`, err.message);
        if (failureCount >= 6) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setError('Lost connection while tracking problem evaluation. Please refresh to check status.');
        }
      }
    };

    // If currently running an async worker stage, keep polling every 2.5s
    if (!terminalStatuses.includes(activeProposal.status)) {
      pollIntervalRef.current = setInterval(poll, 2500);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [activeProposal?.id, (activeProposal as any)?.proposalId, activeProposal?.status]);

  const handleInstantAIPractice = async () => {
    if (!prompt.trim() || prompt.length < 10) {
      setError('Please provide a detailed question idea of at least 10 characters.');
      return;
    }

    setError(null);
    setIsGeneratingInstantPractice(true);

    try {
      const res = await api.post('/problems/practice/ai-generate', { prompt: prompt.trim() });
      const created = res.data.data;
      setInstantSuccessProblem(created);
      setTimeout(() => {
        navigate(`/workspace/${created.slug || created.id}`);
      }, 1000);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to generate instant practice problem. You can also craft it directly using the Manual Authoring Studio.'
      );
    } finally {
      setIsGeneratingInstantPractice(false);
    }
  };

  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || prompt.length < 10) {
      setError('Please provide a detailed question idea of at least 10 characters.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await api.post('/problem-proposals', { prompt: prompt.trim() });
      const proposalPayload = res.data.data;
      const effectiveId = proposalPayload.id || proposalPayload.proposalId;
      setActiveProposal({
        ...proposalPayload,
        id: effectiveId
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit problem idea. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProposal) return;

    if (Object.keys(clarificationAnswers).length === 0) {
      setError('Please answer at least one clarification question.');
      return;
    }

    const proposalId = activeProposal.id || (activeProposal as any).proposalId;
    if (!proposalId || proposalId === 'undefined') {
      setError('Invalid proposal reference. Please refresh and try again.');
      return;
    }

    setIsSubmittingClarification(true);
    setError(null);

    try {
      const res = await api.post(`/problem-proposals/${proposalId}/clarify`, {
        answers: clarificationAnswers
      });
      const proposalPayload = res.data.data;
      setActiveProposal({
        ...proposalPayload,
        id: proposalPayload.id || proposalPayload.proposalId || proposalId
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit answers.');
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  const getStageStatus = (stageKey: string): 'completed' | 'active' | 'upcoming' | 'error' => {
    if (!activeProposal) return 'upcoming';

    const order = [
      'QUEUED_FOR_GENERATION',
      'AI_ANALYZING',
      'AWAITING_CLARIFICATION',
      'GENERATED',
      'VALIDATING',
      'PENDING_REVIEW'
    ];

    if (activeProposal.status === 'VALIDATION_FAILED' && stageKey === 'VALIDATING') {
      return 'error';
    }

    const currentIndex = order.indexOf(activeProposal.status);
    const stageIndex = order.indexOf(stageKey);

    if (currentIndex === -1) {
      if (activeProposal.status === 'PUBLISHED') return 'completed';
      return 'upcoming';
    }

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Curriculum Authoring
            </span>
            <span className="text-xs font-mono text-slate-400">Zero-Leakage Sandbox</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Problem Creation Studio
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Design curriculum questions manually with full control, or let the AI synthesizer generate dual-oracle test suites.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-xs self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              setCreationMode('manual');
              setSearchParams({});
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              creationMode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Manual Authoring Studio</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCreationMode('ai');
              setSearchParams({ mode: 'ai' });
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              creationMode === 'ai'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Auto-Generator</span>
          </button>
        </div>
      </div>

      {/* Mode 1: Manual Authoring Studio */}
      {creationMode === 'manual' ? (
        <ProblemAuthoringStudio
          isStandalone={true}
          onSuccess={(saved) => navigate(`/workspace/${saved.slug || saved.id}`)}
        />
      ) : (
        /* Mode 2: AI Pipeline Generator */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-emerald-600" />
              Submit Problem Description
            </h2>

            <form onSubmit={handleSubmitPrompt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Your Problem Idea (Plain English)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={5}
                  placeholder="e.g. Write a program to find the second highest number in a list of integers without sorting, handling edge cases where all numbers are identical..."
                  className="w-full text-sm rounded-xl border border-slate-300 p-3.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition resize-none text-slate-800 placeholder-slate-400"
                  disabled={isSubmitting || (activeProposal !== null && activeProposal.status !== 'VALIDATION_FAILED')}
                />
              </div>

              {/* Quick Prompt Chips */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                  Or select a starter template:
                </span>
                <div className="flex flex-col gap-2">
                  {QUICK_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPrompt(qp)}
                      className="text-left text-xs p-2.5 rounded-lg bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 hover:border-emerald-300 text-slate-700 transition"
                      disabled={isSubmitting || (activeProposal !== null && activeProposal.status !== 'VALIDATION_FAILED')}
                    >
                      &ldquo;{qp}&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {instantSuccessProblem && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-bold text-xs">Practice Challenge Ready!</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Opening workspace in sandbox...</p>
                    </div>
                  </div>
                  <Link
                    to={`/workspace/${instantSuccessProblem.slug || instantSuccessProblem.id}`}
                    className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition"
                  >
                    Open Now →
                  </Link>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleInstantAIPractice}
                  disabled={isGeneratingInstantPractice || isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isGeneratingInstantPractice ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                      <span>Synthesizing Sandbox Challenge (10s)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>⚡ Instant Practice: Generate &amp; Solve Now</span>
                    </>
                  )}
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-slate-400">or submit to curriculum</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isGeneratingInstantPractice || (activeProposal !== null && activeProposal.status !== 'VALIDATION_FAILED')}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                      Submitting to Differential Review Pipeline...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Submit for Dual-Oracle Official Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Interactive Clarification Questionnaire (Shown if status is AWAITING_CLARIFICATION) */}
          {activeProposal?.status === 'AWAITING_CLARIFICATION' && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                AI Clarification Required
              </div>
              <p className="text-xs text-amber-800 mb-4">
                The AI detected ambiguous specifications or edge case boundaries. Please provide clarification so the generator can construct accurate mathematical constraints and test suites.
              </p>

              <form onSubmit={handleClarificationSubmit} className="space-y-4">
                {activeProposal.clarifications?.map((c: ProblemProposalClarification, index: number) => (
                  <div key={c.id} className="bg-white rounded-xl p-4 border border-amber-200/80 shadow-xs">
                    <p className="text-xs font-semibold text-slate-900 mb-2">
                      {index + 1}. {c.question}
                    </p>

                    {c.options && c.options.length > 0 ? (
                      <div className="space-y-1.5">
                        {c.options.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              clarificationAnswers[c.id] === opt
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-medium'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`clarify_${c.id}`}
                              value={opt}
                              checked={clarificationAnswers[c.id] === opt}
                              onChange={() =>
                                setClarificationAnswers((prev) => ({ ...prev, [c.id]: opt }))
                              }
                              className="text-emerald-600 focus:ring-emerald-500"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={clarificationAnswers[c.id] || ''}
                        onChange={(e) =>
                          setClarificationAnswers((prev) => ({ ...prev, [c.id]: e.target.value }))
                        }
                        placeholder="Type your clarification..."
                        className="w-full text-xs rounded-lg border border-slate-300 p-2 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}

                <button
                  type="submit"
                  disabled={isSubmittingClarification}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmittingClarification ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Resuming Synthesis Pipeline...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Submit Clarifications &amp; Generate
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Status & Preview Column */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Pipeline Stepper */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                Evolution Pipeline Stages
              </h2>
              {activeProposal && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  Status: {activeProposal.status}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STAGES.map((s) => {
                const status = getStageStatus(s.key);
                return (
                  <div
                    key={s.key}
                    className={`p-3 rounded-xl border text-xs transition flex flex-col justify-between ${
                      status === 'completed'
                        ? 'bg-emerald-50/50 border-emerald-300 text-emerald-900'
                        : status === 'active'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 shadow-xs ring-1 ring-indigo-200'
                        : status === 'error'
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : 'bg-slate-50/70 border-slate-200 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] truncate">{s.label}</span>
                      {status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      {status === 'active' && (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      )}
                      {status === 'error' && (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{s.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Proposal Preview Card (When generated content is available) */}
          {activeProposal?.generatedContent ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col gap-4">
              {/* Header with Title and Badges */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                        activeProposal.generatedContent.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : activeProposal.generatedContent.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {activeProposal.generatedContent.difficulty}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      slug: {activeProposal.generatedContent.slug}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {activeProposal.generatedContent.title}
                  </h3>
                </div>

                {/* Status Call to Action */}
                {activeProposal.status === 'PUBLISHED' && activeProposal.publishedProblemId ? (
                  <Link
                    to={`/workspace/${activeProposal.publishedProblemId}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    Solve Problem Now
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : activeProposal.status === 'PENDING_REVIEW' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Validated &bull; Pending Admin Approval
                  </span>
                ) : null}
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('statement')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'statement'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Problem Statement
                </button>
                <button
                  onClick={() => setActiveTab('validation')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'validation'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Validation Report
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`pb-2 px-1 border-b-2 transition ${
                    activeTab === 'tests'
                      ? 'border-emerald-600 text-emerald-800 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sample Test Cases
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === 'statement' && (
                <div className="space-y-4 text-xs text-slate-700">
                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Description:</h4>
                    <p className="whitespace-pre-line leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      {activeProposal.generatedContent.description}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Constraints:</h4>
                    <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px] text-slate-600">
                      {activeProposal.generatedContent.constraints?.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 mb-1">Sample Examples:</h4>
                    <div className="space-y-2">
                      {activeProposal.generatedContent.examples?.map((ex, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px]">
                          <div><strong>Input:</strong> {ex.input}</div>
                          <div><strong>Output:</strong> {ex.output}</div>
                          {ex.explanation && (
                            <div className="text-slate-500 mt-1 font-sans text-[11px]">
                              <em>Explanation:</em> {ex.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'validation' && (
                <div className="space-y-4">
                  {activeProposal.validationReport ? (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700">Differential Concordance:</span>
                        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {activeProposal.validationReport.differentialConcordancePercent}% Matching
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-mono text-[10px] block mb-1">Canonical Python</span>
                          <div className="text-slate-800 font-bold">
                            Runtime: {activeProposal.validationReport.canonicalStats?.medianRuntimeMs} ms
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Memory: {activeProposal.validationReport.canonicalStats?.memoryKb} KB
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-500 font-mono text-[10px] block mb-1">Secondary Oracle</span>
                          <div className="text-slate-800 font-bold">
                            Runtime: {activeProposal.validationReport.secondaryStats?.medianRuntimeMs} ms
                          </div>
                          <div className="text-slate-500 text-[11px]">
                            Memory: {activeProposal.validationReport.secondaryStats?.memoryKb} KB
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Invariants: Passed</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Contradictions: None</span>
                        </div>
                        <div className="flex items-center gap-1.5 ml-auto text-slate-400 font-mono text-[10px]">
                          Evaluated: {activeProposal.validationReport.totalCasesEvaluated} tests
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Validation in progress or not yet run.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Showing public and verified sample test suites synthesized by AI:
                  </div>
                  {activeProposal.generatedContent.testCases
                    ?.filter((tc) => tc.isPublic)
                    .map((tc, idx) => (
                      <div key={tc.id || idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs">
                        <div className="flex items-center justify-between mb-1 text-[11px] text-slate-500 font-sans">
                          <span>Sample Test #{idx + 1}</span>
                          <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            Public
                          </span>
                        </div>
                        <div className="text-slate-800">
                          <span className="text-slate-400">In: </span>{tc.input}
                        </div>
                        <div className="text-emerald-800 font-semibold">
                          <span className="text-slate-400">Out: </span>{tc.expectedOutput}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/70 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-xs">
                <FileCheck className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">
                {activeProposal ? 'Synthesizing Materials...' : 'Awaiting Problem Input'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {activeProposal
                  ? 'Our AI pipeline is currently checking ambiguities, generating test cases and preparing sandbox containers.'
                  : 'Enter your question idea in the left form and click Formulate with AI to watch the automated evaluation in real time.'}
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
