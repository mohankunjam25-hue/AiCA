import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import {
  ArrowRight,
  ShieldCheck,
  Cpu,
  Brain,
  Zap,
  BarChart3,
  Layers,
  ChevronRight,
  CheckCircle2,
  Clock,
  HardDrive,
  GitCompare,
  Code2,
  ExternalLink,
  Play,
  RotateCcw,
  Activity,
  Terminal,
  Lock,
  Workflow
} from 'lucide-react';

interface CodeSample {
  title: string;
  complexity: string;
  runtimeMs: number;
  memoryMb: number;
  verdict: string;
  verdictColor: string;
  code: string;
  aiExplanation: string;
}

const SAMPLE_COMPARISONS: Record<string, CodeSample[]> = {
  python: [
    {
      title: 'Naive Brute-Force Approach',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 1420,
      memoryMb: 14.1,
      verdict: 'TLE Warning (Quadratic Latency)',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `def twoSum(nums: list[int], target: int) -> list[int]:
    n = len(nums)
    # Quadratic nested loop: checks all pairs
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []`,
      aiExplanation:
        'Quadratic iteration over all pairs causes quadratic growth (O(N²)). When input length N=10⁴, operations approach 10⁸, breaching the 2000ms sandbox time limit.'
    },
    {
      title: 'Optimal Hash Map Approach',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 18,
      memoryMb: 15.3,
      verdict: 'Accepted (100% Tests Passed)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {} # Value -> Index hash map
    # Single linear scan with O(1) average lookup
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      aiExplanation:
        'Single-pass hash table reduces runtime by 98.7% (18ms vs 1420ms). Algorithmic trade-off: Allocates +1.2 MB auxiliary heap space to achieve linear O(N) execution.'
    }
  ],
  javascript: [
    {
      title: 'Naive Brute-Force Approach',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 980,
      memoryMb: 36.2,
      verdict: 'Inefficient (High Latency)',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `function twoSum(nums, target) {
  // Nested iteration across array
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}`,
      aiExplanation:
        'Double loop causes JavaScript V8 engine to repeatedly de-optimize inner iteration frames. High latency under large arrays.'
    },
    {
      title: 'Optimal Map Lookup',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 14,
      memoryMb: 37.1,
      verdict: 'Optimal (100% Tests Passed)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `function twoSum(nums, target) {
  const map = new Map();
  // Single-pass O(1) average lookup
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      aiExplanation:
        'JavaScript ES6 Map provides hash-backed O(1) lookups. Runtime drops to 14ms with negligible memory differential.'
    }
  ],
  typescript: [
    {
      title: 'Naive Nested Loop (O(N²))',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 1040,
      memoryMb: 38.4,
      verdict: 'Quadratic Latency',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `function twoSum(nums: number[], target: number): number[] {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) return [i, j];
    }
  }
  return [];
}`,
      aiExplanation:
        'TypeScript compiler produces equivalent nested loops that scale with quadratic complexity under large benchmark suites.'
    },
    {
      title: 'Optimal Typed Map (O(N))',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 16,
      memoryMb: 39.5,
      verdict: 'Accepted (Optimal)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `function twoSum(nums: number[], target: number): number[] {
  const indexMap = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (indexMap.has(diff)) return [indexMap.get(diff)!, i];
    indexMap.set(nums[i], i);
  }
  return [];
}`,
      aiExplanation:
        'Strictly typed hash map indexes elements in single pass. Execution time reduces from 1040ms to 16ms.'
    }
  ],
  cpp: [
    {
      title: 'C++ Brute-Force Vector Scan',
      complexity: 'O(N²) Time • O(1) Space',
      runtimeMs: 310,
      memoryMb: 8.4,
      verdict: 'Sub-optimal CPU Bound',
      verdictColor: 'text-amber-700 bg-amber-50 border-amber-200',
      code: `vector<int> twoSum(vector<int>& nums, int target) {
    int n = nums.size();
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (nums[i] + nums[j] == target) return {i, j};
        }
    }
    return {};
}`,
      aiExplanation:
        'Even with C++ compile-time optimizations (-O3), quadratic algorithm executes N*(N-1)/2 cache checks, bottlenecking memory bus bandwidth.'
    },
    {
      title: 'C++ std::unordered_map Hash',
      complexity: 'O(N) Time • O(N) Space',
      runtimeMs: 4,
      memoryMb: 9.8,
      verdict: 'Lightning Fast (Accepted)',
      verdictColor: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      code: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int comp = target - nums[i];
        if (seen.count(comp)) return {seen[comp], i};
        seen[nums[i]] = i;
    }
    return {};
}`,
      aiExplanation:
        'High-performance bucket hashing in C++ std::unordered_map finishes across 100,000 items in 4ms flat.'
    }
  ]
};

