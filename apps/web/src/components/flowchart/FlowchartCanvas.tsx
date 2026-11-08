import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  ConnectionLineType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  FlowchartNodeType,
  FlowchartGraph,
  FlowchartExecutionResult,
  FlowchartExecutionStep,
  FlowchartValidationResult,
} from '@aica/shared';

import { StartEndNode } from './nodes/StartEndNode';
import { IONode } from './nodes/IONode';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { FlowchartEdge } from './edges/FlowchartEdge';
import { FlowchartBlockPalette } from './FlowchartBlockPalette';
import { FlowchartVCRControls } from './FlowchartVCRControls';
import { FlowchartMemoryHUD } from './FlowchartMemoryHUD';
import { FlowchartTestcaseDrawer } from './FlowchartTestcaseDrawer';
import {
  validateFlowchart,
  executeFlowchart,
} from '@aica/shared';
import { api } from '../../services/api';

const nodeTypes = {
  start: StartEndNode,
  end: StartEndNode,
  input: IONode,
  output: IONode,
  process: ProcessNode,
  decision: DecisionNode,
};

const edgeTypes = {
  flowchart: FlowchartEdge,
};

interface FlowchartCanvasProps {
  problemId?: string;
  initialGraph?: FlowchartGraph | null;
  onSave?: (graph: FlowchartGraph) => void;
}

