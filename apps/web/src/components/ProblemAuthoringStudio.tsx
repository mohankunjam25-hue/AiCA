import { useState, useId } from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Eye,
  FileText,
  Code2,
  Tag,
  Clock,
  Cpu,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Layers,
  Terminal,
  Download,
  Upload,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  HelpCircle,
  Sliders
} from 'lucide-react';
import {
  Problem,
  ProblemDifficulty,
  ProblemLifecycleStatus,
  TestCase
} from '@aica/shared';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export interface ProblemFormData {
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  status: ProblemLifecycleStatus;
  tags: string[];
  description: string;
  constraints: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
  starterPython: string;
  starterJs: string;
  starterCpp: string;
  starterJava: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{
    id?: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    isEdgeCase?: boolean;
    explanation?: string;
    weight?: number;
  }>;
}

export const POPULAR_TAGS = [
  'Arrays',
  'Strings',
  'Hash Table',
  'Dynamic Programming',
  'Two Pointers',
  'Binary Search',
  'Greedy',
  'Trees',
  'Binary Tree',
  'Graphs',
  'Depth-First Search',
  'Breadth-First Search',
  'Sorting',
  'Stack',
  'Queue',
  'Heap / Priority Queue',
  'Recursion',
  'Sliding Window',
  'Math',
  'Bit Manipulation',
  'Divide and Conquer'
];

export const CONSTRAINT_TEMPLATES = [
  '1 <= n <= 10^5',
  '-10^9 <= nums[i] <= 10^9',
  '0 <= target <= 10^9',
  's consists of lowercase English letters.',
  '1 <= s.length <= 10^5',
  'All elements in nums are unique.',
  'Expected Time Complexity: O(N)',
  'Expected Auxiliary Space: O(1)'
];

export const DEFAULT_STARTER_CODE = {
  python: `import sys

def solve():
    # Read standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # TODO: Implement your solution here
    pass

if __name__ == '__main__':
    solve()
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

using namespace std;

void solve() {
    // Read standard input
    // int n;
    // if (cin >> n) { ... }
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    solve();
    return 0;
}
`,
  java: `import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: Read standard input and print output
    }
}
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim();
    if (!input) return;
    
    // TODO: Process input and console.log the result
}

solve();
`
};

