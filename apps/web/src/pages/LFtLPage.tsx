import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  GitFork,
  BookOpen,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  FileText,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { Problem } from '@aica/shared';
import { FlowchartCanvas } from '../components/flowchart/FlowchartCanvas';
import { api } from '../services/api';

export function LFtLPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemList, setProblemList] = useState<Array<{ id: string; slug: string; title: string; difficulty: string }>>([]);
  const [isProblemPickerOpen, setIsProblemPickerOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [savedGraph, setSavedGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch catalog problem list for the dropdown
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await api.get('/problems', { params: { limit: 20 } });
        if (res.data?.data?.problems) {
          setProblemList(res.data.data.problems);
        }
      } catch (err) {
        console.warn('Failed to fetch problems list:', err);
      }
    };
    fetchProblems();
  }, []);

  // Fetch problem details and saved flowchart
  useEffect(() => {
    if (!slug) {
      setProblem(null);
      setSavedGraph(null);
      return;
    }

    const fetchProblemAndFlowchart = async () => {
      setLoading(true);
      try {
        const probRes = await api.get(`/problems/${slug}`);
        if (probRes.data?.data) {
          setProblem(probRes.data.data);
        }

        const fcRes = await api.get(`/flowcharts/${slug}`);
        if (fcRes.data?.data) {
          setSavedGraph(fcRes.data.data);
        } else {
          setSavedGraph(null);
        }
      } catch (err) {
        console.warn('Could not load problem or saved flowchart:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemAndFlowchart();
  }, [slug]);

  const handleSelectProblem = (selectedSlug: string) => {
    setIsProblemPickerOpen(false);
    navigate(`/lftl/${selectedSlug}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sleek Sub-Toolbar */}
      <header className="h-11 border-b border-slate-800/90 bg-slate-900/95 px-3 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/problems"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="Back to Problems"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-bold text-xs tracking-wider text-purple-400 font-mono bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded-md">
              LFtL
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

          {/* Problem Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsProblemPickerOpen(!isProblemPickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer max-w-[220px] sm:max-w-xs truncate"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{problem ? problem.title : 'Select Problem'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {isProblemPickerOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1 z-50 max-h-80 overflow-y-auto">
                <div className="p-2 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                  Select a Problem
                </div>
                {problemList.map((p) => (
                  <button
                    key={p.slug}
                    onClick={() => handleSelectProblem(p.slug)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
                  >
                    <span className="truncate text-slate-200">{p.title}</span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded ${
                        p.difficulty === 'EASY'
                          ? 'bg-emerald-950 text-emerald-400'
                          : p.difficulty === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {p.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {problem && (
            <button
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white transition cursor-pointer"
              title={isDescriptionOpen ? 'Collapse problem details' : 'Show problem details'}
            >
              {isDescriptionOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Details</span>
            </button>
          )}

          {problem && (
            <Link
              to={`/workspace/${problem.slug}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition"
              title="Open problem in Monaco Code Editor"
            >
              <span>Code Editor</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main Layout Area: Edge-to-Edge Canvas with Slide-Over Details Sheet */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Slide-Over Problem Description Panel */}
        {problem && (
          <aside
            className={`absolute top-0 left-0 bottom-0 z-40 w-80 md:w-96 border-r border-slate-800/90 bg-slate-900/95 dark:bg-[#161b22]/98 backdrop-blur-xl shadow-2xl overflow-y-auto p-4 flex flex-col gap-4 text-xs transition-transform duration-200 ease-in-out ${
              isDescriptionOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header with Title & Close button */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-semibold text-xs text-slate-300">Problem Details</span>
              <button
                onClick={() => setIsDescriptionOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close Details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    problem.difficulty === 'EASY'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : problem.difficulty === 'MEDIUM'
                      ? 'bg-amber-950 text-amber-400 border border-amber-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {problem.difficulty}
                </span>
                <span className="text-[11px] text-slate-400">
                  {problem.tags?.join(', ')}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mb-2">
                {problem.title}
              </h2>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {problem.description}
              </div>
            </div>

            {/* Examples */}
            {problem.examples && problem.examples.length > 0 && (
              <div className="space-y-3">
                <div className="font-semibold text-slate-200 uppercase text-[10px] tracking-wider">
                  Examples
                </div>
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 font-mono text-xs"
                  >
                    <div>
                      <span className="text-slate-400">Input: </span>
                      <span className="text-cyan-300">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Output: </span>
                      <span className="text-emerald-300">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-[11px] text-slate-400 font-sans italic pt-1">
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Constraints */}
            {problem.constraints && problem.constraints.length > 0 && (
              <div className="space-y-1">
                <div className="font-semibold text-slate-200 uppercase text-[10px] tracking-wider">
                  Constraints
                </div>
                <ul className="list-disc list-inside text-slate-400 space-y-0.5 font-mono text-[11px]">
                  {problem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        )}

        {/* Backdrop for mobile / drawer focus */}
        {problem && isDescriptionOpen && (
          <div
            onClick={() => setIsDescriptionOpen(false)}
            className="absolute inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Canvas Workspace: 100% UNCONSTRAINED FULL-SCREEN */}
        <main className="flex-1 w-full h-full relative overflow-hidden bg-slate-950">
          <FlowchartCanvas
            key={slug || 'scratch'}
            problemId={slug}
            initialGraph={savedGraph}
          />
        </main>
      </div>
    </div>
  );
}
