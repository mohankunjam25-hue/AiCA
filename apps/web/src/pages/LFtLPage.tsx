import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ArrowLeft,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Maximize,
  Minimize,
  SlidersHorizontal,
  Code2,
} from 'lucide-react';
import { Problem } from '@aica/shared';
import {
  FlowchartCanvas,
  FlowchartCanvasHandle,
} from '../components/flowchart/FlowchartCanvas';
import { FlowchartBlockPalette } from '../components/flowchart/FlowchartBlockPalette';
import { api } from '../services/api';

export function LFtLPage() {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [problemList, setProblemList] = useState<
    Array<{ id: string; slug: string; title: string; difficulty: string }>
  >([]);
  const [isProblemPickerOpen, setIsProblemPickerOpen] = useState(false);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [savedGraph, setSavedGraph] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Canvas Bridge State & Ref
  const canvasRef = useRef<FlowchartCanvasHandle>(null);
  const [canvasState, setCanvasState] = useState({
    isSaving: false,
    isInspectorOpen: false,
    varCount: 0,
  });

  // Track native fullscreen changes (via Esc or button)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Native fullscreen request failed:', err);
        });
      } else {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      }
    }
  };

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
    <div
      ref={containerRef}
      className={`flex flex-col w-full bg-slate-950 text-slate-100 overflow-hidden font-sans ${
        isFullscreen ? 'h-screen' : 'h-[calc(100vh-3.5rem)]'
      }`}
    >
      {/* Sleek Sub-Toolbar with Unified Header: Navigation, Block Palette, Actions */}
      <header className="h-11 border-b border-slate-800/90 bg-slate-900/95 px-2.5 sm:px-3 flex items-center justify-between gap-2 shrink-0 z-30 backdrop-blur-md select-none">
        {/* Left: Navigation & Problem Picker */}
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <Link
            to="/problems"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="Back to Problems"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <span className="font-bold text-xs tracking-wider text-purple-400 font-mono bg-purple-950/70 border border-purple-800/80 px-2 py-0.5 rounded-md">
            LFtL
          </span>

          <div className="h-4 w-[1px] bg-slate-800 shrink-0 hidden sm:block" />

          {/* Problem Selector Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsProblemPickerOpen(!isProblemPickerOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800/90 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer max-w-[150px] sm:max-w-[200px] md:max-w-xs truncate"
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

        {/* Center: Block Palette & Actions (Unified into Header) */}
        <div className="flex-1 flex items-center justify-center min-w-0 overflow-x-auto scrollbar-none py-0.5">
          <FlowchartBlockPalette
            onAddNode={(type) => canvasRef.current?.addNode(type)}
            onAutoAlign={() => canvasRef.current?.autoAlign()}
            onValidate={() => canvasRef.current?.validate()}
            onSave={problem ? () => canvasRef.current?.save() : undefined}
            isSaving={canvasState.isSaving}
          />
        </div>

        {/* Right: Problem Details Drawer, Inspector, Code Editor, Fullscreen Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {problem && (
            <button
              onClick={() => setIsDescriptionOpen(!isDescriptionOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                isDescriptionOpen
                  ? 'bg-blue-950/80 border-blue-700/80 text-blue-300'
                  : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
              }`}
              title="Problem Details"
            >
              {isDescriptionOpen ? (
                <PanelLeftClose className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <PanelLeftOpen className="w-3.5 h-3.5 text-blue-400" />
              )}
              <span className="hidden md:inline">Details</span>
            </button>
          )}

          <button
            onClick={() => canvasRef.current?.toggleInspector()}
            className={`relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              canvasState.isInspectorOpen
                ? 'bg-cyan-950/80 border-cyan-700/80 text-cyan-300'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Execution Inspector"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Inspector</span>
            {canvasState.varCount > 0 && (
              <span className="text-[10px] font-mono px-1 rounded-full bg-cyan-600 text-white font-bold">
                {canvasState.varCount}
              </span>
            )}
          </button>

          {problem && (
            <Link
              to={`/workspace/${problem.slug}`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-700 hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition"
              title="Open problem in Monaco Code Editor"
            >
              <Code2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden lg:inline">Code Editor</span>
            </Link>
          )}

          {/* Fullscreen Button (YouTube-style edge-to-edge expand) */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 ${
              isFullscreen
                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
            }`}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'}
          >
            {isFullscreen ? (
              <Minimize className="w-3.5 h-3.5" />
            ) : (
              <Maximize className="w-3.5 h-3.5" />
            )}
          </button>
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
            ref={canvasRef}
            key={slug || 'scratch'}
            problemId={slug}
            initialGraph={savedGraph}
            onStateChange={setCanvasState}
          />
        </main>
      </div>
    </div>
  );
}
