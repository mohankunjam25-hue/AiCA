import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Send,
  X,
  Code2,
  FileCheck,
  Search,
  Filter,
  Check,
  RefreshCw
} from 'lucide-react';
import { ProblemProposal, ProposalStatus } from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export function AdminProblemReviewPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();

  const [proposals, setProposals] = useState<ProblemProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [selectedProposal, setSelectedProposal] = useState<ProblemProposal | null>(null);

  // Review modal state
  const [activeCodeTab, setActiveCodeTab] = useState<'canonical' | 'oracle'>('canonical');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Check admin/instructor privileges
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/proposals');
      return;
    }
    const role = (user as any)?.role;
    if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
      navigate('/problems');
    }
  }, [isAuthenticated, user, navigate]);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get('/problem-proposals/admin/all', { params });
      setProposals(res.data.data.proposals || []);
    } catch (err: any) {
      console.error('Failed to fetch proposals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [statusFilter]);

  const handleApprove = async () => {
    if (!selectedProposal) return;
    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await api.patch(`/problem-proposals/admin/${selectedProposal.id}/approve`, {
        decisionNotes: decisionNotes.trim() || undefined
      });
      setActionSuccess('Problem successfully published into the live catalog!');
      setTimeout(() => {
        setSelectedProposal(null);
        fetchProposals();
      }, 1500);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || 'Failed to approve proposal.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal) return;
    if (!rejectReason.trim()) {
      setActionError('Please provide a feedback reason for rejection.');
      return;
    }

    setIsSubmittingAction(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.patch(`/problem-proposals/admin/${selectedProposal.id}/reject`, {
        reason: rejectReason.trim()
      });
      setActionSuccess('Proposal rejected and feedback stored.');
      setTimeout(() => {
        setSelectedProposal(null);
        fetchProposals();
      }, 1500);
    } catch (err: any) {
      setActionError(err.response?.data?.error?.message || 'Failed to reject proposal.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Instructor &amp; Admin Moderation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Problem Proposal Review Portal
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review AI-generated competitive programming materials, verify dual differential execution oracles,
            and approve problems for live catalog publication.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start">
          {['PENDING_REVIEW', 'ALL', 'PUBLISHED', 'VALIDATION_FAILED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {st === 'PENDING_REVIEW' ? 'Pending Review' : st === 'ALL' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Proposals List Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            Loading submitted proposals...
          </div>
        ) : proposals.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            No problem proposals found under status &ldquo;{statusFilter}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Title &amp; Slug</th>
                  <th className="px-6 py-3.5">Creator</th>
                  <th className="px-6 py-3.5">Difficulty</th>
                  <th className="px-6 py-3.5">Concordance</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.map((p) => {
                  const title = p.generatedContent?.title || 'Untitled Proposal (In Synthesis)';
                  const slug = p.generatedContent?.slug || 'n/a';
                  const diff = p.generatedContent?.difficulty || 'MEDIUM';
                  const concordance = p.validationReport?.differentialConcordancePercent;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 text-sm">{title}</div>
                        <div className="font-mono text-[11px] text-slate-400">{slug}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700">{p.creatorUsername}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono border ${
                            diff === 'EASY'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : diff === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {diff}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {concordance !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                              concordance === 100
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {concordance}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">--</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                            p.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : p.status === 'PENDING_REVIEW'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : p.status === 'VALIDATION_FAILED'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedProposal(p);
                            setDecisionNotes('');
                            setRejectReason('');
                            setActionError(null);
                            setActionSuccess(null);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect &amp; Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Moderation Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2 py-0.5 rounded font-mono bg-slate-900 text-white">
                  Proposal Review
                </span>
                <h3 className="font-bold text-slate-900 text-base">
                  {selectedProposal.generatedContent?.title || 'Problem Proposal'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - 2 Columns */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Problem Details & Validation */}
              <div className="lg:col-span-6 space-y-4 text-xs text-slate-700">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Original Student Prompt
                  </span>
                  <p className="italic text-slate-800">&ldquo;{selectedProposal.originalPrompt}&rdquo;</p>
                </div>

                {selectedProposal.generatedContent && (
                  <>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Generated Description</h4>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 whitespace-pre-line max-h-48 overflow-y-auto leading-relaxed">
                        {selectedProposal.generatedContent.description}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">Constraints</h4>
                      <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                        {selectedProposal.generatedContent.constraints?.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 mb-1">
                        Test Suites ({selectedProposal.generatedContent.testCases?.length || 0} cases)
                      </h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {selectedProposal.generatedContent.testCases?.map((tc, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px]"
                          >
                            <span className="text-slate-400 text-[10px]">
                              [{tc.isPublic ? 'PUBLIC' : 'HIDDEN'}
                              {tc.isEdgeCase ? ' | EDGE' : ''}]:{' '}
                            </span>
                            <span className="text-slate-800">in: {tc.input}</span> &rarr;{' '}
                            <span className="text-emerald-700 font-bold">out: {tc.expectedOutput}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedProposal.validationReport && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-emerald-950 text-xs">
                        Differential Execution Report
                      </span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                        {selectedProposal.validationReport.differentialConcordancePercent}% Concordance
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        Canonical: {selectedProposal.validationReport.canonicalStats?.medianRuntimeMs} ms /{' '}
                        {selectedProposal.validationReport.canonicalStats?.memoryKb} KB
                      </div>
                      <div>
                        Oracle: {selectedProposal.validationReport.secondaryStats?.medianRuntimeMs} ms /{' '}
                        {selectedProposal.validationReport.secondaryStats?.memoryKb} KB
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Monaco Code Viewer for Reference Solutions */}
              <div className="lg:col-span-6 flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveCodeTab('canonical')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        activeCodeTab === 'canonical'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Canonical Python Solution
                    </button>
                    <button
                      onClick={() => setActiveCodeTab('oracle')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        activeCodeTab === 'oracle'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Secondary Oracle (Python)
                    </button>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Sandbox Verified</span>
                </div>

                <div className="h-64 sm:h-80 border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <Editor
                    height="100%"
                    language="python"
                    theme="vs-light"
                    value={
                      activeCodeTab === 'canonical'
                        ? selectedProposal.generatedContent?.referenceSolutions?.canonicalPython ||
                          '# Canonical solution not available'
                        : selectedProposal.generatedContent?.referenceSolutions?.secondaryOracle ||
                          '# Secondary oracle not available'
                    }
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 12,
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on'
                    }}
                  />
                </div>

                {/* Moderation Actions Input */}
                <div className="space-y-3 pt-2">
                  {actionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      {actionSuccess}
                    </div>
                  )}

                  {actionError && (
                    <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      {actionError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Approval Decision Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="e.g. Excellent Kadane variant. Approved for Live catalog."
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Rejection Reason (Required only if rejecting)
                    </label>
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="e.g. Insufficient constraints or contradictory edge cases."
                      className="w-full text-xs rounded-xl border border-slate-300 p-2.5 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedProposal(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={isSubmittingAction || selectedProposal.status === 'PUBLISHED'}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Proposal
                </button>

                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmittingAction || selectedProposal.status === 'PUBLISHED'}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve &amp; Publish Problem
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
