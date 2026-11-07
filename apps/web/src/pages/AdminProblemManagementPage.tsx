import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Archive,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Tag,
  Clock,
  Cpu,
  Layers,
  Bot,
  AlertCircle,
  X,
  Loader2,
  RotateCcw,
  Check,
  Sparkles
} from 'lucide-react';
import { Problem, ProblemDifficulty, ProblemLifecycleStatus } from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  ProblemAuthoringStudio,
  ProblemFormData
} from '../components/ProblemAuthoringStudio';

interface AdminProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  status: ProblemLifecycleStatus;
  tags: string[];
  totalSubmissions: number;
  acceptedSubmissions: number;
  createdAt: string;
  updatedAt: string;
}

export function AdminProblemManagementPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [problems, setProblems] = useState<AdminProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Studio Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<ProblemFormData | undefined>(undefined);

  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      handleOpenCreateModal();
    }
  }, [searchParams]);

  // Staff Authorization Check
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/admin/problems');
      return;
    }
    const role = (user as any)?.role;
    if (role !== 'ADMIN' && role !== 'INSTRUCTOR') {
      navigate('/problems');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    fetchAdminProblems();
  }, [statusFilter]);

  const fetchAdminProblems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const res = await api.get('/problems/admin/all', { params });
      setProblems(res.data.data.problems || []);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load admin problems list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingProblemId(null);
    setInitialFormData(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (problemId: string) => {
    setEditingProblemId(problemId);
    try {
      const res = await api.get(`/problems/admin/${problemId}`);
      const p = res.data.data;
      setInitialFormData({
        title: p.title || '',
        slug: p.slug || '',
        difficulty: p.difficulty || 'MEDIUM',
        status: p.status || 'UNPUBLISHED',
        tags: p.tags || ['Algorithms'],
        description: p.description || '',
        constraints: p.constraints || [],
        timeLimitMs: p.timeLimitMs || 2000,
        memoryLimitKb: p.memoryLimitKb || 262144,
        starterPython: p.starterCode?.python || '',
        starterJs: p.starterCode?.javascript || '',
        starterCpp: p.starterCode?.cpp || '',
        starterJava: p.starterCode?.java || '',
        examples: p.examples?.length ? p.examples : [{ input: '', output: '', explanation: '' }],
        testCases: (p.testCases || []).map((tc: any) => ({
          id: tc.id,
          input: tc.input || '',
          expectedOutput: tc.expectedOutput || '',
          isPublic: Boolean(tc.isPublic),
          isEdgeCase: Boolean(tc.isEdgeCase),
          explanation: tc.explanation || '',
          weight: tc.weight || 1.0
        }))
      });
      setIsModalOpen(true);
    } catch (err: any) {
      alert(`Failed to load full problem: ${err.message}`);
    }
  };

  const handleArchiveProblem = async (problemId: string, title: string) => {
    if (!confirm(`Are you sure you want to archive "${title}"? This soft-deletes the problem while preserving historical submissions.`)) {
      return;
    }
    try {
      await api.delete(`/problems/${problemId}`);
      fetchAdminProblems();
    } catch (err: any) {
      alert(`Archive failed: ${err.response?.data?.error?.message || err.message}`);
    }
  };

  // Filtered problems list
  const filteredProblems = problems.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
              Problem Catalog Manager
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Staff
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Publish, audit, edit, and benchmark curriculum challenges evaluated by the Linux hardware sandbox.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/create-problem"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 dark:hover:bg-purple-900/40 shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            AI &amp; Manual Studio
          </Link>
          <Link
            to="/admin/proposals"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Review Queue
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            + New Problem
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search problems by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Problems Management Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-16 text-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500 mx-auto" />
            <p className="text-xs font-mono text-slate-400">Loading problem records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-500 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : filteredProblems.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-2">
            <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No problems found</p>
            <p className="text-xs text-slate-400">Click &quot;New Problem&quot; to author your first curriculum challenge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase">
                <tr>
                  <th className="px-5 py-3.5">Title &amp; Slug</th>
                  <th className="px-4 py-3.5">Difficulty</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Tags</th>
                  <th className="px-4 py-3.5">Submissions</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                {filteredProblems.map((prob) => (
                  <tr key={prob.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {prob.title}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                        /{prob.slug}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        prob.difficulty === 'EASY'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/20'
                          : prob.difficulty === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-500/20'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {prob.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono border ${
                        prob.status === 'PUBLISHED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : prob.status === 'ARCHIVED'
                          ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                      }`}>
                        {prob.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {prob.tags.slice(0, 3).map((t) => (
                          <span key={t} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-500">
                      {prob.totalSubmissions}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/workspace/${prob.slug || prob.id}`}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                          title="Preview in Student Workspace"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEditModal(prob.id)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 transition cursor-pointer"
                          title="Edit Problem & Test Cases"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {prob.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleArchiveProblem(prob.id, prob.title)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition cursor-pointer"
                            title="Archive Problem (Soft-delete)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Professional Problem Authoring Studio Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="w-full max-w-6xl h-full max-h-[92vh] rounded-2xl overflow-hidden shadow-2xl border border-[#d0d7de] dark:border-[#30363d] flex flex-col bg-white dark:bg-[#161b22]">
            <ProblemAuthoringStudio
              initialData={initialFormData}
              editingProblemId={editingProblemId}
              onSuccess={() => {
                setIsModalOpen(false);
                fetchAdminProblems();
              }}
              onCancel={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
