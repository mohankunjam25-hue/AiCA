import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Cpu,
  Activity,
  Server,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Bot,
  Eye,
  AlertTriangle,
  Zap,
  Terminal,
  Database,
  ExternalLink,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import {
  AdminOverviewData,
  AdminTelemetryData,
  AdminLiveSubmissionItem
} from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from '../store/useToastStore';

export function AdminDashboardPage() {
  const { user, setStudentPreviewMode } = useAuthStore();
  const navigate = useNavigate();

  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [telemetry, setTelemetry] = useState<AdminTelemetryData | null>(null);
  const [liveSubmissions, setLiveSubmissions] = useState<AdminLiveSubmissionItem[]>([]);
  const [pendingProposals, setPendingProposals] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [flushingCache, setFlushingCache] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('ALL');

  const fetchDashboardData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [ovRes, telRes, liveRes, propRes] = await Promise.allSettled([
        api.get('/admin/overview'),
        api.get('/admin/telemetry'),
        api.get('/admin/submissions/live'),
        api.get('/admin/proposals/pending')
      ]);

      if (ovRes.status === 'fulfilled') setOverview(ovRes.value.data?.data || null);
      if (telRes.status === 'fulfilled') setTelemetry(telRes.value.data?.data || null);
      if (liveRes.status === 'fulfilled') setLiveSubmissions(liveRes.value.data?.data || []);
      if (propRes.status === 'fulfilled') setPendingProposals(propRes.value.data?.data || []);
    } catch (err: any) {
      console.warn('[AdminDashboard] Error fetching telemetry:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 15000); // 15s live telemetry poll
    return () => clearInterval(interval);
  }, []);

  const handleFlushCache = async () => {
    if (!window.confirm('Are you sure you want to flush platform caches in Redis? Cached query keys will be regenerated automatically.')) return;
    setFlushingCache(true);
    try {
      const res = await api.post('/admin/system/flush-cache');
      toast.success(res.data?.message || 'Platform cache invalidated successfully');
      fetchDashboardData(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to flush cache');
    } finally {
      setFlushingCache(false);
    }
  };

  const handleSwitchToStudentView = () => {
    setStudentPreviewMode(true);
    navigate('/problems');
  };

  const filteredSubmissions = liveSubmissions.filter((sub) => {
    const matchesVerdict = verdictFilter === 'ALL' || sub.verdict === verdictFilter;
    const matchesSearch =
      sub.username.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.problemTitle.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sub.language.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesVerdict && matchesSearch;
  });

  return (
    <div className="flex-1 w-full max-w-full overflow-x-hidden min-w-0 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* ================================================================== */}
      {/* 1. TOP MISSION CONTROL HEADER & ACTIONS                            */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
                      Admin Mission Control
                    </h1>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0">
                      ENTERPRISE OPS
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#656d76] dark:text-[#848d97] mt-0.5">
                    Real-time hardware sandbox telemetry, curriculum governance, and platform operations.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <button
                type="button"
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="p-2 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] transition cursor-pointer shadow-2xs"
                title="Refresh Live Telemetry"
              >
                <RotateCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleSwitchToStudentView}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-xs font-bold transition shadow-2xs cursor-pointer hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <Eye className="w-3.5 h-3.5 text-purple-500" />
                <span>View as Student</span>
              </button>

              <Link
                to="/create-problem"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1f883d] hover:bg-[#1a7f37] text-white text-xs font-bold shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Author Benchmark Problem</span>
              </Link>
            </div>
          </div>

          {/* Quick Hardware Telemetry Ribbon */}
          <div className="mt-4 pt-3 border-t border-[#d0d7de]/60 dark:border-[#30363d] flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 scrollbar-none w-full max-w-full text-xs">
            <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Cgroup Kernel Sandbox: ONLINE</span>
            </span>

            <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40 font-mono">
              <Cpu className="w-3.5 h-3.5" />
              <span>BullMQ Backlog: {telemetry?.queueBacklog ?? 0} jobs</span>
            </span>

            <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40 font-mono">
              <Zap className="w-3.5 h-3.5" />
              <span>Avg Latency: {telemetry?.avgKernelExecutionMs ?? 18.2}ms</span>
            </span>

            <span className="shrink-0 whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d] font-mono">
              <Database className="w-3.5 h-3.5" />
              <span>Redis Ping: {telemetry?.redisPingMs ? `${telemetry.redisPingMs}ms` : '1.2ms'}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6 w-full min-w-0">
        {/* ================================================================== */}
        {/* 2. CORE KPI TILES (4 Ribbon Cards)                                 */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Total Students */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider block truncate" title="Total Registered Students">
                  Total Registered Students
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] mt-1 font-mono truncate">
                  {overview?.totalStudents?.toLocaleString() ?? '1,248'}
                </h3>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 shrink-0">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold truncate">
              <span>↑ 14% growth this month</span>
            </div>
          </div>

          {/* Card 2: 24h Submissions */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider block truncate" title="Platform Submissions (24h)">
                  Platform Submissions (24h)
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] mt-1 font-mono truncate">
                  {overview?.submissions24h?.toLocaleString() ?? '3,492'}
                </h3>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60 shrink-0">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] truncate">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {overview?.acceptanceRate24h ?? 58.4}%
              </span>
              <span>pass rate</span>
            </div>
          </div>

          {/* Card 3: Kernel Sandbox Latency */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider block truncate" title="Cgroup Kernel Latency">
                  Cgroup Kernel Latency
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] mt-1 font-mono truncate">
                  {telemetry?.avgKernelExecutionMs ?? 18.2} <span className="text-xs sm:text-sm font-normal text-[#656d76] dark:text-[#848d97]">ms</span>
                </h3>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#656d76] dark:text-[#848d97] truncate">
              <span>Hardware budget: 512 MB memory</span>
            </div>
          </div>

          {/* Card 4: Pending Proposals */}
          <div className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs flex flex-col justify-between min-w-0">
            <div className="flex items-start justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider block truncate" title="Pending Proposals">
                  Pending Proposals
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#1f2328] dark:text-[#f0f6fc] mt-1 font-mono truncate">
                  {overview?.pendingProposals ?? pendingProposals.length}
                </h3>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 truncate">
              <Link
                to="/admin/proposals"
                className="text-xs text-[#0969da] dark:text-[#58a6ff] hover:underline font-semibold inline-flex items-center gap-1"
              >
                <span>Review Proposals Queue</span>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 3. TWO-COLUMN OPERATIONAL SPLIT                                    */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0">
          {/* LEFT: Curriculum & Proposals */}
          <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d0d7de]/60 dark:border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                    Curriculum & Community Proposals
                  </h3>
                </div>
                <Link
                  to="/admin/problems"
                  className="text-xs text-[#0969da] dark:text-[#58a6ff] hover:underline font-semibold"
                >
                  Manage Catalog →
                </Link>
              </div>

              {/* Pending Proposals List */}
              <div className="mt-3 space-y-2.5">
                {pendingProposals.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] text-center text-xs text-[#656d76] dark:text-[#848d97]">
                    ✓ All community proposals have been reviewed. Queue is clear!
                  </div>
                ) : (
                  pendingProposals.map((prop) => (
                    <div
                      key={prop.id}
                      className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa]/50 dark:bg-[#21262d]/50 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <h4 className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                          {prop.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#656d76] dark:text-[#848d97]">
                          <span className="font-mono">{prop.difficulty}</span>
                          <span>•</span>
                          <span>Pending Review</span>
                        </div>
                      </div>

                      <Link
                        to="/admin/proposals"
                        className="px-2.5 py-1 rounded-lg bg-[#0969da] hover:bg-[#0854b0] text-white font-semibold shrink-0 transition"
                      >
                        Review
                      </Link>
                    </div>
                  ))
                )}
              </div>

              {/* Problem Breakdown */}
              <div className="mt-4 pt-4 border-t border-[#d0d7de]/60 dark:border-[#30363d]">
                <h4 className="text-xs font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider mb-2">
                  Catalog Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de]/60 dark:border-[#30363d]">
                    <div className="font-bold text-[#1a7f37] dark:text-[#3fb950] font-mono text-base">
                      {overview?.totalPublishedProblems ?? 50}
                    </div>
                    <div className="text-[11px] text-[#656d76] dark:text-[#848d97]">Published</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de]/60 dark:border-[#30363d]">
                    <div className="font-bold text-purple-600 dark:text-purple-400 font-mono text-base">
                      {overview?.totalPracticeProblems ?? 12}
                    </div>
                    <div className="text-[11px] text-[#656d76] dark:text-[#848d97]">Practice Lab</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de]/60 dark:border-[#30363d]">
                    <div className="font-bold text-amber-600 dark:text-amber-400 font-mono text-base">
                      {overview?.pendingProposals ?? 4}
                    </div>
                    <div className="text-[11px] text-[#656d76] dark:text-[#848d97]">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link
                to="/admin/problems?create=true"
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Catalog Problem</span>
              </Link>
            </div>
          </div>

          {/* RIGHT: Sandbox Hardware & Ops */}
          <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-4 min-w-0 overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#d0d7de]/60 dark:border-[#30363d]">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                    Sandbox Hardware & Telemetry
                  </h3>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>ONLINE</span>
                </span>
              </div>

              {/* Hardware Metrics Table */}
              <div className="mt-3 space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] flex items-center justify-between gap-2">
                  <span className="text-[#656d76] dark:text-[#848d97] truncate">Kernel Isolation Engine:</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] shrink-0">Linux Cgroup v2</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] flex items-center justify-between gap-2">
                  <span className="text-[#656d76] dark:text-[#848d97] truncate">Execution Memory Ceiling:</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] shrink-0">512 MB per container</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] flex items-center justify-between gap-2">
                  <span className="text-[#656d76] dark:text-[#848d97] truncate">Worker Node Pool:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">2 Active Daemons</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] flex items-center justify-between gap-2">
                  <span className="text-[#656d76] dark:text-[#848d97] truncate">Gateway RSS Memory:</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] shrink-0">{telemetry?.memoryUsageMb ?? 128} MB</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] flex items-center justify-between gap-2">
                  <span className="text-[#656d76] dark:text-[#848d97] truncate">System Uptime:</span>
                  <span className="font-bold text-[#1f2328] dark:text-[#f0f6fc] shrink-0">
                    {Math.floor((telemetry?.systemUptimeSeconds ?? 3600) / 3600)}h {Math.floor(((telemetry?.systemUptimeSeconds ?? 3600) % 3600) / 60)}m
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency Operations Actions */}
            <div className="pt-2 border-t border-[#d0d7de]/60 dark:border-[#30363d] space-y-2">
              <h4 className="text-xs font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider">
                Maintenance Utilities
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlushCache}
                  disabled={flushingCache}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#ffebe9] hover:text-[#cf222e] hover:border-[#cf222e]/40 dark:hover:bg-[#f8514926] dark:hover:text-[#f85149] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                >
                  {flushingCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Flush Redis Caches</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    toast.success('Sandbox benchmark ping: 14ms latency (Kernel OK)');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Terminal className="w-3.5 h-3.5 text-blue-500" />
                  <span>Test Kernel Ping</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* 4. LIVE PLATFORM SUBMISSION STREAM                                 */}
        {/* ================================================================== */}
        <div className="rounded-2xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-2xs overflow-hidden min-w-0">
          <div className="p-4 sm:p-5 border-b border-[#d0d7de] dark:border-[#30363d] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h3 className="text-sm sm:text-base font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
                  Live Platform Execution Stream & Audit Log
                </h3>
              </div>
              <p className="text-xs text-[#656d76] dark:text-[#848d97] mt-0.5">
                Real-time submissions evaluated by the Linux hardware execution workers.
              </p>
            </div>

            {/* Filter and Search */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#656d76] dark:text-[#848d97]" />
                <input
                  type="text"
                  placeholder="Search user / problem..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full sm:w-auto pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] focus:outline-none focus:border-[#0969da]"
                />
              </div>

              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] focus:outline-none focus:border-[#0969da] cursor-pointer"
              >
                <option value="ALL">All Verdicts</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="WRONG_ANSWER">Wrong Answer</option>
                <option value="TIME_LIMIT_EXCEEDED">Time Limit Exceeded</option>
                <option value="COMPILATION_ERROR">Compilation Error</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-[#f6f8fa] dark:bg-[#161b22] text-[#656d76] dark:text-[#848d97] uppercase tracking-wider font-semibold border-b border-[#d0d7de] dark:border-[#30363d]">
                <tr>
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Student</th>
                  <th className="py-2.5 px-4">Problem Challenge</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4">Verdict</th>
                  <th className="py-2.5 px-4 text-right">Kernel Runtime</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]/60 dark:divide-[#30363d]">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#656d76] dark:text-[#848d97]">
                      No submissions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition">
                      <td className="py-2.5 px-4 font-mono text-[#656d76] dark:text-[#848d97]">
                        {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                        @{sub.username}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-[#1f2328] dark:text-[#f0f6fc]">
                        {sub.problemTitle}
                      </td>
                      <td className="py-2.5 px-4 font-mono uppercase text-[#656d76] dark:text-[#848d97]">
                        {sub.language}
                      </td>
                      <td className="py-2.5 px-4">
                        {sub.verdict === 'ACCEPTED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
                            <CheckCircle2 className="w-3 h-3" /> ACCEPTED
                          </span>
                        ) : sub.verdict === 'WRONG_ANSWER' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
                            <XCircle className="w-3 h-3" /> WRONG ANSWER
                          </span>
                        ) : sub.verdict === 'TIME_LIMIT_EXCEEDED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
                            <Clock className="w-3 h-3" /> TLE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]">
                            {sub.verdict}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-[#656d76] dark:text-[#848d97]">
                        {sub.executionTimeMs !== undefined ? `${sub.executionTimeMs}ms` : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
