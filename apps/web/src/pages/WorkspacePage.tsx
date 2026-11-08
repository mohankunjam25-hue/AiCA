import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  BarChart2,
  Workflow,
  ArrowLeftRight,
  ChevronLeft,
  ShieldCheck,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  X,
  Loader2,
  RotateCcw,
  Maximize2,
  Minimize2,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Columns,
  Copy,
  Check,
  GitFork,
  Sparkles
} from 'lucide-react';
import {
  Problem,
  EvaluationReport,
  SolutionComparison,
  MultiSolutionComparison,
  SupportedLanguage,
  LANGUAGE_CONFIGS
} from '@aica/shared';
import { MonacoWorkspace } from '../components/MonacoWorkspace';
import { EvaluationReportView } from '../components/EvaluationReportView';
import { useClipboard, useWorkspaceSplitter, useKeyboardShortcuts } from '../hooks';
import { SolutionComparisonView } from '../components/SolutionComparisonView';
import { MultiSolutionComparisonView } from '../components/MultiSolutionComparisonView';
import { DataFetchErrorCard } from '../components/ui/DataFetchErrorCard';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useDataCacheStore } from '../store/useDataCacheStore';
import { toast } from '../store/useToastStore';
import { getErrorMessage } from '../utils/errorUtils';

const FALLBACK_CATALOG_PROBLEMS: Record<string, Problem> = {
  'container-with-most-water': {
    id: '6aec58907aa3af64a5e5568a',
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Arrays', 'Two-Pointers', 'Greedy'],
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i-th\` line are \`(i, 0)\` and \`(i, height[i])\`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn *the maximum amount of water a container can store*.`,
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The max area is between index 1 and 8.'
      }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: {
      targetTimeMs: 20,
      pythonMultiplier: 4.0,
      jsMultiplier: 2.5,
      cppMultiplier: 1.0,
      javaMultiplier: 2.0
    },
    starterCode: {
      python: `import sys\n\ndef maxArea(height: list[int]) -> int:\n    left, right = 0, len(height) - 1\n    max_water = 0\n    while left < right:\n        width = right - left\n        max_water = max(max_water, min(height[left], height[right]) * width)\n        if height[left] < height[right]:\n            left += 1\n        else:\n            right -= 1\n    return max_water\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        n = int(lines[0])\n        h = [int(x) for x in lines[1:n+1]]\n        print(maxArea(h))\n`,
      javascript: `const fs = require('fs');\n\nfunction maxArea(height) {\n    let left = 0, right = height.length - 1;\n    let maxWater = 0;\n    while (left < right) {\n        const width = right - left;\n        maxWater = Math.max(maxWater, Math.min(height[left], height[right]) * width);\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return maxWater;\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 2) {\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    console.log(maxArea(nums));\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint maxArea(vector<int>& height) {\n    int left = 0, right = height.size() - 1;\n    int max_water = 0;\n    while (left < right) {\n        int width = right - left;\n        max_water = max(max_water, min(height[left], height[right]) * width);\n        if (height[left] < height[right]) left++;\n        else right--;\n    }\n    return max_water;\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> h(n);\n        for (int i = 0; i < n; i++) cin >> h[i];\n        cout << maxArea(h) << endl;\n    }\n    return 0;\n}\n`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static int maxArea(int[] height) {\n        int left = 0, right = height.length - 1;\n        int maxWater = 0;\n        while (left < right) {\n            int width = right - left;\n            maxWater = Math.max(maxWater, Math.min(height[left], height[right]) * width);\n            if (height[left] < height[right]) left++;\n            else right--;\n        }\n        return maxWater;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] h = new int[n];\n            for (int i = 0; i < n; i++) h[i] = sc.nextInt();\n            System.out.println(maxArea(h));\n        }\n    }\n}\n`
    },
    testCases: [
      { id: 'tc-wm-1', input: '9\n1 8 6 2 5 4 8 3 7', expectedOutput: '49', isPublic: true, isEdgeCase: false, weight: 1.0 },
      { id: 'tc-wm-2', input: '2\n1 1', expectedOutput: '1', isPublic: true, isEdgeCase: false, weight: 1.0 }
    ],
    totalSubmissions: 24,
    acceptedSubmissions: 15,
    acceptanceRate: 62.5,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'longest-substring-without-repeating': {
    id: '6aec58907aa3af64a5e55689',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Strings', 'Sliding-Window', 'Hash-Table'],
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.`,
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    examples: [
      {
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: {
      targetTimeMs: 20,
      pythonMultiplier: 4.0,
      jsMultiplier: 2.5,
      cppMultiplier: 1.0,
      javaMultiplier: 2.0
    },
    starterCode: {
      python: `import sys\n\ndef lengthOfLongestSubstring(s: str) -> int:\n    char_map = {}\n    left = 0\n    max_len = 0\n    for right, ch in enumerate(s):\n        if ch in char_map and char_map[ch] >= left:\n            left = char_map[ch] + 1\n        char_map[ch] = right\n        max_len = max(max_len, right - left + 1)\n    return max_len\n\nif __name__ == '__main__':\n    s = sys.stdin.read().rstrip('\\r\\n')\n    print(lengthOfLongestSubstring(s))\n`,
      javascript: `const fs = require('fs');\n\nfunction lengthOfLongestSubstring(s) {\n    const map = new Map();\n    let left = 0, maxLen = 0;\n    for (let right = 0; right < s.length; right++) {\n        const ch = s[right];\n        if (map.has(ch) && map.get(ch) >= left) {\n            left = map.get(ch) + 1;\n        }\n        map.set(ch, right);\n        maxLen = Math.max(maxLen, right - left + 1);\n    }\n    return maxLen;\n}\n\nconst input = fs.readFileSync(0, 'utf-8').replace(/\\r?\\n$/, '');\nconsole.log(lengthOfLongestSubstring(input));\n`,
      cpp: `#include <iostream>\n#include <string>\n#include <vector>\n#include <algorithm>\n\nusing namespace std;\n\nint lengthOfLongestSubstring(string s) {\n    vector<int> last(256, -1);\n    int left = 0, max_len = 0;\n    for (int right = 0; right < (int)s.size(); right++) {\n        unsigned char ch = s[right];\n        if (last[ch] >= left) left = last[ch] + 1;\n        last[ch] = right;\n        max_len = max(max_len, right - left + 1);\n    }\n    return max_len;\n}\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << lengthOfLongestSubstring(s) << endl;\n    }\n    return 0;\n}\n`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static int lengthOfLongestSubstring(String s) {\n        int[] last = new int[256];\n        Arrays.fill(last, -1);\n        int left = 0, maxLen = 0;\n        for (int right = 0; right < s.length(); right++) {\n            char ch = s.charAt(right);\n            if (last[ch] >= left) left = last[ch] + 1;\n            last[ch] = right;\n            maxLen = Math.max(maxLen, right - left + 1);\n        }\n        return maxLen;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            System.out.println(lengthOfLongestSubstring(sc.nextLine()));\n        }\n    }\n}\n`
    },
    testCases: [
      { id: 'tc-ls-1', input: 'abcabcbb', expectedOutput: '3', isPublic: true, isEdgeCase: false, weight: 1.0 },
      { id: 'tc-ls-2', input: 'bbbbb', expectedOutput: '1', isPublic: true, isEdgeCase: false, weight: 1.0 }
    ],
    totalSubmissions: 32,
    acceptedSubmissions: 18,
    acceptanceRate: 56.3,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'two-sum-optimal': {
    id: '6aec58907aa3af64a5e55688',
    title: 'Two Sum Optimal',
    slug: 'two-sum-optimal',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Arrays', 'Hash-Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to target*.\n\nYou may assume that each input would have ***exactly one solution***, and you may not use the same element twice.`,
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
    ],
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '0 1',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: {
      targetTimeMs: 15,
      pythonMultiplier: 4.0,
      jsMultiplier: 2.5,
      cppMultiplier: 1.0,
      javaMultiplier: 2.0
    },
    starterCode: {
      python: `import sys\n\ndef twoSum(nums: list[int], target: int) -> list[int]:\n    # Optimal Hash Map approach O(N)\n    lookup = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in lookup:\n            return [lookup[complement], i]\n        lookup[num] = i\n    return []\n\nif __name__ == '__main__':\n    lines = sys.stdin.read().split()\n    if len(lines) >= 3:\n        n = int(lines[0])\n        nums = [int(x) for x in lines[1:n+1]]\n        target = int(lines[n+1])\n        res = twoSum(nums, target)\n        print(f"{res[0]} {res[1]}")\n`,
      javascript: `const fs = require('fs');\n\nfunction twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}\n\nconst input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);\nif (input.length >= 3) {\n    const n = parseInt(input[0], 10);\n    const nums = input.slice(1, n + 1).map(Number);\n    const target = parseInt(input[n + 1], 10);\n    const [a, b] = twoSum(nums, target);\n    console.log(\`\${a} \${b}\`);\n}\n`,
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nusing namespace std;\n\npair<int, int> twoSum(const vector<int>& nums, int target) {\n    unordered_map<int, int> lookup;\n    for (int i = 0; i < (int)nums.size(); ++i) {\n        int comp = target - nums[i];\n        if (lookup.count(comp)) {\n            return {lookup[comp], i};\n        }\n        lookup[nums[i]] = i;\n    }\n    return {-1, -1};\n}\n\nint main() {\n    int n;\n    if (cin >> n) {\n        vector<int> nums(n);\n        for (int i = 0; i < n; ++i) cin >> nums[i];\n        int target;\n        cin >> target;\n        auto res = twoSum(nums, target);\n        cout << res.first << " " << res.second << endl;\n    }\n    return 0;\n}\n`,
      java: `import java.util.*;\n\npublic class Solution {\n    public static int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) {\n                return new int[]{map.get(comp), i};\n            }\n            map.put(nums[i], i);\n        }\n        return new int[]{-1, -1};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextInt()) {\n            int n = sc.nextInt();\n            int[] nums = new int[n];\n            for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n            int target = sc.nextInt();\n            int[] res = twoSum(nums, target);\n            System.out.println(res[0] + " " + res[1]);\n        }\n    }\n}\n`
    },
    testCases: [
      { id: 'tc-1', input: '4\n2 7 11 15\n9', expectedOutput: '0 1', isPublic: true, isEdgeCase: false, weight: 1.0 }
    ],
    totalSubmissions: 48,
    acceptedSubmissions: 36,
    acceptanceRate: 75.0,
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

// Aliases for IDs
FALLBACK_CATALOG_PROBLEMS['6aec58907aa3af64a5e5568a'] = FALLBACK_CATALOG_PROBLEMS['container-with-most-water'];
FALLBACK_CATALOG_PROBLEMS['6aec58907aa3af64a5e55689'] = FALLBACK_CATALOG_PROBLEMS['longest-substring-without-repeating'];
FALLBACK_CATALOG_PROBLEMS['6aec58907aa3af64a5e55688'] = FALLBACK_CATALOG_PROBLEMS['two-sum-optimal'];

function CopyableCodeBlock({ text, className = '' }: { text: string; className?: string }) {
  const { copy, copied } = useClipboard({ timeout: 1800 });
  return (
    <div className="relative group">
      <pre className={className}>{text}</pre>
      <button
        type="button"
        onClick={() => copy(text)}
        className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer flex items-center gap-1 shadow-2xs"
        title="Copy to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [forking, setForking] = useState(false);
  const [activeLeftTab, setActiveLeftTab] = useState<'desc' | 'report' | 'compare' | 'submissions'>('desc');
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [comparison, setComparison] = useState<SolutionComparison | null>(null);
  const [multiComparison, setMultiComparison] = useState<MultiSolutionComparison | null>(null);
  const [compareViewMode, setCompareViewMode] = useState<'matrix' | 'diff'>('matrix');
  const [pastSubmissions, setPastSubmissions] = useState<any[]>([]);
  const [loadingPastSubmissions, setLoadingPastSubmissions] = useState(false);
  const [submissionsError, setSubmissionsError] = useState<string | null>(null);
  const [inspectedCode, setInspectedCode] = useState<{ code: string; language: string; verdict: string; date: string } | null>(null);
  const [loadedCode, setLoadedCode] = useState<{ code: string; language: SupportedLanguage } | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [generatingComparison, setGeneratingComparison] = useState(false);
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'problem' | 'editor'>('editor');

  // Decoupled Resizable Splitter State
  const { containerRef, leftWidth, splitterProps } = useWorkspaceSplitter({
    storageKey: 'aica_workspace_left_split',
    defaultSplit: 40,
    min: 25,
    max: 70
  });
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('aica_workspace_left_collapsed') === 'true';
  });

  const toggleLeftCollapse = () => {
    if (isZenMode) {
      // Exit Zen Mode and immediately restore Left Problem panel
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch {}
      setIsZenMode(false);
      setIsLeftCollapsed(false);
      try {
        localStorage.setItem('aica_workspace_left_collapsed', 'false');
      } catch {}
      return;
    }

    setIsLeftCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aica_workspace_left_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const toggleZenMode = () => {
    setIsZenMode((prev) => {
      const next = !prev;
      if (next) {
        try {
          if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch {}
      } else {
        try {
          if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
          }
        } catch {}
      }
      return next;
    });
  };

  // Sync state if user exits native fullscreen via browser controls (e.g. Esc or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isZenMode) {
        setIsZenMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isZenMode]);

  // Keyboard Shortcuts for Workspace
  useKeyboardShortcuts([
    {
      key: 'b',
      ctrlOrMeta: true,
      description: 'Toggle Problem Panel',
      action: toggleLeftCollapse
    },
    {
      key: 'z',
      ctrlOrMeta: true,
      description: 'Toggle Zen Focus Mode',
      action: toggleZenMode
    },
    {
      key: 'Escape',
      description: 'Close Modal / Exit Zen Focus Mode',
      action: () => {
        if (inspectedCode) {
          setInspectedCode(null);
          return;
        }
        if (isZenMode) {
          toggleZenMode();
        }
      }
    }
  ]);

  const toggleCompareSelect = (subId: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(subId)) {
        return prev.filter((id) => id !== subId);
      }
      if (prev.length >= 5) {
        return [...prev.slice(1), subId];
      }
      return [...prev, subId];
    });
  };

  const handleGenerateComparison = async (idsToCompare?: string[]) => {
    const targetIds = idsToCompare || selectedForCompare;
    if (targetIds.length < 2) return;
    setGeneratingComparison(true);
    try {
      if (targetIds.length === 2 && !idsToCompare) {
        // Can generate both 2-way Diff and Multi matrix
        const [twoWayRes, multiRes] = await Promise.allSettled([
          api.post('/comparisons', { submissionIdA: targetIds[0], submissionIdB: targetIds[1] }),
          api.post('/comparisons/multi', { submissionIds: targetIds })
        ]);
        if (twoWayRes.status === 'fulfilled' && twoWayRes.value.data?.data) {
          setComparison(twoWayRes.value.data.data);
        }
        if (multiRes.status === 'fulfilled' && multiRes.value.data?.data) {
          setMultiComparison(multiRes.value.data.data);
        }
      } else {
        // Multi-solution evolution comparison
        const res = await api.post('/comparisons/multi', { submissionIds: targetIds });
        if (res.data?.data) {
          setMultiComparison(res.data.data);
          setCompareViewMode('matrix');
        }
      }
      setActiveLeftTab('compare');
      setSelectedForCompare([]);
    } catch (err: any) {
      toast.error(`Comparison failed: ${getErrorMessage(err)}`);
    } finally {
      setGeneratingComparison(false);
    }
  };

  const handleLoadIntoEditor = (submission: { code: string; language: string }) => {
    if (!problem?.id) return;
    const lang = (submission.language || 'python') as SupportedLanguage;
    localStorage.setItem(`draft_${problem.id}_${lang}`, submission.code);
    setLoadedCode({ code: submission.code, language: lang });
    setInspectedCode(null);
  };

  useEffect(() => {
    if (id) {
      if (id === '1') {
        navigate('/workspace/two-sum-optimal', { replace: true });
        return;
      }
      localStorage.setItem('last_active_problem', id);
      fetchProblem(id);
    }
  }, [id, navigate]);

  const fetchProblem = async (problemId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/problems/${problemId}`);
      if (res.data?.data) {
        setProblem(res.data.data);
        setLoading(false);
        return;
      }
    } catch (err: any) {
      console.warn('[WorkspacePage] API fetch failed, checking fallback catalog:', err.message);
    }

    // High availability fallback for catalog problems during live demonstrations
    const fallback =
      FALLBACK_CATALOG_PROBLEMS[problemId] ||
      Object.values(FALLBACK_CATALOG_PROBLEMS).find(
        (p) => p.slug === problemId || p.id === problemId
      );

    if (fallback) {
      setProblem(fallback);
    } else {
      setProblem(null);
    }
    setLoading(false);
  };

  const handleForkToPractice = async () => {
    if (!problem?.id) return;
    if (!user) {
      toast.info('Please sign in to fork this problem to your personal practice lab');
      navigate('/login');
      return;
    }
    setForking(true);
    try {
      const res = await api.post(`/problems/practice/${problem.id}/fork`, {
        customTitle: `${problem.title} (Practice)`,
        includeHiddenTests: true
      });
      const forkedProblem = res.data?.data?.problem;
      toast.success('Forked to your personal Practice Lab!');
      if (forkedProblem?.slug) {
        navigate(`/workspace/${forkedProblem.slug}`);
      } else if (forkedProblem?.id) {
        navigate(`/workspace/${forkedProblem.id}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to fork problem to practice lab');
    } finally {
      setForking(false);
    }
  };

  const fetchProblemSubmissions = async (force: boolean = false) => {
    if (!problem?.id) return;
    const cacheKey = `submissions_problem_${problem.id}`;
    const cached = useDataCacheStore.getState().get<any[]>(cacheKey);

    if (cached && !force) {
      setPastSubmissions(cached);
      setLoadingPastSubmissions(false);
      return;
    }

    if (!cached) setLoadingPastSubmissions(true);
    setSubmissionsError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const requests: Promise<any>[] = [
        api.get(`/submissions/problem/${problem.id}/solutions`)
      ];
      if (token) {
        requests.push(api.get(`/submissions/my?problemId=${problem.id}&limit=20`));
      }

      const results = await Promise.allSettled(requests);
      const communityRes = results[0];
      const myRes = token ? results[1] : null;

      const commSubs = communityRes.status === 'fulfilled' ? communityRes.value.data?.data || [] : [];
      const mySubs = myRes && myRes.status === 'fulfilled' ? myRes.value.data?.data?.submissions || [] : [];

      const seenIds = new Set<string>();
      const combined: any[] = [];

      for (const s of mySubs) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          combined.push({ ...s, isSelf: true });
        }
      }
      for (const s of commSubs) {
        if (!seenIds.has(s.id)) {
          seenIds.add(s.id);
          combined.push({ ...s, isSelf: false });
        }
      }

      setPastSubmissions(combined);
      useDataCacheStore.getState().set(cacheKey, combined);
    } catch (err: any) {
      console.warn('[WorkspacePage] Submissions fetch failed:', err.message);
      setSubmissionsError(getErrorMessage(err, 'Failed to retrieve problem submissions'));
    } finally {
      setLoadingPastSubmissions(false);
    }
  };

  const handleEvaluationComplete = async (reportId: string, submissionId: string) => {
    try {
      const res = await api.get(`/submissions/${submissionId}/report`);
      setReport(res.data.data);
      setActiveLeftTab('report');
      // Invalidate submissions & dashboard cache so fresh stats appear
      useDataCacheStore.getState().invalidate('submissions_problem_');
      useDataCacheStore.getState().invalidate('dashboard_data_');
      fetchProblemSubmissions(true);
    } catch (err: any) {
      console.warn('[WorkspacePage] Evaluation report deferred or not found:', err.message);
    }
  };

  const handleCompareClick = async () => {
    if (!problem?.id) return;
    setActiveLeftTab('compare');
    try {
      const [multiRes, twoWayRes] = await Promise.allSettled([
        api.get(`/comparisons/problem/${problem.id}/multi`),
        api.get(`/comparisons/problem/${problem.id}`)
      ]);

      if (multiRes.status === 'fulfilled' && multiRes.value.data?.data) {
        setMultiComparison(multiRes.value.data.data);
        setCompareViewMode('matrix');
      }
      if (twoWayRes.status === 'fulfilled' && twoWayRes.value.data?.data) {
        setComparison(twoWayRes.value.data.data);
      }
    } catch {
      // Comparison not yet generated for this problem; user can select from submissions
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-mono">Loading coding workspace...</div>;
  }

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">Problem Not Found</h2>
        <p className="text-sm text-slate-500 max-w-md">
          The requested problem challenge does not exist or has not yet been published to the catalog.
        </p>
        <Link
          to="/problems"
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition"
        >
          Return to Problem Catalog
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 overflow-hidden bg-white dark:bg-[#0d1117] transition-all duration-200 ${
        isZenMode
          ? 'fixed inset-0 z-50 h-screen w-screen bg-[#f6f8fa] dark:bg-[#010409]'
          : 'h-[calc(100vh-3.5rem)]'
      }`}
    >
      {/* Workspace Subheader (GitHub Repo Header Style with Responsive Controls) */}
      <div
        className={`shrink-0 px-3 sm:px-5 py-2 border-b transition-colors flex flex-wrap items-center justify-between gap-2.5 min-h-[48px] ${
          isZenMode
            ? 'bg-purple-950/20 dark:bg-[#161b22] border-purple-500/30 shadow-xs'
            : 'bg-[#f6f8fa] dark:bg-[#161b22] border-[#d0d7de] dark:border-[#30363d]'
        }`}
      >
        {/* Left: Breadcrumbs & Problem Meta */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
          {!isZenMode && (
            <>
              <Link
                to="/problems"
                className="flex items-center gap-1 text-xs text-[#0969da] dark:text-[#58a6ff] hover:underline font-medium shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Problems
              </Link>
              <span className="text-[#d0d7de] dark:text-[#30363d]">/</span>
            </>
          )}
          <h1 className="text-sm font-bold text-[#1f2328] dark:text-[#e6edf3] truncate max-w-[160px] sm:max-w-[260px] md:max-w-md">
            {problem.title}
          </h1>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border shrink-0 ${
              problem.difficulty === 'EASY'
                ? 'bg-[#2ea0431a] text-[#1a7f37] dark:text-[#3fb950] border-[#2ea04340]'
                : problem.difficulty === 'MEDIUM'
                ? 'bg-[#bb80091a] text-[#9a6700] dark:text-[#d29922] border-[#bb800940]'
                : 'bg-[#f851491a] text-[#cf222e] dark:text-[#f85149] border-[#f8514940]'
            }`}
          >
            {problem.difficulty}
          </span>

          {isZenMode && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shrink-0 animate-pulse">
              <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
              <span>ZEN FOCUS ACTIVE</span>
            </span>
          )}

          {!isZenMode && problem.isCustomPractice ? (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
              🧪 Practice Lab
            </span>
          ) : !isZenMode ? (
            <button
              type="button"
              onClick={handleForkToPractice}
              disabled={forking}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Fork this problem into your personal Practice Lab with editable test cases"
            >
              {forking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitFork className="w-3.5 h-3.5" />
              )}
              <span>{forking ? 'Forking...' : 'Fork to Practice'}</span>
            </button>
          ) : null}
        </div>

        {/* Right: Adaptive Segmented Switcher & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {/* Mobile/Tablet Viewport Segmented Control (< 1024px) */}
          <div className="flex lg:hidden items-center bg-[#eaeef2] dark:bg-[#21262d] p-0.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-xs">
            <button
              type="button"
              onClick={() => setMobileWorkspaceTab('problem')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                mobileWorkspaceTab === 'problem'
                  ? 'bg-white dark:bg-[#161b22] text-[#1f2328] dark:text-[#e6edf3] shadow-xs'
                  : 'text-[#656d76] dark:text-[#848d97]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Details</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileWorkspaceTab('editor')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                mobileWorkspaceTab === 'editor'
                  ? 'bg-[#8250df] text-white shadow-xs'
                  : 'text-[#656d76] dark:text-[#848d97]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
          </div>

          {/* Desktop Subnav Tabs (>= 1024px) */}
          <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveLeftTab('desc');
                if (isLeftCollapsed || isZenMode) toggleLeftCollapse();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeLeftTab === 'desc' && !isLeftCollapsed && !isZenMode
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Description</span>
            </button>
            <button
              onClick={() => {
                setActiveLeftTab('report');
                if (isLeftCollapsed || isZenMode) toggleLeftCollapse();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeLeftTab === 'report' && !isLeftCollapsed && !isZenMode
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Report</span>
              {report && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#2ea04326] text-[#1a7f37] dark:text-[#3fb950] border border-[#2ea04340]">
                  ✓
                </span>
              )}
            </button>
            <button
              onClick={() => {
                if (!comparison) handleCompareClick();
                setActiveLeftTab('compare');
                if (isLeftCollapsed || isZenMode) toggleLeftCollapse();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeLeftTab === 'compare' && !isLeftCollapsed && !isZenMode
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare</span>
            </button>
            <button
              onClick={() => {
                fetchProblemSubmissions();
                setActiveLeftTab('submissions');
                if (isLeftCollapsed || isZenMode) toggleLeftCollapse();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeLeftTab === 'submissions' && !isLeftCollapsed && !isZenMode
                  ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] border border-[#d0d7de] dark:border-[#30363d] shadow-2xs'
                  : 'text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#e6edf3] hover:bg-[#eaeef2] dark:hover:bg-[#21262d]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions</span>
              {pastSubmissions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#afb8c133] dark:bg-[#6e768166] text-[#24292f] dark:text-[#c9d1d9]">
                  {pastSubmissions.length}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Problem Panel Collapse Toggle (LeetCode Style: Give Editor 100% Width) */}
          <button
            type="button"
            onClick={toggleLeftCollapse}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isLeftCollapsed || isZenMode
                ? 'bg-[#0969da] text-white border-[#0969da] shadow-xs'
                : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
            title={
              isZenMode
                ? 'Exit Zen Focus & Show Problem Panel'
                : isLeftCollapsed
                ? 'Show Problem Description Panel'
                : 'Collapse Problem Panel (Full Editor Width)'
            }
          >
            {isLeftCollapsed || isZenMode ? (
              <PanelLeftOpen className="w-3.5 h-3.5" />
            ) : (
              <PanelLeftClose className="w-3.5 h-3.5" />
            )}
            <span>{isLeftCollapsed || isZenMode ? 'Show Problem' : 'Collapse Panel'}</span>
          </button>

          {/* Zen Focus Mode Button */}
          <button
            type="button"
            onClick={toggleZenMode}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isZenMode
                ? 'bg-[#8250df] text-white border-[#8250df] shadow-xs ring-2 ring-purple-400/40'
                : 'bg-white dark:bg-[#21262d] border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
            title={isZenMode ? 'Exit Zen Focus Mode (Esc)' : 'Zen Focus Mode (Fullscreen Code Editor)'}
          >
            {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden xl:inline">{isZenMode ? 'Exit Zen (Esc)' : 'Zen Focus'}</span>
          </button>
        </div>
      </div>

      {/* Main Resizable Canvas with Draggable Splitter */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 h-full flex flex-col lg:flex-row gap-0 p-2 sm:p-3 overflow-hidden bg-[#f6f8fa] dark:bg-[#010409] relative"
      >
        {/* Left Pane (Description / Report / Comparison) */}
        {!isZenMode && !isLeftCollapsed && (
          <div
            style={{ width: `${leftWidth}%` }}
            className={`${
              mobileWorkspaceTab === 'problem' ? 'flex' : 'hidden'
            } lg:flex flex-col h-full min-h-0 overflow-hidden w-full lg:w-auto shrink-0 transition-[width] duration-150`}
          >
            <div className="flex-1 h-full overflow-y-auto pr-0 lg:pr-1.5 space-y-4">
          {activeLeftTab === 'desc' && (
            <div className="min-h-full p-5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-2xl space-y-5 shadow-xs">
              {problem.isCustomPractice && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 text-purple-900 dark:text-purple-200 text-xs flex items-start gap-2.5">
                  <span className="text-base">🧪</span>
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-2">
                      <span>Personal Practice Lab Challenge</span>
                      {problem.authorMetadata?.username && (
                        <span className="text-[10px] font-normal text-purple-600 dark:text-purple-400">
                          by {problem.authorMetadata.username}
                        </span>
                      )}
                    </div>
                    <p className="text-purple-700 dark:text-purple-300 text-[11px] leading-relaxed">
                      This is an isolated personal practice challenge. You can run solutions, execute benchmarks, and test custom corner cases directly in the Linux sandbox without impacting public catalog metrics.
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold text-[#1f2328] dark:text-[#e6edf3]">{problem.title}</h2>
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {problem.tags.map((t) => (
                    <span
                      key={t}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-[#ddf4ff] text-[#0969da] dark:bg-[#388bfd1a] dark:text-[#58a6ff] border border-transparent dark:border-[#388bfd40] font-medium"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="prose dark:prose-invert text-sm text-[#24292f] dark:text-[#c9d1d9] leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {/* Examples (GitHub Code Block Style) */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">Examples</h3>
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3.5 rounded-md bg-[#f6f8fa] dark:bg-[#161b22] border border-[#d0d7de] dark:border-[#30363d] text-xs font-mono space-y-2">
                    <div>
                      <span className="text-[#57606a] dark:text-[#8b949e] font-sans block mb-1 font-semibold">Input:</span>
                      <CopyableCodeBlock
                        text={ex.input}
                        className="text-[#1f2328] dark:text-[#e6edf3] p-2 rounded bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] overflow-x-auto"
                      />
                    </div>
                    <div>
                      <span className="text-[#57606a] dark:text-[#8b949e] font-sans block mb-1 font-semibold">Output:</span>
                      <CopyableCodeBlock
                        text={ex.output}
                        className="text-[#1a7f37] dark:text-[#3fb950] p-2 rounded bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] overflow-x-auto font-bold"
                      />
                    </div>
                    {ex.explanation && (
                      <p className="text-[#57606a] dark:text-[#8b949e] font-sans text-xs pt-1 border-t border-[#d0d7de] dark:border-[#30363d]">
                        {ex.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Constraints */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#57606a] dark:text-[#8b949e] uppercase tracking-wider">Constraints</h3>
                <ul className="list-disc list-inside text-xs text-[#57606a] dark:text-[#8b949e] space-y-1 font-mono">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>

              {/* Benchmarks (GitHub Alert Box) */}
              <div className="p-3.5 rounded-md bg-[#ddf4ff40] dark:bg-[#388bfd1a] border border-[#54aeff66] dark:border-[#388bfd40] border-l-4 border-l-[#0969da] dark:border-l-[#2f81f7] text-xs text-[#0969da] dark:text-[#58a6ff] space-y-1">
                <span className="font-semibold block text-[#1f2328] dark:text-[#e6edf3]">Execution Sandbox Limits:</span>
                <div className="text-[#57606a] dark:text-[#8b949e]">Time Limit: {problem.timeLimitMs}ms &bull; Memory Limit: {Math.round(problem.memoryLimitKb / 1024)}MB</div>
                <div className="text-[#57606a] dark:text-[#8b949e]">Optimal Benchmark Target: {problem.benchmarks?.targetTimeMs || 15}ms</div>
              </div>
            </div>
          )}

          {activeLeftTab === 'report' && (
            <div>
              {report ? (
                <EvaluationReportView
                  key={report.id || report.submissionId}
                  report={report}
                  onCompareRequest={handleCompareClick}
                  onReportUpdate={setReport}
                />
              ) : (
                <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
                  Submit code to generate an AI evaluation report and complexity profile.
                </div>
              )}
            </div>
          )}

          {activeLeftTab === 'compare' && (
            <div className="space-y-4">
              {(multiComparison || comparison) ? (
                <>
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Evolution Mode:</span>
                      {multiComparison && (
                        <button
                          onClick={() => setCompareViewMode('matrix')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            compareViewMode === 'matrix'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          Multi-Solution Matrix ({multiComparison.solutions?.length || 3})
                        </button>
                      )}
                      {comparison && (
                        <button
                          onClick={() => setCompareViewMode('diff')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                            compareViewMode === 'diff'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          Side-by-Side Diff (A vs B)
                        </button>
                      )}
                    </div>
                    {pastSubmissions.length >= 2 && (
                      <button
                        onClick={() => {
                          setComparison(null);
                          setMultiComparison(null);
                        }}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                      >
                        Reset / Select Others
                      </button>
                    )}
                  </div>

                  {compareViewMode === 'matrix' && multiComparison ? (
                    <MultiSolutionComparisonView
                      comparison={multiComparison}
                      onSelectSolutionForEditor={(code, language) => handleLoadIntoEditor({ code, language })}
                    />
                  ) : comparison ? (
                    <SolutionComparisonView comparison={comparison} />
                  ) : null}
                </>
              ) : (
                <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                      <ArrowLeftRight className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        Evolutionary Solution Comparison
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Contrast multiple solutions to explore scaling deltas, memory differences, and AI Big-O trade-offs.
                      </p>
                    </div>
                  </div>

                  {pastSubmissions.length >= 2 ? (
                    <div className="space-y-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Select Submissions to Compare (2 to 5):
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {pastSubmissions.map((s, idx) => {
                          const isSelected = selectedForCompare.includes(s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => toggleCompareSelect(s.id)}
                              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition ${
                                isSelected
                                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 font-semibold text-indigo-900 dark:text-indigo-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                                }`}>
                                  {isSelected ? '✓' : idx + 1}
                                </span>
                                <div>
                                  <span className="font-bold">{s.username || 'Student'}</span> &bull;{' '}
                                  <span className="font-mono">{s.verdict} ({s.language})</span>
                                </div>
                              </div>
                              <span className="font-mono text-slate-500">{s.executionTimeMs}ms</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">
                          {selectedForCompare.length} selected (min 2, max 5)
                        </span>
                        <button
                          onClick={() => handleGenerateComparison()}
                          disabled={generatingComparison || selectedForCompare.length < 2}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          {generatingComparison ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <BarChart2 className="w-3.5 h-3.5" />
                          )}
                          Generate Comparison Matrix
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 space-y-1.5 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      <Clock className="w-5 h-5 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        At least two submissions required
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Submit code with different algorithms to compare time/space trade-offs.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeLeftTab === 'submissions' && (
            <div className="p-5 bg-white dark:bg-[#0d1117] border border-[#d0d7de] dark:border-[#30363d] rounded-lg space-y-4 shadow-xs">
              {/* Collaborative Sorting Evolution Showcase Banner (GitHub Primer Alert Box) */}
              <div className="p-3.5 rounded-md bg-[#ddf4ff40] dark:bg-[#388bfd1a] border border-[#54aeff66] dark:border-[#388bfd40] border-l-4 border-l-[#0969da] dark:border-l-[#2f81f7] flex items-center justify-between flex-wrap gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Workflow className="w-3.5 h-3.5 text-[#0969da] dark:text-[#58a6ff]" />
                    <span className="text-xs font-bold text-[#1f2328] dark:text-[#e6edf3]">
                      Multi-Solution Evolution Arena
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57606a] dark:text-[#8b949e]">
                    Compare Student A (Bubble O(N²)) vs B (Merge O(N log N)) vs C (Quick O(N log N))
                  </p>
                </div>
                <button
                  onClick={handleCompareClick}
                  className="px-3 py-1.5 rounded-md bg-[#0969da] hover:bg-[#0860ca] dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] text-white font-semibold text-xs shadow-xs transition cursor-pointer"
                >
                  View Evolution Matrix &rarr;
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
                <div>
                  <h2 className="text-sm font-bold text-[#1f2328] dark:text-[#e6edf3]">
                    Collaborative Submissions & Versions
                  </h2>
                  <p className="text-xs text-[#57606a] dark:text-[#8b949e] mt-0.5">
                    Select 2 to 5 student solutions to generate an algorithmic evolution comparison
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedForCompare.length >= 2 && (
                    <button
                      onClick={() => handleGenerateComparison()}
                      disabled={generatingComparison}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0969da] hover:bg-[#0860ca] dark:bg-[#1f6feb] dark:hover:bg-[#388bfd] text-white text-xs font-semibold transition shadow-xs cursor-pointer"
                    >
                      {generatingComparison ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                      )}
                      Compare Selected ({selectedForCompare.length})
                    </button>
                  )}
                  <button
                    onClick={() => fetchProblemSubmissions(true)}
                    className="text-xs font-semibold text-[#57606a] dark:text-[#8b949e] hover:text-[#1f2328] dark:hover:text-[#e6edf3] cursor-pointer px-2 py-1 rounded-md border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#21262d]"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {loadingPastSubmissions ? (
                <div className="py-12 flex flex-col items-center justify-center text-[#57606a] dark:text-[#8b949e]">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  <p className="text-xs">Loading past submissions...</p>
                </div>
              ) : submissionsError && pastSubmissions.length === 0 ? (
                <div className="p-4">
                  <DataFetchErrorCard
                    compact
                    message={submissionsError}
                    onRetry={() => fetchProblemSubmissions(true)}
                    isRetrying={loadingPastSubmissions}
                  />
                </div>
              ) : pastSubmissions.length === 0 ? (
                <div className="py-12 text-center text-[#57606a] dark:text-[#8b949e] border border-dashed border-[#d0d7de] dark:border-[#30363d] rounded-md space-y-2">
                  <History className="w-8 h-8 text-[#8c959f] mx-auto" />
                  <p className="text-xs">No prior submissions recorded for this problem yet.</p>
                </div>
              ) : (
                <div className="border border-[#d0d7de] dark:border-[#30363d] rounded-md divide-y divide-[#d0d7de] dark:divide-[#30363d] overflow-hidden bg-white dark:bg-[#0d1117]">
                  {pastSubmissions.map((sub) => {
                    const isAccepted = sub.verdict === 'ACCEPTED';
                    const isSelected = selectedForCompare.includes(sub.id);
                    return (
                      <div
                        key={sub.id}
                        className={`p-3 flex items-center justify-between text-xs transition ${
                          isSelected
                            ? 'bg-[#ddf4ff40] dark:bg-[#388bfd1a]'
                            : 'hover:bg-[#f6f8fa] dark:hover:bg-[#161b22]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isAccepted ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#2ea043] shrink-0 inline-block" />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-[#cf222e] shrink-0 inline-block" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-[#1f2328] dark:text-[#e6edf3]">
                                {sub.verdict}
                              </span>
                              {sub.isSelf && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#afb8c133] dark:bg-[#6e768166] text-[#24292f] dark:text-[#c9d1d9]">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#57606a] dark:text-[#8b949e] flex items-center gap-1.5 mt-0.5">
                              <span className="uppercase font-semibold">{sub.language}</span>
                              <span>&bull;</span>
                              <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right font-mono mr-2">
                            <span className="block font-semibold text-[#1f2328] dark:text-[#e6edf3]">
                              {sub.executionTimeMs != null ? `${sub.executionTimeMs}ms` : '--'}
                            </span>
                            <span className="text-[10px] text-[#57606a] dark:text-[#8b949e]">
                              {sub.memoryUsedKb != null ? `${Math.round(sub.memoryUsedKb / 1024)}MB` : '--'}
                            </span>
                          </div>
                          <button
                            onClick={() => toggleCompareSelect(sub.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#0969da] text-white'
                                : 'bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2]'
                            }`}
                          >
                            {isSelected ? '✓ Selected' : 'Compare'}
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const res = await api.get(`/submissions/${sub.id}/report`);
                                setReport(res.data.data);
                                setActiveLeftTab('report');
                              } catch {
                                // deferred
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#0969da] dark:text-[#58a6ff] hover:bg-[#eaeef2] font-semibold text-[11px] transition cursor-pointer"
                          >
                            Report
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                const fullRes = await api.get(`/submissions/${sub.id}`);
                                setInspectedCode({
                                  code: fullRes.data.data.code,
                                  language: sub.language,
                                  verdict: sub.verdict,
                                  date: new Date(sub.createdAt).toLocaleString()
                                });
                              } catch {
                                // fallback
                              }
                            }}
                            className="px-2.5 py-1 rounded-md bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#e6edf3] hover:bg-[#eaeef2] font-semibold text-[11px] transition cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Mobile Bottom CTA: jump to Editor */}
          <div className="pt-2 pb-1 lg:hidden flex justify-end">
            <button
              type="button"
              onClick={() => setMobileWorkspaceTab('editor')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8250df] text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <span>Code Solution in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )}

        {/* Vertical Draggable Splitter Handle (Desktop only, hidden in Zen Mode or when Left Panel is Collapsed) */}
        {!isZenMode && !isLeftCollapsed && (
          <div
            {...splitterProps}
            className="hidden lg:flex items-center justify-center w-2.5 hover:w-3 cursor-col-resize group shrink-0 transition-all z-10 select-none"
          >
            <div className="w-1 h-8 rounded-full bg-[#d0d7de] dark:bg-[#30363d] group-hover:bg-[#8250df] group-hover:h-12 transition-all" />
          </div>
        )}

        {/* Right Pane (Monaco Editor Workspace) */}
        <div
          style={{ width: isZenMode || isLeftCollapsed ? '100%' : `${100 - leftWidth}%` }}
          className={`${
            mobileWorkspaceTab === 'editor' ? 'flex' : 'hidden'
          } lg:flex flex-col h-full min-h-0 w-full lg:w-auto flex-1 min-w-0 transition-[width] duration-150`}
        >
          <MonacoWorkspace
            problem={problem}
            onEvaluationComplete={handleEvaluationComplete}
            loadedCode={loadedCode}
            isZenMode={isZenMode}
            onToggleZenMode={toggleZenMode}
            isPanelCollapsed={isLeftCollapsed || isZenMode}
            onTogglePanelCollapse={toggleLeftCollapse}
          />
        </div>
      </div>

      {/* Code Snapshot Modal */}
      {inspectedCode && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Submitted Code Snapshot ({inspectedCode.language})
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {inspectedCode.verdict}
                </span>
              </div>
              <button
                onClick={() => setInspectedCode(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs">
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 whitespace-pre-wrap overflow-x-auto">
                {inspectedCode.code}
              </pre>
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
              <span>Submitted: {inspectedCode.date}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoadIntoEditor(inspectedCode)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Load into Editor
                </button>
                <button
                  onClick={() => setInspectedCode(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
