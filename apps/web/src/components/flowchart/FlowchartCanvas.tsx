import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useImperativeHandle,
} from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  ConnectionLineType,
  reconnectEdge,
  ReactFlowInstance,
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
import { FlowchartBottomConsole } from './FlowchartBottomConsole';
import { FlowchartInspector } from './FlowchartInspector';
import { computeAutoLayout } from './utils/flowchart-auto-layout';
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

export interface FlowchartCanvasHandle {
  addNode: (type: FlowchartNodeType) => void;
  autoAlign: () => void;
  validate: () => FlowchartValidationResult | null;
  save: () => Promise<void>;
  toggleInspector: () => void;
}

export interface FlowchartCanvasProps {
  problemId?: string;
  initialGraph?: FlowchartGraph | null;
  onSave?: (graph: FlowchartGraph) => void;
  onStateChange?: (state: {
    isSaving: boolean;
    isInspectorOpen: boolean;
    varCount: number;
  }) => void;
}

export const FlowchartCanvas = React.forwardRef<
  FlowchartCanvasHandle,
  FlowchartCanvasProps
>(function FlowchartCanvas(
  { problemId, initialGraph, onSave, onStateChange },
  ref
) {
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

  // Canvas ReactFlow instance & Layout
  const [reactFlowInstance, setReactFlowInstance] =
    useState<ReactFlowInstance | null>(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const playTimerRef = useRef<any>(null);

  // Auto-align / Beautify layout callback
  const handleAutoAlign = useCallback(() => {
    setNodes((nds) => computeAutoLayout(nds, edges));
    setTimeout(() => {
      reactFlowInstance?.fitView({ duration: 400, padding: 0.25 });
    }, 50);
  }, [edges, reactFlowInstance, setNodes]);

  // Invalidate previous execution state when graph structure changes
  const invalidateExecution = useCallback(() => {
    setIsPlaying(false);
    if (playTimerRef.current) clearInterval(playTimerRef.current);
    setExecutionResult(null);
    setCurrentStepIndex(0);
  }, []);

  // Callback to update node data inline from custom node components
  const handleNodeDataChange = useCallback(
    (id: string, updates: any) => {
      invalidateExecution();
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
    [invalidateExecution, setNodes]
  );

  // Delete edge callback
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      invalidateExecution();
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
    },
    [invalidateExecution, setEdges]
  );

  // Delete node callback (also purges connected edges)
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      invalidateExecution();
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode?.type === 'start') {
        const startCount = nodes.filter((n) => n.type === 'start').length;
        if (startCount <= 1) {
          alert('Every flowchart requires at least one Start block.');
          return;
        }
      }

      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [invalidateExecution, nodes, setNodes, setEdges]
  );

  // Toggle branch callback (for decision edges)
  const handleToggleBranch = useCallback(
    (edgeId: string) => {
      invalidateExecution();
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id === edgeId) {
            const currentBranch = e.data?.branch || e.label;
            const nextBranch = currentBranch === 'TRUE' ? 'FALSE' : 'TRUE';
            const nextColor = nextBranch === 'TRUE' ? '#10b981' : '#f43f5e';
            const nextHandle = nextBranch === 'TRUE' ? 'true' : 'false';
            return {
              ...e,
              label: nextBranch,
              sourceHandle: nextHandle,
              markerEnd: {
                ...(typeof e.markerEnd === 'object' ? e.markerEnd : {}),
                type: MarkerType.ArrowClosed,
                color: nextColor,
              },
              data: {
                ...e.data,
                branch: nextBranch,
                sourceHandle: nextHandle,
              },
            };
          }
          return e;
        })
      );
    },
    [invalidateExecution, setEdges]
  );

  // Reconnect edge callback (drag arrowhead to new node)
  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
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
          onDeleteNode: handleDeleteNode,
        },
      }))
    );
  }, [handleNodeDataChange, handleDeleteNode, setNodes]);

  useEffect(() => {
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        data: {
          ...e.data,
          onDelete: handleDeleteEdge,
          onToggleBranch: handleToggleBranch,
        },
      }))
    );
  }, [handleDeleteEdge, handleToggleBranch, setEdges]);

  // Connect handle
  const onConnect = useCallback(
    (connection: Connection) => {
      invalidateExecution();
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
          onToggleBranch: handleToggleBranch,
        },
      };

      setEdges((eds) => addEdge(newEdge, eds));
    },
    [invalidateExecution, nodes, setEdges, handleDeleteEdge, handleToggleBranch]
  );

  // Add block to canvas
  const handleAddNode = useCallback(
    (type: FlowchartNodeType) => {
      invalidateExecution();
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
          onDeleteNode: handleDeleteNode,
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [invalidateExecution, nodes.length, handleNodeDataChange, handleDeleteNode, setNodes]
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
  const handleRunCustom = useCallback(
    (autoPlay: boolean = true) => {
      setIsPlaying(false);
      if (playTimerRef.current) clearInterval(playTimerRef.current);

      const graph = getCurrentGraph();
      const validation = validateFlowchart(graph);
      setValidationResult(validation);

      if (!validation.isValid) {
        return null;
      }

      const result = executeFlowchart(graph, customInput);
      setExecutionResult(result);
      setCurrentStepIndex(1); // Jump to step 1
      if (autoPlay && result.steps.length > 0) {
        setIsPlaying(true);
      }
      return result;
    },
    [getCurrentGraph, customInput]
  );

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
            stepIndex: step && n.id === step.nodeId ? currentStepIndex : undefined,
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
  const handlePlay = useCallback(() => {
    // If not executed yet, or if already at the end of the execution:
    if (!executionResult || currentStepIndex >= executionResult.steps.length) {
      handleRunCustom(true);
      return;
    }

    // Otherwise, resume playback from current step
    setIsPlaying(true);
  }, [executionResult, currentStepIndex, handleRunCustom]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleStepForward = useCallback(() => {
    setIsPlaying(false);
    if (!executionResult || currentStepIndex >= executionResult.steps.length) {
      const res = handleRunCustom(false);
      if (res && res.steps.length > 0) {
        setCurrentStepIndex(1);
      }
      return;
    }
    setCurrentStepIndex((prev) =>
      Math.min(prev + 1, executionResult.steps.length)
    );
  }, [executionResult, currentStepIndex, handleRunCustom]);

  const handleStepBackward = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  }, []);

  const activeStep =
    executionResult &&
    currentStepIndex > 0 &&
    currentStepIndex <= executionResult.steps.length
      ? executionResult.steps[currentStepIndex - 1]
      : null;

  // Accumulate only the outputs emitted dynamically up to currentStepIndex
  const currentOutput = useMemo(() => {
    if (!executionResult || currentStepIndex <= 0) return '';
    return executionResult.steps
      .slice(0, currentStepIndex)
      .filter((s) => s.io?.type === 'OUTPUT' && s.io?.outputValue !== undefined)
      .map((s) => s.io!.outputValue)
      .join('\n');
  }, [executionResult, currentStepIndex]);

  const varCount = activeStep?.variables
    ? Object.keys(activeStep.variables).length
    : 0;

  useImperativeHandle(
    ref,
    () => ({
      addNode: handleAddNode,
      autoAlign: handleAutoAlign,
      validate: handleValidate,
      save: handleSave,
      toggleInspector: () => setIsInspectorOpen((prev) => !prev),
    }),
    [handleAddNode, handleAutoAlign, handleValidate, handleSave]
  );

  useEffect(() => {
    onStateChange?.({
      isSaving,
      isInspectorOpen,
      varCount,
    });
  }, [isSaving, isInspectorOpen, varCount, onStateChange]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden select-none">
      {/* Validation Warning / Error Banner */}
      {validationResult && !validationResult.isValid && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-md w-[90vw] p-2.5 rounded-xl bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs shadow-2xl backdrop-blur-md flex items-center justify-between">
          <span className="font-semibold truncate">
            {validationResult.errors[0]?.message}
          </span>
          <button
            onClick={() => setValidationResult(null)}
            className="text-rose-400 hover:text-white ml-3 font-bold cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      {/* CANVAS: 100% FULL-SCREEN EDGE-TO-EDGE */}
      <div className="w-full h-full absolute inset-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          edgesReconnectable={true}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={(instance) => setReactFlowInstance(instance)}
          fitView
          fitViewOptions={{ padding: 0.25 }}
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
          {/* Controls: Clean, Dark Theme High-Contrast in Bottom-Left */}
          <Controls
            position="bottom-left"
            showInteractive={false}
            className="!bottom-4 !left-4 !rounded-xl !shadow-2xl !z-20"
          />
        </ReactFlow>
      </div>

      {/* SLIDE-OVER RIGHT INSPECTOR (Never resizes or cramps canvas) */}
      <FlowchartInspector
        step={activeStep}
        error={executionResult?.error?.message}
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        currentStepIndex={currentStepIndex}
        totalSteps={executionResult?.steps.length || 0}
      />

      {/* FLOATING BOTTOM CONSOLE */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-[95vw]">
        <FlowchartBottomConsole
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
          output={currentOutput}
          customInput={customInput}
          onCustomInputChange={(val) => {
            setCustomInput(val);
            invalidateExecution();
          }}
          onRunCustom={() => handleRunCustom(true)}
          onRunTestCases={handleRunTestCases}
          isRunningTests={isEvaluatingTests}
          testCaseResults={testCaseResults}
          allPassed={testCaseResults?.every((r) => r.passed)}
          problemId={problemId}
        />
      </div>
    </div>
  );
});
