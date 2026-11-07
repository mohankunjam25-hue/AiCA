import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Workflow,
  Search,
  ArrowRight,
  Clock3,
  Layers3,
  RotateCcw,
  Sparkles,
  Bot,
  Loader2,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  Zap,
  BarChart2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { AlgorithmVisualizerCanvas } from '../components/algorithms/AlgorithmVisualizerCanvas';

export type Algorithm = {
  _id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  timeComplexity: string;
  spaceComplexity: string;
  code: { javascript: string; python: string };
  steps: string[];
};

const BIG_O_SPECTRUM = [
  { notation: 'O(1)', label: 'Constant', tone: 'text-[#1a7f37] dark:text-[#3fb950]', bg: 'bg-[#dafbe1] dark:bg-[#2ea04326]', desc: 'Instant hash-lookup or array indexing' },
  { notation: 'O(log n)', label: 'Logarithmic', tone: 'text-[#0969da] dark:text-[#58a6ff]', bg: 'bg-[#ddf4ff] dark:bg-[#388bfd26]', desc: 'Halves the search space each step' },
  { notation: 'O(n)', label: 'Linear', tone: 'text-[#0969da] dark:text-[#58a6ff]', bg: 'bg-[#ddf4ff] dark:bg-[#388bfd26]', desc: 'Single-pass scan through n elements' },
  { notation: 'O(n log n)', label: 'Linearithmic', tone: 'text-[#9a6700] dark:text-[#d29922]', bg: 'bg-[#fff8c5] dark:bg-[#bb800926]', desc: 'Efficient divide & conquer sorting' },
  { notation: 'O(n²)', label: 'Quadratic', tone: 'text-[#cf222e] dark:text-[#f85149]', bg: 'bg-[#ffebe9] dark:bg-[#f8514926]', desc: 'Nested loops over pairs' }
];

