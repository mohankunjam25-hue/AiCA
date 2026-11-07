import React, { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  Workflow,
  Clock3,
  Layers3,
  Zap,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ExternalLink,
  Code2
} from 'lucide-react';
import { api } from '../services/api';
import type { Algorithm } from './AlgorithmsPage';
import { AlgorithmVisualizerCanvas, SupportedAlgoKey } from '../components/algorithms/AlgorithmVisualizerCanvas';
import { parseComplexityBreakdown } from '../components/algorithms/ComplexityBadgeWithPopover';
import { AlgorithmCodeViewer, SupportedCodeLanguage } from '../components/algorithms/AlgorithmCodeViewer';

type SupportedLanguage = 'javascript' | 'python' | 'cpp' | 'java';

const EXTENDED_CODE_SNIPPETS: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'binary-search': {
    cpp: `int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;
    
    while (left <= right) {
        // Prevent 32-bit signed integer overflow
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`,
    java: `public int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;
    
    while (left <= right) {
        // Unsigned right shift prevents arithmetic overflow
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}`
  },
  'two-sum': {
    cpp: `std::vector<int> twoSum(const std::vector<int>& nums, int target) {
    std::unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); ++i) {
        int complement = target - nums[i];
        if (seen.count(complement)) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}`,
    java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i };
        }
        seen.put(nums[i], i);
    }
    return new int[0];
}`
  },
  'kadanes-algorithm': {
    cpp: `int maxSubArray(const std::vector<int>& nums) {
    if (nums.empty()) return 0;
    int currentSum = nums[0];
    int maxSum = nums[0];
    for (size_t i = 1; i < nums.size(); ++i) {
        currentSum = std::max(nums[i], currentSum + nums[i]);
        maxSum = std::max(maxSum, currentSum);
    }
    return maxSum;
}`,
    java: `public int maxSubArray(int[] nums) {
    if (nums.length == 0) return 0;
    int currentSum = nums[0];
    int maxSum = nums[0];
    for (int i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}`
  }
};

export function AlgorithmDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [algorithm, setAlgorithm] = useState<Algorithm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get(`/algorithms/${encodeURIComponent(slug || '')}`)
      .then(({ data }) => {
        if (active) setAlgorithm(data.data);
      })
      .catch((err) => {
        if (active) {
          setError(err.response?.data?.message || 'Could not load this algorithm. Check your connection.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [slug]);

  // Determine which visualizer key to map to
  const visualizerKey: SupportedAlgoKey | null = useMemo(() => {
    if (!slug) return null;
    if (slug.includes('binary-search')) return 'binary-search';
    if (slug.includes('two-sum') || slug.includes('pointer')) return 'two-pointers';
    if (slug.includes('sort')) return 'bubble-sort';
    if (slug.includes('kadane')) return 'kadanes-algorithm';
    return null;
  }, [slug]);

  const breakdown = useMemo(() => {
    if (!algorithm) return null;
    return parseComplexityBreakdown(algorithm.timeComplexity, algorithm.spaceComplexity, algorithm.name);
  }, [algorithm]);

  // Structured multi-language code implementations
  const codeMap = useMemo<Record<SupportedCodeLanguage, string>>(() => {
    if (!algorithm) return { python: '', javascript: '', cpp: '', java: '' };
    const custom = EXTENDED_CODE_SNIPPETS[algorithm.slug] || {};
    return {
      python: algorithm.code.python || '',
      javascript: algorithm.code.javascript || '',
      cpp: custom.cpp || `// Standard C++ implementation for ${algorithm.name}\n// Time: ${algorithm.timeComplexity} | Space: ${algorithm.spaceComplexity}\n\n#include <iostream>\n#include <vector>\n\n// Refer to Python/JavaScript tab for exact algorithm logic.`,
      java: custom.java || `// Standard Java implementation for ${algorithm.name}\n// Time: ${algorithm.timeComplexity} | Space: ${algorithm.spaceComplexity}\n\npublic class Solution {\n    // Refer to Python/JavaScript tab for exact algorithm logic.\n}`
    };
  }, [algorithm]);

  if (loading) {
    return (
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-[#57606a] dark:text-[#8b949e]">Loading algorithm specifications...</p>
      </div>
    );
  }

  if (error || !algorithm) {
    return (
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12 space-y-5">
        <Link
          to="/algorithms"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Algorithms Library</span>
        </Link>
        <div className="p-6 rounded-2xl border border-[#ff818266] bg-[#ffebe9] dark:bg-[#f8514926] text-xs text-[#cf222e] dark:text-[#f85149]">
          {error || 'Algorithm specification not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#f6f8fa] dark:bg-[#010409] text-[#1f2328] dark:text-[#e6edf3] pb-16 transition-colors duration-200">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-white dark:bg-[#161b22] border-b border-[#d0d7de] dark:border-[#30363d] py-4 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Link
              to="/algorithms"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0969da] dark:text-[#58a6ff] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Algorithms Library</span>
            </Link>

            <Link
              to="/problems"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] dark:bg-[#238636] dark:hover:bg-[#2ea043] text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Practice in Linux Sandbox</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        {/* 2. Main Title & Asymptotic Overview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#8250df]/10 text-[#8250df] dark:text-[#a371f7] border border-[#8250df]/20">
              <Layers3 className="w-3 h-3" />
              {algorithm.category}
            </span>
            <span className="text-xs font-mono text-[#656d76] dark:text-[#848d97]">
              Slug: {algorithm.slug}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f2328] dark:text-[#f0f6fc]">
              {algorithm.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#57606a] dark:text-[#8b949e] mt-1.5 leading-relaxed max-w-4xl">
              {algorithm.description}
            </p>
          </div>

          {/* Complexity Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
              <span className="text-[10px] font-bold text-[#656d76] dark:text-[#8b949e] uppercase tracking-wider block">
                Primary Asymptotic Time
              </span>
              <code className="text-sm font-bold text-[#0969da] dark:text-[#58a6ff] font-mono mt-1 block">
                {breakdown?.primaryTime || algorithm.timeComplexity}
              </code>
            </div>

            <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
              <span className="text-[10px] font-bold text-[#656d76] dark:text-[#8b949e] uppercase tracking-wider block">
                Auxiliary Space
              </span>
              <code className="text-sm font-bold text-[#1a7f37] dark:text-[#3fb950] font-mono mt-1 block">
                {breakdown?.primarySpace || algorithm.spaceComplexity}
              </code>
            </div>

            <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
              <span className="text-[10px] font-bold text-[#656d76] dark:text-[#8b949e] uppercase tracking-wider block">
                Best Case
              </span>
              <code className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] font-mono mt-1 block">
                {breakdown?.bestCase || 'O(n)'}
              </code>
            </div>

            <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
              <span className="text-[10px] font-bold text-[#656d76] dark:text-[#8b949e] uppercase tracking-wider block">
                Worst Case
              </span>
              <code className="text-xs font-bold text-[#cf222e] dark:text-[#f85149] font-mono mt-1 block">
                {breakdown?.worstCase || 'O(n²)'}
              </code>
            </div>
          </div>
          {breakdown?.note && (
            <div className="p-3 rounded-xl bg-[#f6f8fa] dark:bg-[#0d1117] border border-[#d0d7de]/70 dark:border-[#30363d] text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
              <strong className="text-[#1f2328] dark:text-[#f0f6fc]">Performance Note:</strong> {breakdown.note}
            </div>
          )}
        </div>

        {/* 3. Embedded Interactive Visualizer Canvas */}
        {visualizerKey && (
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
                Interactive Telemetry Simulator
              </h2>
            </div>
            <AlgorithmVisualizerCanvas
              initialAlgorithm={visualizerKey}
              showSelector={false}
            />
          </section>
        )}

        {/* 4. Multi-Language Code Playground (GitHub Primer Syntax Viewer) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0969da] dark:text-[#58a6ff]" />
              Implementation &amp; Multi-Language Code
            </h2>
          </div>
          <AlgorithmCodeViewer
            codeMap={codeMap}
            algorithmName={algorithm.name}
            defaultLanguage="python"
          />
        </section>

        {/* 5. Step-by-Step Logic Breakdown */}
        <section className="p-6 rounded-2xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1a7f37] dark:text-[#3fb950]" />
            Algorithmic Execution Steps
          </h2>

          {algorithm.steps?.length ? (
            <ol className="space-y-2.5">
              {algorithm.steps.map((step, index) => (
                <li
                  key={`${index}-${step}`}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[#d0d7de]/70 dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] text-xs leading-relaxed"
                >
                  <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-[#0969da]/10 dark:bg-[#388bfd26] text-[#0969da] dark:text-[#58a6ff] font-mono font-bold text-[11px]">
                    {index + 1}
                  </span>
                  <span className="text-[#1f2328] dark:text-[#e6edf3] font-medium pt-0.5">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-[#57606a] dark:text-[#8b949e]">
              No sequential steps documented for this algorithm.
            </p>
          )}
        </section>

        {/* 6. Interview Cues & Traps */}
        <section className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-2">
            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-[#9a6700] dark:text-[#d29922]" />
              Interview Pattern Recognition
            </span>
            <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
              Identify this pattern whenever problems mention monotonic sorted data, search space halving, sub-segment optimizations, or pair sums.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] shadow-xs space-y-2">
            <span className="text-xs font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-[#cf222e] dark:text-[#f85149]" />
              Edge-Case Pitfalls
            </span>
            <p className="text-xs text-[#57606a] dark:text-[#8b949e] leading-relaxed">
              Watch out for integer overflow during midpoint addition, empty array boundary conditions, or duplicate values affecting loop termination.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