export function FlowchartCanvas({
  problemId,
  initialGraph,
  onSave,
}: FlowchartCanvasProps) {
  // Initial demo template if graph is empty
  const defaultInitialNodes: Node[] = useMemo(() => {
    if (initialGraph && initialGraph.nodes && initialGraph.nodes.length > 0) {
      return initialGraph.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { ...n.data, nodeType: n.type },
      }));
    }
    return [
      {
        id: 'start-1',
        type: 'start',
        position: { x: 300, y: 50 },
        data: { label: 'Start', nodeType: 'start' },
      },
      {
        id: 'input-1',
        type: 'input',
        position: { x: 270, y: 150 },
        data: {
          label: 'Input',
          nodeType: 'input',
          inputVariables: ['a', 'b'],
        },
      },
      {
        id: 'process-1',
        type: 'process',
        position: { x: 260, y: 280 },
        data: {
          label: 'Process',
          nodeType: 'process',
          assignments: ['sum = a + b'],
        },
      },
      {
        id: 'output-1',
        type: 'output',
        position: { x: 270, y: 410 },
        data: {
          label: 'Output',
          nodeType: 'output',
          outputExpression: 'sum',
        },
      },
      {
        id: 'end-1',
        type: 'end',
        position: { x: 300, y: 530 },
        data: { label: 'End', nodeType: 'end' },
      },
    ];
  }, [initialGraph]);

  const defaultInitialEdges: Edge[] = useMemo(() => {
    if (initialGraph && initialGraph.edges) {
      return initialGraph.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
        type: 'flowchart',
        label: e.label,
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
        data: {
          branch: e.label,
          sourceHandle: e.sourceHandle,
        },
      }));
    }
    return [
      {
        id: 'e1',
        source: 'start-1',
        target: 'input-1',
        type: 'flowchart',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      },
      {
        id: 'e2',
        source: 'input-1',
        target: 'process-1',
        type: 'flowchart',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      },
      {
        id: 'e3',
        source: 'process-1',
        target: 'output-1',
        type: 'flowchart',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      },
      {
        id: 'e4',
        source: 'output-1',
        target: 'end-1',
        type: 'flowchart',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' },
      },
    ];
  }, [initialGraph]);

  const [nodes, setNodes, onNodesChange] = useNodesState(defaultInitialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultInitialEdges);

  // VCR Execution State
  const [executionResult, setExecutionResult] =
    useState<FlowchartExecutionResult | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [customInput, setCustomInput] = useState('15 25');
  const [testCaseResults, setTestCaseResults] = useState<any[] | null>(null);
  const [validationResult, setValidationResult] =
    useState<FlowchartValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluatingTests, setIsEvaluatingTests] = useState(false);

  const playTimerRef = useRef<any>(null);

  // Callback to update node data inline from custom node components
  const handleNodeDataChange = useCallback(
    (id: string, updates: any) => {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === id) {
            return {
              ...n,
              data: {
                ...n.data,
                ...updates,
              },
            };
          }
          return n;
        })
      );
    },
    [setNodes]
  );

  // Delete edge callback
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [setEdges]
  );

  // Inject callback into node and edge data
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onDataChange: handleNodeDataChange,
        },
      }))
    );
  }, [handleNodeDataChange, setNodes]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          ...e.data,
          onDelete: handleDeleteEdge,
        },
      }))
    );
  }, [handleDeleteEdge, setEdges]);

  // Connect handle
  const onConnect = useCallback(
    (connection: Connection) => {
      const sourceNode = nodes.find((n) => n.id === connection.source);
      let label: string | undefined = undefined;
      let branch: string | undefined = undefined;

      let markerColor = '#64748b';
      if (sourceNode?.type === 'decision') {
        if (connection.sourceHandle === 'true') {
          label = 'TRUE';
          branch = 'TRUE';
          markerColor = '#10b981';
        } else if (connection.sourceHandle === 'false') {
          label = 'FALSE';
          branch = 'FALSE';
          markerColor = '#f43f5e';
        }
      }

      const newEdge: Edge = {
        ...connection,
        id: `e-${Date.now()}`,
        type: 'flowchart',
        label,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: 18,
          height: 18,
        },
        data: {
          branch,
          sourceHandle: connection.sourceHandle,
          onDelete: handleDeleteEdge,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setEdges, handleDeleteEdge]
  );

  // Add block to canvas
  const handleAddNode = useCallback(
    (type: FlowchartNodeType) => {
      const id = `${type}-${Date.now().toString(36)}`;
      const yOffset = 100 + (nodes.length % 5) * 80;
      const xOffset = 200 + ((nodes.length * 40) % 200);

      const newNode: Node = {
        id,
        type,
        position: { x: xOffset, y: yOffset },
        data: {
          label: type.toUpperCase(),
          nodeType: type,
          assignments: type === 'process' ? ['sum = a + b'] : undefined,
          condition: type === 'decision' ? 'a > b' : undefined,
          inputVariables: type === 'input' ? ['a', 'b'] : undefined,
          outputExpression: type === 'output' ? 'sum' : undefined,
          onDataChange: handleNodeDataChange,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes.length, handleNodeDataChange, setNodes]
  );

  // Convert current nodes & edges to shared FlowchartGraph
  const getCurrentGraph = useCallback((): FlowchartGraph => {
    return {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: (n.type || 'process') as FlowchartNodeType,
        position: n.position,
        data: {
          label: n.data?.label as string,
          assignments: n.data?.assignments as string[],
          condition: n.data?.condition as string,
          inputVariables: n.data?.inputVariables as string[],
          outputExpression: n.data?.outputExpression as string,
        },
      })),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: (e.sourceHandle as string) || undefined,
        targetHandle: (e.targetHandle as string) || undefined,
        label: (e.label as string) || undefined,
      })),
    };
  }, [nodes, edges]);

  // Topology validation
  const handleValidate = useCallback(() => {
    const graph = getCurrentGraph();
    const result = validateFlowchart(graph);
    setValidationResult(result);
    return result;
  }, [getCurrentGraph]);

  // Execute flowchart with custom input
  const handleRunCustom = useCallback(() => {
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);

    const graph = getCurrentGraph();
    const validation = validateFlowchart(graph);
    setValidationResult(validation);

    if (!validation.isValid) {
      return;
    }

    const result = executeFlowchart(graph, customInput);
    setExecutionResult(result);
    setCurrentStepIndex(1); // Jump to step 1
  }, [getCurrentGraph, customInput]);

  // Evaluate against problem test cases
  const handleRunTestCases = useCallback(async () => {
    if (!problemId) {
      alert('Open a specific problem to evaluate against official test cases.');
      return;
    }

    const graph = getCurrentGraph();
    const validation = validateFlowchart(graph);
    setValidationResult(validation);

    if (!validation.isValid) {
      return;
    }

    setIsEvaluatingTests(true);
    try {
      const res = await api.post('/flowcharts/execute', {
        graph,
        mode: 'testcases',
        problemId,
      });

      if (res.data?.success) {
        setTestCaseResults(res.data.data.testCaseResults);
      }
    } catch (err: any) {
      console.error('Error evaluating test cases:', err);
      alert(err.response?.data?.message || 'Failed to evaluate test cases');
    } finally {
      setIsEvaluatingTests(false);
    }
  }, [getCurrentGraph, problemId]);

  // Save flowchart
  const handleSave = useCallback(async () => {
    const graph = getCurrentGraph();
    if (onSave) {
      onSave(graph);
      return;
    }

    if (!problemId) return;

    setIsSaving(true);
    try {
      await api.put(`/flowcharts/${problemId}`, {
        nodes: graph.nodes,
        edges: graph.edges,
      });
      alert('Flowchart successfully saved!');
    } catch (err: any) {
      console.error('Failed to save flowchart:', err);
      alert('Failed to save flowchart to cloud.');
    } finally {
      setIsSaving(false);
    }
  }, [getCurrentGraph, onSave, problemId]);

  // Update visual node states according to currentStepIndex
  useEffect(() => {
    if (!executionResult || executionResult.steps.length === 0) {
      // Clear visual halos
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            executionStatus: 'idle',
            runtimeValue: undefined,
            branchTaken: undefined,
            lastEvaluated: undefined,
          },
        }))
      );
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: {
            ...e.data,
            isActive: false,
          },
        }))
      );
      return;
    }

    const step =
      currentStepIndex > 0 && currentStepIndex <= executionResult.steps.length
        ? executionResult.steps[currentStepIndex - 1]
        : null;

    const visitedNodeIds = new Set(
      executionResult.steps
        .slice(0, currentStepIndex - 1)
        .map((s) => s.nodeId)
    );

    setNodes((nds) =>
      nds.map((n) => {
        let status = 'idle';
        let runtimeVal: any = undefined;
        let branch: any = undefined;
        let lastEval: any = undefined;

        if (step && n.id === step.nodeId) {
          status = step.error ? 'error' : 'active';
          if (step.io?.outputValue !== undefined) {
            runtimeVal = step.io.outputValue;
          } else if (step.io?.variables) {
            runtimeVal = step.io.variables;
          }
          if (step.evaluatedCondition) {
            branch = step.evaluatedCondition.branchTaken;
          }
          if (step.evaluatedAssignment) {
            lastEval = step.evaluatedAssignment;
          }
        } else if (visitedNodeIds.has(n.id)) {
          status = 'success';
        }

        return {
          ...n,
          data: {
            ...n.data,
            executionStatus: status,
            runtimeValue: runtimeVal,
            branchTaken: branch,
            lastEvaluated: lastEval,
          },
        };
      })
    );

    // Active edge
    const activeEdgeId = step?.activeEdgeId;
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          ...e.data,
          isActive: e.id === activeEdgeId,
        },
      }))
    );
  }, [currentStepIndex, executionResult, setNodes, setEdges]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    const intervalMs = Math.round(600 / speed);
    playTimerRef.current = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (!executionResult || prev >= executionResult.steps.length) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, speed, executionResult]);

  // Step controls
  const handlePlay = () => {
    if (!executionResult) {
      handleRunCustom();
    }
    setIsPlaying(true);
  };
  const handlePause = () => setIsPlaying(false);
  const handleStepForward = () => {
    setIsPlaying(false);
    if (!executionResult) {
      handleRunCustom();
      return;
    }
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, executionResult.steps.length)
    );
  };
  const handleStepBackward = () => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };
  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const activeStep =
    executionResult &&
    currentStepIndex > 0 &&
    currentStepIndex <= executionResult.steps.length
      ? executionResult.steps[currentStepIndex - 1]
      : null;

  return (
    <div className="relative w-full h-full min-h-[680px] bg-slate-950 flex flex-col overflow-hidden select-none">
      {/* Top Floating Block Palette */}
      <div className="absolute top-4 left-6 z-20">
        <FlowchartBlockPalette
          onAddNode={handleAddNode}
          onValidate={handleValidate}
          onSave={problemId ? handleSave : undefined}
          isSaving={isSaving}
        />
      </div>

      {/* Validation Warning / Error Banner */}
      {validationResult && !validationResult.isValid && (
        <div className="absolute top-18 left-6 z-20 max-w-lg p-2.5 rounded-xl bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs shadow-xl backdrop-blur-md flex items-center justify-between">
          <span className="font-semibold">
            {validationResult.errors[0]?.message}
          </span>
          <button
            onClick={() => setValidationResult(null)}
            className="text-rose-400 hover:text-white ml-3 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main ReactFlow Canvas */}
      <div className="flex-1 w-full h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{
            stroke: '#38bdf8',
            strokeWidth: 2.5,
            strokeDasharray: '6 4',
          }}
          defaultEdgeOptions={{
            type: 'flowchart',
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 18,
              height: 18,
              color: '#64748b',
            },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color="#334155"
            className="bg-slate-950 dark:bg-[#0d1117]"
          />
          <Controls className="bg-slate-900! border-slate-700! text-slate-300! fill-slate-300!" />
          <MiniMap
            nodeColor={(n) => {
              if (n.type === 'start') return '#10b981';
              if (n.type === 'end') return '#f43f5e';
              if (n.type === 'input') return '#06b6d4';
              if (n.type === 'output') return '#6366f1';
              if (n.type === 'decision') return '#a855f7';
              return '#f59e0b';
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            className="bg-slate-900/90! border-slate-800! rounded-xl!"
          />
        </ReactFlow>
      </div>

      {/* Right Floating Memory HUD */}
      <div className="absolute top-4 right-6 z-20">
        <FlowchartMemoryHUD
          step={activeStep}
          output={executionResult?.output || ''}
          error={executionResult?.error?.message}
        />
      </div>

      {/* Bottom Floating Control Bar & Testcase Drawer */}
      <div className="absolute bottom-4 left-6 right-6 z-20 flex flex-col md:flex-row items-end gap-3 pointer-events-none">
        {/* Left Side: Test Cases / Custom Input Drawer */}
        <div className="w-full md:w-96 pointer-events-auto">
          <FlowchartTestcaseDrawer
            customInput={customInput}
            onCustomInputChange={setCustomInput}
            onRunCustom={handleRunCustom}
            onRunTestCases={handleRunTestCases}
            isRunning={isEvaluatingTests}
            testCaseResults={testCaseResults}
            allPassed={testCaseResults?.every((r) => r.passed)}
          />
        </div>

        {/* Right Side: VCR Playback Dock */}
        <div className="flex-1 w-full pointer-events-auto">
          <FlowchartVCRControls
            currentStep={currentStepIndex}
            totalSteps={executionResult?.steps.length || 0}
            isPlaying={isPlaying}
            speed={speed}
            onPlay={handlePlay}
            onPause={handlePause}
            onStepForward={handleStepForward}
            onStepBackward={handleStepBackward}
            onReset={handleReset}
            onSeek={(step) => setCurrentStepIndex(step)}
            onSpeedChange={(s) => setSpeed(s)}
          />
        </div>
      </div>
    </div>
  );
}