export function AlgorithmsPage() {
  const cachedAlgorithms = useDataCacheStore.getState().get<Algorithm[]>('algorithms_catalog');
  const [algorithms, setAlgorithms] = useState<Algorithm[]>(cachedAlgorithms || []);
  const [loading, setLoading] = useState(!cachedAlgorithms || cachedAlgorithms.length === 0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [generating, setGenerating] = useState(false);
  const [generationQuery, setGenerationQuery] = useState('');
  const [generationError, setGenerationError] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcut: "/" focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' && document.activeElement !== searchInputRef.current) ||
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch or retrieve cached algorithms
  useEffect(() => {
    let active = true;
    const cached = useDataCacheStore.getState().get<Algorithm[]>('algorithms_catalog');
    if (cached && cached.length > 0) {
      setAlgorithms(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    api.get('/algorithms')
      .then(({ data }) => {
        if (active) {
          const list = data.data ?? [];
          setAlgorithms(list);
          useDataCacheStore.getState().set('algorithms_catalog', list);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Could not load algorithms. Check your connection.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(algorithms.map((item) => item.category));
    return ['All', ...Array.from(set)];
  }, [algorithms]);

  const filteredAlgorithms = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    return algorithms.filter((algorithm) => {
      const matchesCategory = category === 'All' || algorithm.category === category;
      const matchesSearch =
        !query ||
        `${algorithm.name} ${algorithm.category} ${algorithm.description} ${algorithm.timeComplexity}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [algorithms, category, debouncedSearch]);

  const handleGenerateAlgorithm = async (customQuery?: string) => {
    const queryToUse = (customQuery || generationQuery || search).trim();
    if (!queryToUse || generating) return;
    setGenerating(true);
    setGenerationError('');
    try {
      const { data } = await api.post('/algorithms/generate', { query: queryToUse });
      const generated: Algorithm = data.data;
      setAlgorithms((current) => {
        const next = current.some((item) => item.slug === generated.slug)
          ? current
          : [generated, ...current];
        useDataCacheStore.getState().set('algorithms_catalog', next);
        return next;
      });
      setShowAiModal(false);
      setGenerationQuery('');
      navigate(`/algorithms/${generated.slug}`);
    } catch (err: any) {
      setGenerationError(err.response?.data?.message || 'Could not generate this algorithm. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const getComplexityBadge = (complexity: string) => {
    const c = complexity.toLowerCase();
    if (c.includes('1') || (c.includes('log n') && !c.includes('n log'))) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#dafbe1] dark:bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#4ac26b66] dark:border-[#2ea0434d]">
          {complexity}
        </span>
      );
    }
    if (c.includes('n') && !c.includes('n log') && !c.includes('n²') && !c.includes('n^2') && !c.includes('v + e')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#ddf4ff] dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] border border-[#54aeff66] dark:border-[#388bfd4d]">
          {complexity}
        </span>
      );
    }
    if (c.includes('n log') || c.includes('v + e')) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#fff8c5] dark:bg-[#bb800926] text-[#9a6700] dark:text-[#d29922] border border-[#d4a72c66] dark:border-[#bb80094d]">
          {complexity}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-[#ffebe9] dark:bg-[#f8514926] text-[#cf222e] dark:text-[#f85149] border border-[#ff818266] dark:border-[#f851494d]">
        {complexity}
      </span>
    );
  };

  const isFiltered = search.trim() !== '' || category !== 'All';

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* ================================================================== */}
      {/* 1. TOP CONTEXT HEADER BAR                                          */}
      {/* ================================================================== */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-5 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2.5">
                <Workflow className="w-5 h-5 text-[#8250df] dark:text-[#a371f7]" />
                Algorithm Visualizer &amp; Library
              </h1>
              <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                Explore algorithmic logic through interactive step-by-step simulations, Big-O asymptotic profiles, and dual implementations.
              </p>
            </div>

            {/* AI Generator Action */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAiModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold shadow-2xs transition cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5 text-[#8250df] dark:text-[#a371f7]" />
                <span>AI Algorithm Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* ================================================================== */}
        {/* 2. INTERACTIVE VISUALIZER HERO CARD                                */}
        {/* ================================================================== */}
        <section>
          <AlgorithmVisualizerCanvas
            initialAlgorithm="binary-search"
            showSelector={true}
          />
        </section>

        {/* ================================================================== */}
        {/* 3. MAIN 2-PANE CATALOG & REFERENCE GRID                            */}
        {/* ================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ============================================================== */}
          {/* LEFT COLUMN: HIGH-DENSITY CATALOG (8-9 Cols)                    */}
          {/* ============================================================== */}
          <main className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0">
            {/* Filter & Search Bar */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#8c959f] dark:text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search algorithm by name, category or Big-O... (Press '/' to focus)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-14 py-2 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-xs text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] dark:placeholder-[#6e7681] focus:ring-1 focus:ring-[#0969da] dark:focus:ring-[#58a6ff] outline-none transition"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                    <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] shadow-2xs">
                      /
                    </kbd>
                  </div>
                </div>

                {isFiltered && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setCategory('All');
                    }}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-xs font-medium text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#f85149] transition cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Category Segmented Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-[#d0d7de]/60 dark:border-[#30363d]/80 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                      category === cat
                        ? 'bg-[#0969da] text-white shadow-2xs'
                        : 'bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Density Algorithm Data Table */}
            <div className="rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] shadow-xs overflow-hidden">
              {/* Column Headers */}
              <div className="grid grid-cols-12 px-4 py-2.5 bg-[#f6f8fa] dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] text-[11px] font-bold text-[#656d76] dark:text-[#848d97] uppercase tracking-wider items-center">
                <div className="col-span-5 sm:col-span-4">Algorithm &amp; Category</div>
                <div className="hidden sm:block sm:col-span-4 text-left">Summary / Logic</div>
                <div className="col-span-3 sm:col-span-2 text-center">Time Complexity</div>
                <div className="hidden sm:block sm:col-span-1 text-center">Space</div>
                <div className="col-span-4 sm:col-span-1 text-right">Action</div>
              </div>

              {/* Rows */}
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0969da] dark:text-[#58a6ff] mx-auto" />
                  <p className="text-xs font-mono text-[#656d76] dark:text-[#8b949e]">
                    Loading algorithm library...
                  </p>
                </div>
              ) : error ? (
                <div className="p-8 text-center space-y-3">
                  <AlertCircle className="w-7 h-7 text-[#cf222e] dark:text-[#f85149] mx-auto" />
                  <p className="text-[#1f2328] dark:text-[#f0f6fc] font-semibold text-xs">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0969da] text-white hover:bg-[#0854b0] transition cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredAlgorithms.length === 0 ? (
                <div className="py-14 text-center space-y-3 px-4">
                  <Workflow className="w-8 h-8 text-[#8c959f] dark:text-[#6e7681] mx-auto" />
                  <p className="text-[#1f2328] dark:text-[#f0f6fc] font-bold text-sm">
                    {search.trim() ? `No algorithms matched "${search.trim()}".` : 'No algorithms found in this category.'}
                  </p>
                  <p className="text-[#656d76] dark:text-[#848d97] text-xs max-w-md mx-auto">
                    Generate this algorithm with Gemini AI to instantly produce Python/JS code, Big-O analysis, and step-by-step breakdown.
                  </p>
                  {search.trim() && (
                    <button
                      onClick={() => handleGenerateAlgorithm(search.trim())}
                      disabled={generating}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8250df] hover:bg-[#6e40c9] text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-60"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating &amp; Saving...</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>Generate &ldquo;{search.trim()}&rdquo; with AI</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#d0d7de] dark:divide-[#30363d]">
                  {filteredAlgorithms.map((algo) => (
                    <div
                      key={algo.slug}
                      className="grid grid-cols-12 px-4 py-3 items-center hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] transition group text-xs"
                    >
                      {/* Name & Category */}
                      <div className="col-span-5 sm:col-span-4 min-w-0 pr-2">
                        <Link
                          to={`/algorithms/${algo.slug}`}
                          className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] group-hover:text-[#0969da] dark:group-hover:text-[#58a6ff] truncate block transition"
                        >
                          {algo.name}
                        </Link>
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-[#656d76] dark:text-[#848d97]">
                          <Layers3 className="w-3 h-3 text-[#8250df] dark:text-[#a371f7]" />
                          {algo.category}
                        </span>
                      </div>

                      {/* Summary / Logic */}
                      <div className="hidden sm:block sm:col-span-4 min-w-0 pr-3">
                        <p className="text-xs text-[#57606a] dark:text-[#8b949e] truncate leading-relaxed">
                          {algo.description}
                        </p>
                      </div>

                      {/* Time Complexity */}
                      <div className="col-span-3 sm:col-span-2 flex justify-center">
                        {getComplexityBadge(algo.timeComplexity)}
                      </div>

                      {/* Space Complexity */}
                      <div className="hidden sm:flex sm:col-span-1 justify-center font-mono text-[11px] text-[#656d76] dark:text-[#848d97]">
                        <code>{algo.spaceComplexity}</code>
                      </div>

                      {/* Action */}
                      <div className="col-span-4 sm:col-span-1 flex justify-end">
                        <Link
                          to={`/algorithms/${algo.slug}`}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#0969da]/10 text-[#0969da] hover:bg-[#0969da] hover:text-white dark:bg-[#388bfd26] dark:text-[#58a6ff] dark:hover:bg-[#1f6feb] dark:hover:text-white transition flex items-center gap-1"
                        >
                          <span>Guide</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>

          {/* ============================================================== */}
          {/* RIGHT COLUMN: BIG-O CHEAT SHEET & AI STUDIO WIDGETS (3-4 Cols)  */}
          {/* ============================================================== */}
          <aside className="lg:col-span-4 xl:col-span-3 space-y-4 md:sticky md:top-20">
            {/* Widget 1: Big-O Complexity Asymptotic Matrix */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#8b949e] flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                  Big-O Complexity Radar
                </span>
              </div>

              <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                Asymptotic performance scaling comparison across data set size:
              </p>

              <div className="space-y-1.5">
                {BIG_O_SPECTRUM.map((item) => (
                  <div
                    key={item.notation}
                    className="p-2 rounded-lg bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/70 dark:border-[#30363d] flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${item.bg} ${item.tone}`}>
                        {item.notation}
                      </span>
                      <span className="text-xs font-semibold text-[#1f2328] dark:text-[#f0f6fc]">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#656d76] dark:text-[#848d97] truncate max-w-[120px]">
                      {item.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: Missing an Algorithm? Generate with AI */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Gemini AI Studio
                </span>
              </div>

              <div>
                <h4 className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc]">
                  Generate Custom Algorithm
                </h4>
                <p className="text-[11px] text-[#656d76] dark:text-[#8b949e] mt-1 leading-relaxed">
                  Need Dijkstra, A*, Trie, or KMP? Gemini AI will generate full dual-language code, steps, and asymptotic analysis.
                </p>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="e.g. Dijkstra's Shortest Path"
                  value={generationQuery}
                  onChange={(e) => setGenerationQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerateAlgorithm();
                  }}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] outline-none"
                />
                <button
                  onClick={() => handleGenerateAlgorithm()}
                  disabled={generating || !generationQuery.trim()}
                  className="w-full py-1.5 px-3 rounded-lg bg-[#8250df] hover:bg-[#6e40c9] text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate &amp; Save to Library</span>
                    </>
                  )}
                </button>
              </div>

              {generationError && (
                <p className="text-[11px] text-[#cf222e] dark:text-[#f85149]">{generationError}</p>
              )}
            </div>

            {/* Widget 3: Practice in Workspace */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#1a7f37] dark:text-[#3fb950] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                Practice in Linux Sandbox
              </span>
              <p className="text-[11px] text-[#656d76] dark:text-[#8b949e] leading-relaxed">
                Test your algorithmic implementations against edge cases under strict 20ms kernel budgets.
              </p>
              <Link
                to="/problems"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
              >
                <span>Browse Problem Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* AI Modal Dialog */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#d0d7de] dark:border-[#30363d] pb-3">
              <h3 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                <Bot className="w-4 h-4 text-[#8250df]" />
                AI Algorithm Studio
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-[#656d76] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
              Enter the name of any algorithm or data structure. Gemini AI will synthesize production JavaScript &amp; Python code, Big-O metrics, and step-by-step logic.
            </p>

            <input
              type="text"
              placeholder="e.g. Breadth First Search, Convex Hull, Floyd-Warshall"
              value={generationQuery}
              onChange={(e) => setGenerationQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-[#1f2328] dark:text-[#f0f6fc] outline-none"
            />

            {generationError && (
              <p className="text-xs text-[#cf222e] dark:text-[#f85149]">{generationError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-xs font-semibold text-[#656d76] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerateAlgorithm()}
                disabled={generating || !generationQuery.trim()}
                className="px-3.5 py-1.5 rounded-lg bg-[#8250df] hover:bg-[#6e40c9] text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Generate Algorithm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