const MARQUEE_ITEMS = [
  '⚡ 98.7% Algorithmic Speedup',
  '🛡️ Judge0 CE v1.13 Isolated Sandbox',
  '🧠 Gemini 1.5 Flash AST Decomposition',
  '⏱️ Kernel Sys/User Time Profiling',
  '📊 O(N²) to O(N) Complexity Detection',
  '🔍 Real-Time SSE Diff Telemetry',
  '🎯 4 Languages: Python • TypeScript • C++ • JS',
  '🚀 Fair Logarithmic Scoring Multipliers',
  '💡 Pedagogical Insights Over Rigid Test Fails'
];

export function HeroLandingPage() {
  const [selectedLang, setSelectedLang] = useState<'python' | 'javascript' | 'typescript' | 'cpp'>('python');
  const [activeTab, setActiveTab] = useState<number>(1); // 0 = Naive, 1 = Optimal
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<string>('idle'); // 'idle' | 'compiling' | 'executing' | 'analyzing' | 'done'
  const [liveRuntime, setLiveRuntime] = useState<number>(18);
  const [liveMemory, setLiveMemory] = useState<number>(15.3);
  const [featuredData, setFeaturedData] = useState<any>(null);

  // Mouse spotlight & 3D tilt interactive coordinates
  const heroRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 500, y: 300 });
  const [cardTilt, setCardTilt] = useState({ x: 0, y: 0 });

  const currentSample = SAMPLE_COMPARISONS[selectedLang][activeTab];

  // Fetch live community benchmark on mount with graceful fallback
  useEffect(() => {
    let isMounted = true;
    api.get('/comparisons/featured')
      .then((res) => {
        if (isMounted && res.data?.data) {
          setFeaturedData(res.data.data);
        }
      })
      .catch(() => {
        // Graceful silent fallback to curated baseline with zero CLS
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Update live metrics on tab change or when live benchmark arrives
  useEffect(() => {
    let effectiveRuntime = currentSample.runtimeMs;
    let effectiveMemory = currentSample.memoryMb;

    if (featuredData) {
      if (activeTab === 1 && featuredData.submissionB?.executionTimeMs) {
        effectiveRuntime = featuredData.submissionB.executionTimeMs;
        if (featuredData.submissionB.memoryUsedKb) {
          effectiveMemory = Math.round((featuredData.submissionB.memoryUsedKb / 1024) * 10) / 10;
        }
      } else if (activeTab === 0 && featuredData.submissionA?.executionTimeMs) {
        effectiveRuntime = featuredData.submissionA.executionTimeMs;
        if (featuredData.submissionA.memoryUsedKb) {
          effectiveMemory = Math.round((featuredData.submissionA.memoryUsedKb / 1024) * 10) / 10;
        }
      }
    }

    setLiveRuntime(effectiveRuntime);
    setLiveMemory(effectiveMemory);
    setSimStep('idle');
  }, [selectedLang, activeTab, featuredData, currentSample]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setCardTilt({
      x: Math.round(x * 6),
      y: Math.round(-y * 6)
    });
  };

  const handleCardMouseLeave = () => {
    setCardTilt({ x: 0, y: 0 });
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep('compiling');

    setTimeout(() => {
      setSimStep('executing');
      // Simulated live jitter counter
      const targetRuntime = currentSample.runtimeMs;
      setLiveRuntime(Math.floor(targetRuntime * 1.8));

      setTimeout(() => {
        setSimStep('analyzing');
        setLiveRuntime(targetRuntime);

        setTimeout(() => {
          setSimStep('done');
          setIsSimulating(false);
        }, 600);
      }, 700);
    }, 500);
  };

  return (
    <div
      ref={heroRef}
      onMouseMove={handleHeroMouseMove}
      className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative selection:bg-emerald-100 selection:text-emerald-950"
    >
      {/* ================================================================== */}
      {/* 1. DYNAMIC AMBIENT MESH BACKGROUND & CURSOR SPOTLIGHT              */}
      {/* ================================================================== */}
      {/* Subtle Micro-Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.4] dark:opacity-[0.15] z-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #cbd5e1 1.2px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Interactive Cursor Spotlight Glow (Follows mouse) */}
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-0 hidden md:block"
        style={{
          background: `radial-gradient(700px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.07), rgba(99, 102, 241, 0.05), transparent 70%)`
        }}
      />

      {/* Floating Organic Morphing Orbs (Pure GPU-accelerated CSS) */}
      <div className="absolute top-12 -left-28 w-96 h-96 bg-gradient-to-tr from-emerald-200/50 via-teal-100/40 to-cyan-200/40 dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-cyan-900/15 rounded-full blur-3xl pointer-events-none animate-morph-1 z-0" />
      <div className="absolute top-48 -right-28 w-[420px] h-[420px] bg-gradient-to-bl from-indigo-200/40 via-purple-100/40 to-emerald-100/40 dark:from-indigo-900/20 dark:via-purple-900/10 dark:to-emerald-900/10 rounded-full blur-3xl pointer-events-none animate-morph-2 z-0" />
      <div className="absolute bottom-96 left-1/3 w-80 h-80 bg-gradient-to-r from-amber-100/30 to-rose-100/20 dark:from-amber-900/10 dark:to-rose-900/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle z-0" />

      {/* ================================================================== */}
      {/* 2. HERO HEADER SECTION                                             */}
      {/* ================================================================== */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 text-center flex flex-col items-center">
        {/* Animated Beacon Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500 transition-all duration-300 cursor-default mb-8 group backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide font-mono">
            GV2 Architecture
          </span>
          <span className="text-slate-300 dark:text-slate-700">•</span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Real-Time AST Diff Engine & Sandbox Telemetry
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition" />
        </div>

        {/* Dynamic Editorial Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 max-w-4xl leading-[1.08] mb-6">
          See how code{' '}
          <span className="relative inline-block">
            <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 dark:from-emerald-400 dark:via-teal-400 dark:to-indigo-400 bg-clip-text text-transparent">
              evolves
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 rounded-full opacity-80" />
          </span>
          , not just if it passes.
        </h1>

        {/* Crisp Subtitle */}
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl font-normal leading-relaxed mb-10">
          A pedagogical evaluation platform built for serious software engineers. Run code in isolated Linux cgroups, visualize quadratic vs linear AST diffs, and receive dual-mode AI reasoning.
        </p>

        {/* High-Converting CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-14 w-full sm:w-auto">
          <Link
            to="/register"
            className="w-full sm:w-auto relative group px-8 py-3.5 rounded-xl bg-slate-950 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-slate-950/20 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Start Coding Free
              <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-white group-hover:translate-x-1 transition-transform" />
            </span>
            {/* Shimmer sweep animation */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform ease-out" />
          </Link>
          <a
            href="#live-diff"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <Terminal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            Watch Live Simulation
          </a>
        </div>

        {/* Feature Spec Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl w-full text-xs text-slate-700 dark:text-slate-300 font-medium mb-12">
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-xs transition">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Judge0 Linux cgroups</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-500 hover:shadow-xs transition">
            <Brain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Gemini Dual-Mode AI</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-xs transition">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>AST Deterministic Diffs</span>
          </div>
          <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-teal-500 hover:shadow-xs transition">
            <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>Sub-ms Precision Profiling</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 3. INFINITE KINETIC MARQUEE RIBBON (Sheryians Inspired)           */}
        {/* ================================================================ */}
        <div className="w-full max-w-6xl overflow-hidden py-3 mb-16 relative border-y border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
          {/* Gradient fade on edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#FAFAFC] dark:from-slate-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#FAFAFC] dark:from-slate-950 to-transparent z-10 pointer-events-none" />

          <div className="animate-marquee flex items-center gap-8 whitespace-nowrap text-xs font-semibold text-slate-600 dark:text-slate-400 font-mono tracking-tight">
            {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, idx) => (
              <span key={idx} className="flex items-center gap-2">
                <span className="text-emerald-500 font-bold">✦</span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4. 3D PERSPECTIVE INTERACTIVE EVOLUTION CONSOLE                  */}
        {/* ================================================================ */}
        <div id="live-diff" className="w-full max-w-5xl relative mt-4">
          {/* FLOATING SATELLITE CHIPS (Meta Depth Inspired) */}
          <div className="hidden lg:block absolute -top-8 -left-12 z-20 animate-float-slow pointer-events-none">
            <div className="px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                  Algorithmic Delta
                </p>
                <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                  -98.7% Runtime Drop
                </p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block absolute -bottom-6 -right-8 z-20 animate-float-delayed pointer-events-none">
            <div className="px-3.5 py-2.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                  Kernel Sandbox
                </p>
                <p className="text-xs font-extrabold text-indigo-900 dark:text-indigo-300 font-mono">
                  Isolated cgroups v1.13
                </p>
              </div>
            </div>
          </div>

          {/* MAIN CONSOLE CONTAINER WITH 3D PERSPECTIVE TILT */}
          <div
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              transform: `perspective(1000px) rotateX(${cardTilt.y}deg) rotateY(${cardTilt.x}deg)`,
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-slate-950/50 overflow-hidden text-left transition-shadow duration-300 relative group"
          >
            {/* Top Interactive Bar */}
            <div className="px-5 py-3.5 bg-slate-50/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400/90" />
                <span className="w-3 h-3 rounded-full bg-amber-400/90" />
                <span className="w-3 h-3 rounded-full bg-emerald-400/90" />
                <span className="ml-2 text-xs font-mono font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  evolution-lab :: Problem #1 [{featuredData?.problemTitle || 'Two Sum'}]
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Language Switcher */}
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {(['python', 'javascript', 'typescript', 'cpp'] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLang(lang)}
                      className={`px-2.5 py-1 rounded-md capitalize transition ${
                        selectedLang === lang
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang === 'typescript' ? 'TS' : lang}
                    </button>
                  ))}
                </div>

                {/* Live Sandbox Simulator Button */}
                <button
                  onClick={runSimulation}
                  disabled={isSimulating}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow-xs transition ${
                    isSimulating
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 cursor-wait'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <Activity className="w-3.5 h-3.5 animate-spin" />
                      <span>{simStep.toUpperCase()}...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Simulate Sandbox</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Approach Selector Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 pt-2 gap-2 text-xs font-medium">
              <button
                onClick={() => setActiveTab(0)}
                className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${
                  activeTab === 0
                    ? 'border-amber-500 text-amber-700 dark:text-amber-400 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                01. Naive Brute-Force O(N²)
              </button>
              <button
                onClick={() => setActiveTab(1)}
                className={`pb-3 px-3 border-b-2 flex items-center gap-2 transition ${
                  activeTab === 1
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-semibold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                02. Optimal Hash Map O(N) (Recommended)
              </button>
            </div>

            {/* Simulation Progress Ribbon */}
            {isSimulating && (
              <div className="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 animate-shimmer" />
              </div>
            )}

            {/* Code & Telemetry Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[390px]">
              {/* Left Column: Code Terminal */}
              <div className="lg:col-span-7 p-6 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed flex flex-col justify-between overflow-x-auto relative">
                <div>
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{currentSample.title}</span>
                    <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      AST Parsed
                    </span>
                  </div>
                  <pre className="text-slate-200 selection:bg-indigo-600 font-mono">
                    <code>{currentSample.code}</code>
                  </pre>
                </div>

                <div className="pt-4 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Isolated Judge0 Kernel Container
                  </span>
                  <span className="text-slate-500 font-mono">cgroup: ram 256MB • cpu 2.0s</span>
                </div>
              </div>

              {/* Right Column: Empirical Telemetry & AI Diagnostic */}
              <div className="lg:col-span-5 p-6 bg-slate-50/60 dark:bg-slate-900/60 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-slate-400" />
                      Empirical Telemetry
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${currentSample.verdictColor}`}
                    >
                      {currentSample.verdict}
                    </span>
                  </div>

                  {/* Metrics Matrix */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Runtime Card with animated counter */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Runtime (Sys/User)
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                          {liveRuntime} ms
                        </span>
                        {activeTab === 1 && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                            -98.7%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Memory Heap Card */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1 font-medium">
                        <HardDrive className="w-3 h-3 text-slate-400" />
                        Peak Memory
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                          {liveMemory} MB
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Heap</span>
                      </div>
                    </div>
                  </div>

                  {/* Asymptotic Complexity Bounds */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <BarChart3 className="w-3 h-3 text-indigo-500" />
                      Asymptotic Complexity Bounds
                    </span>
                    <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {currentSample.complexity}
                    </p>
                  </div>

                  {/* Gemini 1.5 Pedagogical Explanation */}
                  <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100/90 dark:border-indigo-900/60 space-y-1.5 shadow-xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      <Brain className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      Pedagogical Insights
                    </div>
                    <p className="text-xs text-indigo-950/80 dark:text-indigo-200/80 leading-relaxed font-sans">
                      {currentSample.aiExplanation}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Want to test your approach?</span>
                  <Link
                    to="/login"
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 flex items-center gap-1"
                  >
                    Solve in Full IDE
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. INTERACTIVE 4-STAGE PIPELINE SECTION (Sheryians / Gemini style)  */}
      {/* ================================================================== */}
      <section id="pipeline" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-bold border border-emerald-200 dark:border-emerald-800/60 mb-3">
            <Workflow className="w-3.5 h-3.5" />
            Evaluation Pipeline
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mb-4">
            How GV2 Evaluates Every Line of Code
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Unlike standard contest sites that merely check pass/fail booleans, our architecture breaks down execution into four rigorous pedagogical layers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-500 transition duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-emerald-500 font-mono transition">
                01
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                AST Tokenization
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The code is parsed into abstract syntax trees to measure cyclomatic complexity and algorithmic nesting depth.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Language-agnostic AST
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-indigo-500 font-mono transition">
                02
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Isolated Sandbox
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dockerized Judge0 CE executes binary inside Linux cgroups, capturing sub-millisecond sys/user CPU times and memory RSS.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-indigo-700 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Hardened Linux cgroups
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-500 transition duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-amber-500 font-mono transition">
                03
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Gemini 1.5 Telemetry
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Dual-mode AI contrasts naive and optimal algorithms, highlighting the exact lines where algorithmic bottlenecks occur.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Pedagogical reasoning
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-teal-300 dark:hover:border-teal-500 transition duration-200 flex flex-col justify-between group">
            <div className="space-y-3">
              <span className="text-3xl font-black text-slate-200 dark:text-slate-800 group-hover:text-teal-500 font-mono transition">
                04
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Evolutionary Diff
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Compare your current submission against earlier attempts or community baselines with fair language multipliers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] font-mono text-teal-700 dark:text-teal-400 font-semibold flex items-center gap-1">
              <GitCompare className="w-3 h-3" />
              Side-by-side AST Diff
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 6. CORE PILLARS & FEATURES (Clean Bento Cards)                     */}
      {/* ================================================================== */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-200/80 dark:border-slate-800">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2 font-mono">
            Key Architectural Pillars
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Designed for understanding, not just scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Isolated Judge0 Execution
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Code runs inside isolated Linux cgroups. Micro-measurements capture exact kernel user/sys time and peak memory without host interference.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-leakage test case diffs</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-200 dark:border-amber-800 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Dual-Mode AI Telemetry
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Gemini 1.5 analyzes Big-O asymptotic limits, code smells, and edge cases. Mode A offers algorithmic optimization; Mode B provides counter-example diagnostics.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Separated from empirical numbers</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-200 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <GitCompare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Peer Solution Evolution
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Compare multiple approaches side-by-side. Inspect time vs space tradeoffs across Python, JavaScript, C++, and Java with fair multiplier weighting.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Fair logarithmic benchmarking</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 7. BOTTOM CONVERSION CTA BANNER                                    */}
      {/* ================================================================== */}
      <section id="methodology" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-10 sm:p-16 text-center text-white relative overflow-hidden shadow-2xl">
          {/* Subtle animated light sweep inside banner */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              Ready to master algorithmic architecture?
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Join software engineers analyzing how algorithms perform in real sandbox environments. Free access with full Judge0 telemetry and AI analytics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-md transition"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm transition"
              >
                Sign In to Platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