export const DEFAULT_FORM_DATA: ProblemFormData = {
  title: '',
  slug: '',
  difficulty: 'MEDIUM',
  status: 'UNPUBLISHED',
  tags: ['Arrays', 'Algorithms'],
  description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum and return *its sum*.

A **subarray** is a contiguous part of an array.`,
  constraints: [
    '1 <= nums.length <= 10^5',
    '-10^4 <= nums[i] <= 10^4'
  ],
  timeLimitMs: 2000,
  memoryLimitKb: 262144,
  starterPython: DEFAULT_STARTER_CODE.python,
  starterCpp: DEFAULT_STARTER_CODE.cpp,
  starterJava: DEFAULT_STARTER_CODE.java,
  starterJs: DEFAULT_STARTER_CODE.javascript,
  examples: [
    {
      input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
      output: '6',
      explanation: 'The subarray [4,-1,2,1] has the largest sum 6.'
    },
    {
      input: 'nums = [1]',
      output: '1',
      explanation: 'The subarray [1] has the largest sum 1.'
    }
  ],
  testCases: [
    {
      input: '9\n-2 1 -3 4 -1 2 1 -5 4',
      expectedOutput: '6',
      isPublic: true,
      isEdgeCase: false,
      explanation: 'Sample test case from problem description'
    },
    {
      input: '1\n1',
      expectedOutput: '1',
      isPublic: true,
      isEdgeCase: false,
      explanation: 'Single element base case'
    },
    {
      input: '5\n5 4 -1 7 8',
      expectedOutput: '23',
      isPublic: false,
      isEdgeCase: false,
      explanation: 'All positive with single negative'
    },
    {
      input: '3\n-3 -2 -1',
      expectedOutput: '-1',
      isPublic: false,
      isEdgeCase: true,
      explanation: 'All negative values edge case'
    }
  ]
};

type StudioTab = 'metadata' | 'description' | 'examples' | 'code' | 'testcases' | 'review';

export const STUDIO_STEPS: { key: StudioTab; stepNum: number; label: string; icon: any }[] = [
  { key: 'metadata', stepNum: 1, label: 'Metadata', icon: Tag },
  { key: 'description', stepNum: 2, label: 'Specification', icon: FileText },
  { key: 'examples', stepNum: 3, label: 'Examples', icon: HelpCircle },
  { key: 'code', stepNum: 4, label: 'Starter Code', icon: Code2 },
  { key: 'testcases', stepNum: 5, label: 'Test Cases', icon: ShieldCheck },
  { key: 'review', stepNum: 6, label: 'Pre-Flight', icon: CheckCircle2 }
];

interface ProblemAuthoringStudioProps {
  initialData?: ProblemFormData;
  editingProblemId?: string | null;
  onSuccess?: (savedProblem: any) => void;
  onCancel?: () => void;
  isStandalone?: boolean;
}

export function ProblemAuthoringStudio({
  initialData,
  editingProblemId,
  onSuccess,
  onCancel,
  isStandalone = false
}: ProblemAuthoringStudioProps) {
  const user = useAuthStore((s) => s.user);
  const isStudent = user?.role === 'STUDENT';

  const [formData, setFormData] = useState<ProblemFormData>(initialData || DEFAULT_FORM_DATA);
  const [activeTab, setActiveTab] = useState<StudioTab>('metadata');
  const [activeLangTab, setActiveLangTab] = useState<'python' | 'cpp' | 'java' | 'javascript'>('python');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const currentStepIdx = STUDIO_STEPS.findIndex((s) => s.key === activeTab);
  const prevStep = currentStepIdx > 0 ? STUDIO_STEPS[currentStepIdx - 1] : null;
  const nextStep = currentStepIdx < STUDIO_STEPS.length - 1 ? STUDIO_STEPS[currentStepIdx + 1] : null;

  // Quick inputs
  const [tagInput, setTagInput] = useState('');
  const [constraintInput, setConstraintInput] = useState('');
  const [showJsonBulkModal, setShowJsonBulkModal] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');
  const [bulkJsonError, setBulkJsonError] = useState<string | null>(null);

  // Preview toggle in description tab
  const [showDescPreview, setShowDescPreview] = useState(false);

  // Auto generate slug from title
  const handleAutoSlug = () => {
    if (!formData.title.trim()) return;
    const generated = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setFormData((prev) => ({ ...prev, slug: generated }));
  };

  // Tag management
  const handleAddTag = (tagToAdd: string) => {
    const clean = tagToAdd.trim();
    if (!clean) return;
    if (!formData.tags.includes(clean)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove)
    }));
  };

  // Constraint management
  const handleAddConstraint = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    setFormData((prev) => ({ ...prev, constraints: [...prev.constraints, clean] }));
    setConstraintInput('');
  };

  const handleRemoveConstraint = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      constraints: prev.constraints.filter((_, i) => i !== index)
    }));
  };

  // Examples management
  const handleAddExample = () => {
    setFormData((prev) => ({
      ...prev,
      examples: [
        ...prev.examples,
        { input: '', output: '', explanation: '' }
      ]
    }));
  };

  const handleUpdateExample = (
    index: number,
    field: 'input' | 'output' | 'explanation',
    val: string
  ) => {
    setFormData((prev) => {
      const updated = [...prev.examples];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, examples: updated };
    });
  };

  const handleRemoveExample = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }));
  };

  // Test Case management
  const handleAddTestCase = (isPublic = false, isEdge = false) => {
    setFormData((prev) => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        {
          input: '',
          expectedOutput: '',
          isPublic,
          isEdgeCase: isEdge,
          explanation: isPublic ? 'Sample test case' : isEdge ? 'Edge evaluation case' : 'Strict hidden test case',
          weight: 1.0
        }
      ]
    }));
  };

  const handleUpdateTestCase = (
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      const updated = [...prev.testCases];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, testCases: updated };
    });
  };

  const handleDuplicateTestCase = (index: number) => {
    const target = formData.testCases[index];
    const copy = {
      ...target,
      id: undefined,
      explanation: `${target.explanation || 'Case'} (Copy)`
    };
    setFormData((prev) => ({
      ...prev,
      testCases: [...prev.testCases, copy]
    }));
  };

  const handleRemoveTestCase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  // Bulk JSON Import / Export
  const handleOpenBulkJson = () => {
    setBulkJsonText(JSON.stringify(formData.testCases, null, 2));
    setBulkJsonError(null);
    setShowJsonBulkModal(true);
  };

  const handleApplyBulkJson = () => {
    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed)) {
        throw new Error('Test cases payload must be a JSON array of objects.');
      }
      for (const item of parsed) {
        if (typeof item.input !== 'string' || typeof item.expectedOutput !== 'string') {
          throw new Error('Each test case must contain "input" and "expectedOutput" strings.');
        }
      }
      setFormData((prev) => ({ ...prev, testCases: parsed }));
      setShowJsonBulkModal(false);
    } catch (err: any) {
      setBulkJsonError(err.message || 'Invalid JSON format.');
    }
  };

  // Validation checks
  const publicTestCount = formData.testCases.filter((tc) => tc.isPublic).length;
  const hiddenTestCount = formData.testCases.filter((tc) => !tc.isPublic).length;
  const edgeTestCount = formData.testCases.filter((tc) => tc.isEdgeCase).length;

  const validationIssues: string[] = [];
  if (!formData.title.trim() || formData.title.length < 3) {
    validationIssues.push('Problem title must be at least 3 characters.');
  }
  if (!formData.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
    validationIssues.push('Slug must be lowercase alphanumeric with hyphens (e.g. "max-subarray-sum").');
  }
  if (!formData.description.trim() || formData.description.length < 10) {
    validationIssues.push('Description must be at least 10 characters.');
  }
  if (formData.tags.length === 0) {
    validationIssues.push('At least one algorithmic topic tag is required.');
  }
  if (formData.status === 'PUBLISHED') {
    if (publicTestCount < 1) {
      validationIssues.push('Publishing requires at least 1 Public testcase (Sample for students).');
    }
    if (hiddenTestCount < 1) {
      validationIssues.push('Publishing requires at least 1 Hidden testcase for zero-leakage evaluation.');
    }
  }

  const [showLivePreview, setShowLivePreview] = useState(true);

  const isStepComplete = (key: StudioTab): boolean => {
    switch (key) {
      case 'metadata':
        return Boolean(formData.title.trim().length >= 3 && formData.slug.trim().length >= 3 && formData.tags.length > 0);
      case 'description':
        return Boolean(formData.description.trim().length >= 10);
      case 'examples':
        return Boolean(formData.examples.length >= 1 && formData.examples[0].input && formData.examples[0].output);
      case 'code':
        return Boolean(formData.starterPython.trim() || formData.starterCpp.trim() || formData.starterJava.trim() || formData.starterJs.trim());
      case 'testcases':
        return Boolean(formData.testCases.length >= 2 && publicTestCount >= 1 && hiddenTestCount >= 1);
      case 'review':
        return Boolean(validationIssues.length === 0);
      default:
        return false;
    }
  };

  const completedStepsCount = STUDIO_STEPS.filter((s) => isStepComplete(s.key)).length;
  const progressPercent = Math.round((completedStepsCount / STUDIO_STEPS.length) * 100);

  // Handle Form Submission
  const handleSubmit = async (targetStatus?: ProblemLifecycleStatus) => {
    setError(null);
    setSuccess(null);

    const effectiveStatus = isStudent ? 'PRACTICE' : (targetStatus || formData.status);

    // Run validations
    if (!formData.title.trim() || formData.title.length < 3) {
      setError('Please provide a valid problem title (at least 3 characters).');
      setActiveTab('metadata');
      return;
    }
    if (!formData.slug.trim() || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      setError('Slug must consist of lowercase alphanumeric characters separated by hyphens (e.g. "two-sum").');
      setActiveTab('metadata');
      return;
    }
    if (!formData.description.trim() || formData.description.length < 10) {
      setError('Problem statement description must be at least 10 characters.');
      setActiveTab('description');
      return;
    }
    if (formData.tags.length === 0) {
      setError('Please specify at least one topic tag (e.g. Arrays, Dynamic Programming).');
      setActiveTab('metadata');
      return;
    }

    if (effectiveStatus === 'PUBLISHED' && !isStudent) {
      const hasPub = formData.testCases.some((tc) => tc.isPublic);
      const hasHid = formData.testCases.some((tc) => !tc.isPublic);
      if (!hasPub || !hasHid) {
        setError('Cannot publish problem: at least 1 public testcase and 1 hidden testcase are strictly required.');
        setActiveTab('testcases');
        return;
      }
    }

    if (isStudent && formData.testCases.length === 0) {
      setError('Please add at least one test case to practice against.');
      setActiveTab('testcases');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      difficulty: formData.difficulty,
      status: effectiveStatus,
      isCustomPractice: isStudent,
      practiceVisibility: isStudent ? 'PRIVATE' : undefined,
      tags: formData.tags.length > 0 ? formData.tags : ['Practice'],
      description: formData.description.trim(),
      constraints: formData.constraints,
      examples: formData.examples.filter((ex) => ex.input.trim() && ex.output.trim()),
      timeLimitMs: Number(formData.timeLimitMs),
      memoryLimitKb: Number(formData.memoryLimitKb),
      starterCode: {
        python: formData.starterPython,
        javascript: formData.starterJs,
        cpp: formData.starterCpp,
        java: formData.starterJava
      },
      testCases: formData.testCases.filter((tc) => tc.input.trim() && tc.expectedOutput.trim())
    };

    try {
      let savedProblem: Problem;
      if (editingProblemId) {
        const endpoint = isStudent ? `/problems/practice/${editingProblemId}` : `/problems/${editingProblemId}`;
        const res = await api.put(endpoint, payload);
        savedProblem = res.data.data;
        setSuccess(`Problem "${payload.title}" updated successfully!`);
      } else {
        const endpoint = isStudent ? '/problems/practice' : '/problems';
        const res = await api.post(endpoint, payload);
        savedProblem = res.data.data;
        setSuccess(
          `Problem "${payload.title}" created successfully and saved to ${
            isStudent ? 'your personal practice lab' : 'catalog'
          }!`
        );
      }

      if (onSuccess) {
        setTimeout(() => onSuccess(savedProblem), 800);
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save problem.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white dark:bg-[#0d1117] min-h-[calc(100vh-64px)]">
      {/* Studio Header Bar */}
      <header className="shrink-0 h-14 border-b border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] px-4 sm:px-6 flex items-center justify-between gap-3 z-10 sticky top-0">
        <div className="flex items-center gap-3 min-w-0">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#21262d] text-xs font-semibold cursor-pointer transition shrink-0"
              title="Return to Problem Management"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Problems</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#d0d7de] dark:bg-[#30363d] shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-md bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-[#1f2328] dark:text-[#f0f6fc] truncate">
              {editingProblemId ? `Edit: ${formData.title || 'Untitled Problem'}` : 'Problem Authoring Studio'}
            </h1>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
              formData.status === 'PUBLISHED'
                ? 'bg-[#dafbe1] text-[#1a7f37] dark:bg-[#1a7f37]/20 dark:text-[#3fb950] border-[#4ac26b]/30'
                : 'bg-[#fff8c5] text-[#9a6700] dark:bg-[#9a6700]/20 dark:text-[#d29922] border-[#d4a72c]/30'
            }`}>
              {formData.status}
            </span>
          </div>
        </div>

        {/* Global Studio Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLivePreview((prev) => !prev)}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition ${
              showLivePreview
                ? 'border-[#8250df]/40 bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff]'
                : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
            }`}
            title="Toggle Live Catalog Card Preview"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showLivePreview ? 'Hide Preview' : 'Show Preview'}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('UNPUBLISHED')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#24292f] dark:text-[#f0f6fc] hover:bg-[#f6f8fa] dark:hover:bg-[#30363d] text-xs font-semibold cursor-pointer transition disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSubmit('PUBLISHED')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] text-white text-xs font-bold shadow-2xs cursor-pointer transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{editingProblemId ? 'Save & Publish' : 'Publish Problem'}</span>
          </button>
        </div>
      </header>

      {/* Alert Notices */}
      {error && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2.5 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{success}</span>
        </div>
      )}

      {/* 3-Panel Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Step Sidebar (240px fixed) */}
        <aside className="w-60 shrink-0 border-r border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex flex-col justify-between overflow-y-auto p-3.5">
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97] px-2 block">
              Curriculum Steps
            </span>

            <nav className="space-y-1">
              {STUDIO_STEPS.map((step) => {
                const isCurrent = activeTab === step.key;
                const isComplete = isStepComplete(step.key);
                const count =
                  step.key === 'metadata'
                    ? formData.tags.length
                    : step.key === 'examples'
                    ? formData.examples.length
                    : step.key === 'testcases'
                    ? formData.testCases.length
                    : undefined;

                return (
                  <button
                    key={step.key}
                    type="button"
                    onClick={() => setActiveTab(step.key)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition cursor-pointer ${
                      isCurrent
                        ? 'bg-white dark:bg-[#21262d] text-[#1f2328] dark:text-[#f0f6fc] font-bold shadow-xs border border-[#d0d7de] dark:border-[#30363d]'
                        : 'text-[#656d76] dark:text-[#848d97] hover:bg-white/60 dark:hover:bg-[#21262d]/60 hover:text-[#1f2328] dark:hover:text-[#f0f6fc]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                        isComplete
                          ? 'bg-[#1f883d] text-white'
                          : isCurrent
                          ? 'bg-[#8250df] text-white'
                          : 'bg-[#eaeef2] dark:bg-[#30363d] text-[#656d76] dark:text-[#848d97]'
                      }`}>
                        {isComplete ? '✓' : step.stepNum}
                      </span>
                      <span className="text-xs truncate">{step.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {typeof count === 'number' && (
                        <span className="text-[10px] font-mono px-1 rounded-full bg-[#d0d7de]/50 dark:bg-[#30363d] text-[#656d76] dark:text-[#848d97]">
                          {count}
                        </span>
                      )}
                      {isCurrent && <ChevronRight className="w-3.5 h-3.5 text-[#8250df]" />}
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Bottom Progress Box */}
          <div className="p-3 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] space-y-2 mt-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[#1f2328] dark:text-[#f0f6fc]">Step Progress</span>
              <span className="font-mono font-bold text-[#8250df] dark:text-[#bc8cff]">{progressPercent}%</span>
            </div>
            <div className="w-full bg-[#eaeef2] dark:bg-[#21262d] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#1f883d] h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-[#656d76] dark:text-[#848d97] block">
              {completedStepsCount} of {STUDIO_STEPS.length} steps validated
            </span>
          </div>
        </aside>

        {/* Center Workspace (flex-1 flex flex-col) */}
        <main className="flex-1 min-w-0 flex flex-col bg-white dark:bg-[#0d1117] overflow-hidden">
          {/* Active Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 text-xs">
            {/* TAB 1: METADATA & IDENTITY */}
            {activeTab === 'metadata' && (
          <div className="max-w-4xl space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Problem Title */}
              <div className="space-y-1">
                <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center justify-between">
                  <span>Problem Title *</span>
                  <span className="text-[11px] font-normal text-[#656d76] dark:text-[#848d97]">e.g. Maximum Subarray Sum</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter problem title..."
                  className="w-full px-3.5 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#f0f6fc] font-semibold focus:outline-none focus:border-[#8250df] text-sm shadow-2xs"
                />
              </div>

              {/* URL Slug */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">URL Slug *</label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="text-[11px] text-[#8250df] dark:text-[#bc8cff] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-generate from Title
                  </button>
                </div>
                <div className="flex items-center rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] overflow-hidden shadow-2xs focus-within:border-[#8250df]">
                  <span className="px-3 text-[#656d76] dark:text-[#848d97] font-mono text-[11px] bg-[#f6f8fa] dark:bg-[#161b22] border-r border-[#d0d7de] dark:border-[#30363d]">
                    /workspace/
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    placeholder="maximum-subarray-sum"
                    className="flex-1 px-3 py-2 bg-transparent font-mono text-[#1f2328] dark:text-[#f0f6fc] focus:outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">Difficulty Level *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    level: 'EASY' as ProblemDifficulty,
                    label: 'Easy',
                    sub: '1.5s / 128 MB',
                    desc: 'Linear traversals, basic logic, standard math.',
                    colorBadge: 'bg-[#dafbe1] text-[#1a7f37] dark:bg-[#1a7f37]/20 dark:text-[#3fb950] border-[#4ac26b]/30',
                    borderActive: 'border-[#1a7f37] ring-1 ring-[#1a7f37] bg-[#dafbe1]/30 dark:bg-[#1a7f37]/10',
                    timeLimit: 1500,
                    memory: 131072
                  },
                  {
                    level: 'MEDIUM' as ProblemDifficulty,
                    label: 'Medium',
                    sub: '2.0s / 256 MB',
                    desc: 'Two pointers, sliding window, trees, DP.',
                    colorBadge: 'bg-[#fff8c5] text-[#9a6700] dark:bg-[#9a6700]/20 dark:text-[#d29922] border-[#d4a72c]/30',
                    borderActive: 'border-[#9a6700] ring-1 ring-[#9a6700] bg-[#fff8c5]/30 dark:bg-[#9a6700]/10',
                    timeLimit: 2000,
                    memory: 262144
                  },
                  {
                    level: 'HARD' as ProblemDifficulty,
                    label: 'Hard',
                    sub: '3.0s / 512 MB',
                    desc: 'Advanced graphs, segment trees, complex state DP.',
                    colorBadge: 'bg-[#ffebe9] text-[#cf222e] dark:bg-[#cf222e]/20 dark:text-[#ff7b72] border-[#ff8182]/30',
                    borderActive: 'border-[#cf222e] ring-1 ring-[#cf222e] bg-[#ffebe9]/30 dark:bg-[#cf222e]/10',
                    timeLimit: 3000,
                    memory: 524288
                  }
                ].map((diff) => {
                  const isSelected = formData.difficulty === diff.level;
                  return (
                    <button
                      key={diff.level}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          difficulty: diff.level,
                          timeLimitMs: diff.timeLimit,
                          memoryLimitKb: diff.memory
                        }))
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? diff.borderActive
                          : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#8c959f]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${diff.colorBadge}`}>
                          {diff.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#656d76] dark:text-[#848d97]">
                          {diff.sub}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#656d76] dark:text-[#848d97] leading-tight mt-1">{diff.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lifecycle Status & Catalog Visibility */}
            <div className="space-y-1.5">
              <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc]">Catalog Publication Status *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'UNPUBLISHED' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-3 ${
                    formData.status === 'UNPUBLISHED'
                      ? 'border-[#9a6700] ring-1 ring-[#9a6700] bg-[#fff8c5]/30 dark:bg-[#9a6700]/10'
                      : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#8c959f]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#d29922] mt-1 shrink-0"></span>
                  <div>
                    <div className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs">
                      Unpublished (Draft)
                    </div>
                    <p className="text-[11px] text-[#656d76] dark:text-[#848d97] mt-0.5">
                      Hidden from student catalog. Safe for authoring & private test runs.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, status: 'PUBLISHED' })}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition flex items-start gap-3 ${
                    formData.status === 'PUBLISHED'
                      ? 'border-[#1a7f37] ring-1 ring-[#1a7f37] bg-[#dafbe1]/30 dark:bg-[#1a7f37]/10'
                      : 'border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#161b22] hover:border-[#8c959f]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2da44e] mt-1 shrink-0"></span>
                  <div>
                    <div className="font-bold text-[#1f2328] dark:text-[#f0f6fc] text-xs">
                      Published (Live in Catalog)
                    </div>
                    <p className="text-[11px] text-[#656d76] dark:text-[#848d97] mt-0.5">
                      Visible in public catalog & eligible for student submissions.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Algorithmic Topic Tags */}
            <div className="space-y-2 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
              <label className="font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center justify-between">
                <span>Topic Tags *</span>
                <span className="text-[11px] font-normal text-[#656d76] dark:text-[#848d97]">
                  {formData.tags.length} selected
                </span>
              </label>
              
              {/* Active Tags */}
              <div className="flex flex-wrap items-center gap-1.5 min-h-[38px] p-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117]">
                {formData.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#1f2328] dark:text-[#f0f6fc] font-semibold text-xs shadow-2xs"
                  >
                    <span>{t}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#656d76] dark:text-[#848d97] hover:text-[#cf222e] dark:hover:text-[#ff7b72] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {formData.tags.length === 0 && (
                  <span className="text-[#8c959f] text-xs italic px-1">No tags selected yet. Pick below or type custom tag.</span>
                )}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag(tagInput);
                    }
                  }}
                  placeholder="Type custom tag and press Enter (e.g. Kadane's Algorithm)..."
                  className="flex-1 px-3 py-2 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] text-[#1f2328] dark:text-[#f0f6fc] placeholder-[#8c959f] focus:outline-none focus:border-[#8250df]"
                />
                <button
                  type="button"
                  onClick={() => handleAddTag(tagInput)}
                  className="px-3.5 py-2 rounded-xl bg-[#f6f8fa] dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] font-bold text-[#24292f] dark:text-[#f0f6fc] cursor-pointer transition text-xs"
                >
                  Add Tag
                </button>
              </div>

              {/* Popular Tag Pills */}
              <div className="pt-1">
                <span className="text-[11px] text-[#656d76] dark:text-[#848d97] font-medium block mb-1.5">
                  Quick add standard topics:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_TAGS.map((popTag) => {
                    const isAdded = formData.tags.includes(popTag);
                    return (
                      <button
                        key={popTag}
                        type="button"
                        onClick={() => (isAdded ? handleRemoveTag(popTag) : handleAddTag(popTag))}
                        className={`px-2 py-0.5 rounded-md text-[11px] transition cursor-pointer font-medium ${
                          isAdded
                            ? 'bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff] border border-[#8250df]/40 font-semibold'
                            : 'bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:border-[#8c959f]'
                        }`}
                      >
                        {isAdded ? `✓ ${popTag}` : `+ ${popTag}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sandbox Execution Benchmarks */}
            <div className="space-y-3 pt-2 border-t border-[#d0d7de] dark:border-[#30363d]">
              <h3 className="font-bold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#8250df]" />
                Execution Sandbox Limits
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Time Limit */}
                <div className="p-3.5 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#656d76] dark:text-[#848d97]" />
                      CPU Time Limit
                    </label>
                    <span className="font-mono font-bold text-[#8250df] dark:text-[#bc8cff]">
                      {formData.timeLimitMs} ms ({(formData.timeLimitMs / 1000).toFixed(1)}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={200}
                    max={5000}
                    step={100}
                    value={formData.timeLimitMs}
                    onChange={(e) => setFormData({ ...formData, timeLimitMs: Number(e.target.value) })}
                    className="w-full accent-[#8250df] cursor-pointer"
                  />
                  <div className="flex items-center justify-between gap-1 pt-1">
                    {[1000, 2000, 3000, 5000].map((ms) => (
                      <button
                        key={ms}
                        type="button"
                        onClick={() => setFormData({ ...formData, timeLimitMs: ms })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                          formData.timeLimitMs === ms
                            ? 'bg-[#8250df] text-white font-bold'
                            : 'bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97]'
                        }`}
                      >
                        {ms / 1000}s
                      </button>
                    ))}
                  </div>
                </div>

                {/* Memory Limit */}
                <div className="p-3.5 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#0d1117] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#1f2328] dark:text-[#f0f6fc] flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#656d76] dark:text-[#848d97]" />
                      Memory RAM Limit
                    </label>
                    <span className="font-mono font-bold text-[#8250df] dark:text-[#bc8cff]">
                      {Math.round(formData.memoryLimitKb / 1024)} MB ({formData.memoryLimitKb} KB)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={32768}
                    max={1048576}
                    step={32768}
                    value={formData.memoryLimitKb}
                    onChange={(e) => setFormData({ ...formData, memoryLimitKb: Number(e.target.value) })}
                    className="w-full accent-[#8250df] cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {[
                      { mb: 64, kb: 65536 },
                      { mb: 128, kb: 131072 },
                      { mb: 256, kb: 262144 },
                      { mb: 512, kb: 524288 }
                    ].map((preset) => (
                      <button
                        key={preset.mb}
                        type="button"
                        onClick={() => setFormData({ ...formData, memoryLimitKb: preset.kb })}
                        className={`p-1 rounded text-center font-mono cursor-pointer transition ${
                          formData.memoryLimitKb === preset.kb
                            ? 'bg-[#8250df] text-white font-bold'
                            : 'bg-white dark:bg-[#21262d] border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97]'
                        }`}
                      >
                        <div className="text-[10px]">{preset.mb}MB</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROBLEM STATEMENT & SPECIFICATION */}
        {activeTab === 'description' && (
          <div className="max-w-4xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Problem Description (Markdown)</h3>
                <p className="text-slate-500 text-[11px]">
                  State the algorithmic problem clearly with parameters, mathematical formulation, and expected behavior.
                </p>
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDescPreview(false)}
                  className={`px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                    !showDescPreview ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Edit Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setShowDescPreview(true)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold cursor-pointer transition ${
                    showDescPreview ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Live Preview
                </button>
              </div>
            </div>

            {/* Quick Markdown Formatting Toolbar */}
            {!showDescPreview && (
              <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                {[
                  { label: 'Bold', syntax: '**text**' },
                  { label: 'Italic', syntax: '*text*' },
                  { label: 'Code', syntax: '`code`' },
                  { label: 'Code Block', syntax: '\n```python\n# code\n```\n' },
                  { label: 'List', syntax: '\n- Item 1\n- Item 2' },
                  { label: 'Math Formula', syntax: '$O(N \\log N)$' }
                ].map((tool) => (
                  <button
                    key={tool.label}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        description: prev.description + tool.syntax
                      }))
                    }
                    className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-400 text-slate-700 dark:text-slate-300 font-mono text-[11px] cursor-pointer"
                  >
                    {tool.label}
                  </button>
                ))}
              </div>
            )}

            {/* Editor or Preview */}
            {!showDescPreview ? (
              <textarea
                rows={14}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Write the full problem statement here with markdown formatting..."
                className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs leading-relaxed focus:outline-none focus:border-purple-500 shadow-xs"
              />
            ) : (
              <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 min-h-[300px] prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                {formData.description || <span className="text-slate-400 italic">No description entered yet.</span>}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('metadata')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('examples')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-md shadow-purple-600/20"
              >
                <span>Next: Constraints & Examples</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONSTRAINTS & EXAMPLES */}
        {activeTab === 'examples' && (
          <div className="max-w-4xl space-y-8">
            {/* Constraints Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Algorithmic Constraints</h3>
                  <p className="text-slate-500 text-[11px]">Define upper & lower bounds for $N$, memory, and value domains.</p>
                </div>
              </div>

              {/* Active Constraints List */}
              <div className="space-y-2">
                {formData.constraints.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                  >
                    <div className="flex items-center gap-2.5 font-mono text-slate-800 dark:text-slate-200">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{c}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConstraint(idx)}
                      className="p-1 rounded text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Custom Constraint */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={constraintInput}
                  onChange={(e) => setConstraintInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddConstraint(constraintInput);
                    }
                  }}
                  placeholder="e.g. 1 <= nums.length <= 10^5"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs focus:outline-none focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => handleAddConstraint(constraintInput)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Quick Template Chips */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">Common constraint templates:</span>
                <div className="flex flex-wrap gap-1.5">
                  {CONSTRAINT_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl}
                      type="button"
                      onClick={() => handleAddConstraint(tmpl)}
                      className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-purple-400 font-mono text-[11px] cursor-pointer"
                    >
                      + {tmpl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Examples Builder Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Problem Examples</h3>
                  <p className="text-slate-500 text-[11px]">Visible in problem statement with formatted input, output, and reasoning.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddExample}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Example
                </button>
              </div>

              <div className="space-y-4">
                {formData.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        Example {idx + 1}
                      </span>
                      {formData.examples.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExample(idx)}
                          className="text-rose-500 hover:text-rose-600 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Input Format:</span>
                        <input
                          type="text"
                          value={ex.input}
                          onChange={(e) => handleUpdateExample(idx, 'input', e.target.value)}
                          placeholder="nums = [-2,1,-3,4,-1,2,1,-5,4]"
                          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Expected Output:</span>
                        <input
                          type="text"
                          value={ex.output}
                          onChange={(e) => handleUpdateExample(idx, 'output', e.target.value)}
                          placeholder="6"
                          className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1">Explanation (Optional):</span>
                      <input
                        type="text"
                        value={ex.explanation || ''}
                        onChange={(e) => handleUpdateExample(idx, 'explanation', e.target.value)}
                        placeholder="The subarray [4,-1,2,1] has the largest sum 6."
                        className="w-full p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-sans text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('description')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-md shadow-purple-600/20"
              >
                <span>Next: Starter Code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: STARTER CODE BOILERPLATES */}
        {activeTab === 'code' && (
          <div className="max-w-4xl space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Multi-Language Starter Code</h3>
                <p className="text-slate-500 text-[11px]">
                  Provide student starter templates for Python 3, C++, Java, and JavaScript.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    starterPython: DEFAULT_STARTER_CODE.python,
                    starterCpp: DEFAULT_STARTER_CODE.cpp,
                    starterJava: DEFAULT_STARTER_CODE.java,
                    starterJs: DEFAULT_STARTER_CODE.javascript
                  }));
                }}
                className="text-purple-600 dark:text-purple-400 hover:underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Load Standard I/O Boilerplates
              </button>
            </div>

            {/* Language Sub-tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              {[
                { key: 'python', label: 'Python 3', ext: '.py' },
                { key: 'cpp', label: 'C++ (GCC 12)', ext: '.cpp' },
                { key: 'java', label: 'Java (OpenJDK 17)', ext: '.java' },
                { key: 'javascript', label: 'JavaScript (Node.js)', ext: '.js' }
              ].map((lang) => (
                <button
                  key={lang.key}
                  type="button"
                  onClick={() => setActiveLangTab(lang.key as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition flex items-center gap-1.5 ${
                    activeLangTab === lang.key
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>

            {/* Code Editor Area */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 overflow-hidden shadow-md">
              <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Starter template for {activeLangTab.toUpperCase()}</span>
                <span>Editable Monospace Buffer</span>
              </div>
              <textarea
                rows={16}
                value={
                  activeLangTab === 'python'
                    ? formData.starterPython
                    : activeLangTab === 'cpp'
                    ? formData.starterCpp
                    : activeLangTab === 'java'
                    ? formData.starterJava
                    : formData.starterJs
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    starterPython: activeLangTab === 'python' ? val : prev.starterPython,
                    starterCpp: activeLangTab === 'cpp' ? val : prev.starterCpp,
                    starterJava: activeLangTab === 'java' ? val : prev.starterJava,
                    starterJs: activeLangTab === 'javascript' ? val : prev.starterJs
                  }));
                }}
                className="w-full p-4 bg-transparent text-emerald-400 font-mono text-xs leading-relaxed focus:outline-none"
              />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('examples')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('testcases')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-md shadow-purple-600/20"
              >
                <span>Next: Test Cases Suite</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: TEST CASES SUITE */}
        {activeTab === 'testcases' && (
          <div className="max-w-4xl space-y-6">
            {/* Top Summary & Actions */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[11px] text-slate-400 block">Total Tests</span>
                  <span className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100">
                    {formData.testCases.length}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-800"></div>
                <div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-semibold">Public (Sample)</span>
                  <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {publicTestCount}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-800"></div>
                <div>
                  <span className="text-[11px] text-purple-600 dark:text-purple-400 block font-semibold">Hidden (Strict)</span>
                  <span className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
                    {hiddenTestCount}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:border-slate-800"></div>
                <div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-semibold">Edge Cases</span>
                  <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                    {edgeTestCount}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenBulkJson}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Code2 className="w-3.5 h-3.5 text-purple-500" />
                  JSON Import/Export
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTestCase(false, true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold cursor-pointer hover:bg-amber-100"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  + Edge Case
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTestCase(false, false)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Test Case
                </button>
              </div>
            </div>

            {/* Zero-Leakage Policy Warning Banner */}
            {(publicTestCount === 0 || hiddenTestCount === 0) && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>
                  <strong>Zero-Leakage Benchmark Policy:</strong> To publish a problem, you must have at least <strong>1 Public testcase</strong> (sample) and at least <strong>1 Hidden testcase</strong> (strict evaluation).
                </span>
              </div>
            )}

            {/* Test Case Cards List */}
            <div className="space-y-4">
              {formData.testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 shadow-xs"
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm">
                        #{idx + 1}
                      </span>

                      {/* Public vs Hidden Toggle */}
                      <button
                        type="button"
                        onClick={() => handleUpdateTestCase(idx, 'isPublic', !tc.isPublic)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono transition cursor-pointer flex items-center gap-1 border ${
                          tc.isPublic
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                        }`}
                      >
                        {tc.isPublic ? '✓ Public Sample' : '🔒 Hidden Strict'}
                      </button>

                      {/* Edge Case Toggle */}
                      <button
                        type="button"
                        onClick={() => handleUpdateTestCase(idx, 'isEdgeCase', !tc.isEdgeCase)}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer border transition ${
                          tc.isEdgeCase
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {tc.isEdgeCase ? '⚡ Edge Case' : 'Standard'}
                      </button>
                    </div>

                    {/* Quick Case Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateTestCase(idx)}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                        title="Duplicate test case"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {formData.testCases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTestCase(idx)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 cursor-pointer"
                          title="Remove test case"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Input / Expected Output Textareas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-semibold block">
                        Standard Input (stdin):
                      </span>
                      <textarea
                        rows={4}
                        required
                        value={tc.input}
                        onChange={(e) => handleUpdateTestCase(idx, 'input', e.target.value)}
                        placeholder="e.g.&#10;9&#10;-2 1 -3 4 -1 2 1 -5 4"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans font-semibold block">
                        Expected Output (stdout):
                      </span>
                      <textarea
                        rows={4}
                        required
                        value={tc.expectedOutput}
                        onChange={(e) => handleUpdateTestCase(idx, 'expectedOutput', e.target.value)}
                        placeholder="e.g.&#10;6"
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 text-xs focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Explanation / Notes */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={tc.explanation || ''}
                      onChange={(e) => handleUpdateTestCase(idx, 'explanation', e.target.value)}
                      placeholder="Test case purpose / explanation (e.g. Single element array)..."
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent text-slate-600 dark:text-slate-400 text-[11px] focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('review')}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-md shadow-purple-600/20"
              >
                <span>Next: Pre-Flight Review</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 6: REVIEW & PRE-FLIGHT VERIFICATION */}
        {activeTab === 'review' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Pre-Flight Curriculum Verification</h3>
              <p className="text-slate-500 text-[11px]">
                Verify all catalog specifications and sandbox limits before saving or publishing.
              </p>
            </div>

            {/* Validation Checklist */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                Sanity Checklist
              </h4>

              <div className="space-y-2">
                {[
                  {
                    title: 'Problem Title & Slug',
                    ok: formData.title.length >= 3 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug),
                    detail: `${formData.title || 'Untitled'} (/workspace/${formData.slug || 'no-slug'})`
                  },
                  {
                    title: 'Difficulty & Categorization',
                    ok: Boolean(formData.difficulty && formData.tags.length > 0),
                    detail: `${formData.difficulty} • Tags: ${formData.tags.join(', ') || 'None'}`
                  },
                  {
                    title: 'Problem Specification & Markdown',
                    ok: formData.description.length >= 10,
                    detail: `${formData.description.length} characters • ${formData.constraints.length} constraints`
                  },
                  {
                    title: 'Sample Examples',
                    ok: formData.examples.length >= 1,
                    detail: `${formData.examples.length} example cases defined`
                  },
                  {
                    title: 'Starter Code Templates',
                    ok: Boolean(formData.starterPython || formData.starterCpp || formData.starterJava || formData.starterJs),
                    detail: 'Boilerplate configured for Python, C++, Java, JS'
                  },
                  {
                    title: 'Evaluation Test Cases (Public + Hidden)',
                    ok: publicTestCount >= 1 && hiddenTestCount >= 1,
                    detail: `${publicTestCount} Public, ${hiddenTestCount} Hidden (${edgeTestCount} edge cases)`
                  }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {item.detail}
                        </span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      item.ok ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {item.ok ? 'PASSED' : 'ACTION REQUIRED'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Final Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">Save as Draft</h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Store problem as UNPUBLISHED in MongoDB. Only visible to staff.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmit('UNPUBLISHED')}
                  className="w-full py-2.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold cursor-pointer hover:bg-purple-100"
                >
                  Save as Draft
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/20 space-y-3 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">Publish to Student Catalog</h4>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Make live in catalog and enable execution engine for students.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSubmitting || validationIssues.length > 0}
                  onClick={() => handleSubmit('PUBLISHED')}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer transition shadow-md shadow-purple-600/30 disabled:opacity-40"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to Catalog'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>

        {/* Docked Wizard Footer */}
        <footer className="shrink-0 h-14 border-t border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] px-6 flex items-center justify-between gap-3">
          {/* Left: Previous Step Button */}
          <div>
            {prevStep ? (
              <button
                type="button"
                onClick={() => setActiveTab(prevStep.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#24292f] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold cursor-pointer transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back: {prevStep.label}</span>
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] text-[#656d76] dark:text-[#848d97] hover:text-[#1f2328] dark:hover:text-[#f0f6fc] text-xs font-semibold cursor-pointer transition"
              >
                Cancel
              </button>
            ) : <div />}
          </div>

          {/* Center: Step Progress Pill */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-[#656d76] dark:text-[#848d97]">
            <span>Step <strong className="text-[#1f2328] dark:text-[#f0f6fc]">{currentStepIdx + 1}</strong> of {STUDIO_STEPS.length}:</span>
            <span className="font-semibold text-[#8250df] dark:text-[#bc8cff]">{STUDIO_STEPS[currentStepIdx]?.label}</span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit('UNPUBLISHED')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#21262d] text-[#24292f] dark:text-[#f0f6fc] hover:bg-[#eaeef2] dark:hover:bg-[#30363d] text-xs font-semibold cursor-pointer transition disabled:opacity-50"
            >
              Save Draft
            </button>

            {nextStep ? (
              <button
                type="button"
                onClick={() => setActiveTab(nextStep.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#8250df] hover:bg-[#6639ba] text-white text-xs font-bold shadow-2xs cursor-pointer transition"
              >
                <span>Next: {nextStep.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || validationIssues.length > 0}
                onClick={() => handleSubmit('PUBLISHED')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1f883d] hover:bg-[#1a7f37] text-white text-xs font-bold shadow-2xs cursor-pointer transition disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Publish Problem</span>
              </button>
            )}
          </div>
        </footer>
      </main>

      {/* Right Live Catalog Preview Panel (320px fixed, collapsible) */}
      {showLivePreview && (
        <aside className="hidden xl:flex w-80 shrink-0 border-l border-[#d0d7de] dark:border-[#30363d] bg-[#f6f8fa] dark:bg-[#161b22] flex-col overflow-y-auto p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97] flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-[#8250df]" />
                Live Student Preview
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#8250df]/10 text-[#8250df] dark:text-[#bc8cff] font-semibold">
                Catalog Card
              </span>
            </div>
            <p className="text-[11px] text-[#656d76] dark:text-[#848d97]">
              Real-time preview of how students will see this problem in the library:
            </p>
          </div>

          {/* Simulated Problem Catalog Card */}
          <div className="p-4 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#1f2328] dark:text-[#f0f6fc] leading-snug truncate">
                  {formData.title.trim() || 'Untitled Problem'}
                </h4>
                <span className="font-mono text-[10px] text-[#656d76] dark:text-[#848d97] truncate block">
                  /workspace/{formData.slug || 'url-slug'}
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border shrink-0 ${
                formData.difficulty === 'EASY'
                  ? 'bg-[#dafbe1] text-[#1a7f37] dark:bg-[#1a7f37]/20 dark:text-[#3fb950] border-[#4ac26b]/30'
                  : formData.difficulty === 'MEDIUM'
                  ? 'bg-[#fff8c5] text-[#9a6700] dark:bg-[#9a6700]/20 dark:text-[#d29922] border-[#d4a72c]/30'
                  : 'bg-[#ffebe9] text-[#cf222e] dark:bg-[#cf222e]/20 dark:text-[#ff7b72] border-[#ff8182]/30'
              }`}>
                {formData.difficulty}
              </span>
            </div>

            {/* Execution Limit Badges */}
            <div className="flex items-center gap-3 text-[11px] text-[#656d76] dark:text-[#848d97]">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-[#8250df]" />
                {formData.timeLimitMs}ms
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Cpu className="w-3 h-3 text-[#8250df]" />
                {Math.round(formData.memoryLimitKb / 1024)}MB
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                formData.status === 'PUBLISHED'
                  ? 'bg-[#dafbe1] text-[#1a7f37]'
                  : 'bg-[#fff8c5] text-[#9a6700]'
              }`}>
                {formData.status}
              </span>
            </div>

            {/* Problem Snippet */}
            <p className="text-[11px] text-[#656d76] dark:text-[#848d97] line-clamp-3 leading-relaxed">
              {formData.description.trim() || 'Problem description statement snippet will render here...'}
            </p>

            {/* Topic Chips */}
            <div className="flex flex-wrap gap-1 pt-1 border-t border-[#d0d7de]/60 dark:border-[#30363d]/60">
              {formData.tags.map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#f6f8fa] dark:bg-[#21262d] text-[#656d76] dark:text-[#848d97] border border-[#d0d7de] dark:border-[#30363d]"
                >
                  {t}
                </span>
              ))}
              {formData.tags.length === 0 && (
                <span className="text-[10px] text-[#8c959f] italic">No topic tags added</span>
              )}
            </div>
          </div>

          {/* Pre-Flight Checklist Card */}
          <div className="p-4 rounded-xl border border-[#d0d7de] dark:border-[#30363d] bg-white dark:bg-[#0d1117] shadow-xs space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#656d76] dark:text-[#848d97] block">
              Pre-Flight Sanity Checks
            </span>
            <div className="space-y-1.5 text-xs">
              {[
                { label: 'Title & Slug (≥ 3 chars)', ok: formData.title.trim().length >= 3 && formData.slug.trim().length >= 3 },
                { label: 'Topic Tags (≥ 1 tag)', ok: formData.tags.length > 0 },
                { label: 'Problem Statement (≥ 10 chars)', ok: formData.description.trim().length >= 10 },
                { label: 'Sample Examples (≥ 1)', ok: formData.examples.length >= 1 },
                { label: 'Public Test Cases (≥ 1)', ok: publicTestCount >= 1 },
                { label: 'Hidden Test Cases (≥ 1)', ok: hiddenTestCount >= 1 }
              ].map((chk, i) => (
                <div key={i} className="flex items-center justify-between text-[11px]">
                  <span className={chk.ok ? 'text-[#1f2328] dark:text-[#f0f6fc]' : 'text-[#8c959f]'}>
                    {chk.label}
                  </span>
                  <span className={chk.ok ? 'text-[#1a7f37] font-bold' : 'text-[#cf222e] font-mono'}>
                    {chk.ok ? '✓' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>

      {/* Bulk JSON Import / Export Modal */}
      {showJsonBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-purple-500" />
                Bulk Test Cases JSON Import / Export
              </h3>
              <button
                type="button"
                onClick={() => setShowJsonBulkModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500 text-xs">
              Copy or paste test cases array in JSON format. Each item must have <code>input</code> and <code>expectedOutput</code>.
            </p>

            {bulkJsonError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950 text-rose-600 text-xs font-semibold">
                {bulkJsonError}
              </div>
            )}

            <textarea
              rows={12}
              value={bulkJsonText}
              onChange={(e) => setBulkJsonText(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 font-mono text-xs focus:outline-none"
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowJsonBulkModal(false)}
                className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBulkJson}
                className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold cursor-pointer"
              >
                Apply Test Cases
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
