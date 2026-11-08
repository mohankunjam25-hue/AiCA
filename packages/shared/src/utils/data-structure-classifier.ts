export interface RawTracerStep {
  step: number;
  line: number;
  event: 'line' | 'call' | 'return';
  locals: Record<string, any>;
  callStack?: string[];
}

export type DetectedStructureType = 'GRAPH' | 'TREE' | 'MATRIX' | 'ARRAY' | 'VARIABLES';

export interface NormalizedVisualPayload {
  kind: 'GRAPH' | 'TREE' | 'MATRIX' | 'ARRAY' | 'SYSTEM_STRUCTURE';
  [key: string]: any;
}

export interface NormalizedTraceFrame {
  id: string;
  stepIndex: number;
  totalSteps: number;
  lineMapping: Record<string, number>;
  actionType: string;
  visualPayload: NormalizedVisualPayload;
  variables: Record<string, any>;
  telemetry?: {
    comparisonsCount?: number;
    operationsCount?: number;
    theoreticalBound?: string;
  };
  narration: {
    title: string;
    explanation: string;
    complexityImpact?: string;
  };
}

export class DataStructureClassifier {
  /**
   * Deterministically analyzes memory locals across all execution steps
   * and infers the primary data structure without any AI.
   */
  static detectPrimaryStructure(steps: RawTracerStep[]): {
    structureType: DetectedStructureType;
    primaryVarName: string | null;
  } {
    if (!steps || steps.length === 0) {
      return { structureType: 'VARIABLES', primaryVarName: null };
    }

    // Inspect the last 5 steps where data structures are typically fully populated
    const sampleSteps = steps.slice(Math.max(0, steps.length - 10));

    // 1. Check for Graph (Adjacency List or Edge List)
    for (const step of sampleSteps) {
      for (const [name, val] of Object.entries(step.locals)) {
        if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
          const entries = Object.entries(val);
          if (
            entries.length >= 2 &&
            entries.every(([_, neighbors]) => Array.isArray(neighbors))
          ) {
            return { structureType: 'GRAPH', primaryVarName: name };
          }
        }
      }
    }

    // 2. Check for 1D Array or List of Intervals (e.g. lists of numbers, strings, or interval pairs [start, end])
    for (const step of sampleSteps) {
      for (const [name, val] of Object.entries(step.locals)) {
        if (
          Array.isArray(val) &&
          val.length >= 1 &&
          (val.every((item) => typeof item === 'number' || typeof item === 'string') ||
            val.every((item) => Array.isArray(item) && item.length === 2 && typeof item[0] === 'number'))
        ) {
          return { structureType: 'ARRAY', primaryVarName: name };
        }
      }
    }

    // 3. Check for 2D Matrix (e.g. DP Table, Grid with >= 3 columns)
    for (const step of sampleSteps) {
      for (const [name, val] of Object.entries(step.locals)) {
        if (
          Array.isArray(val) &&
          val.length >= 2 &&
          val.every((row) => Array.isArray(row) && row.length >= 2)
        ) {
          return { structureType: 'MATRIX', primaryVarName: name };
        }
      }
    }

    // 4. Fallback to general Variable Inspection
    return { structureType: 'VARIABLES', primaryVarName: null };
  }

  /**
   * Converts raw debugger steps into rich, animated visual frames
   */
  static normalizeTrace(
    rawSteps: RawTracerStep[],
    language: string = 'python'
  ): NormalizedTraceFrame[] {
    const { structureType, primaryVarName } = this.detectPrimaryStructure(rawSteps);
    const totalSteps = rawSteps.length;

    // Pre-extract stable structure baseline across steps
    let baseGraphAdj: Record<string, string[]> = {};
    if (structureType === 'GRAPH' && primaryVarName) {
      const stepWithGraph = rawSteps.find((s) => s.locals[primaryVarName]);
      if (stepWithGraph && typeof stepWithGraph.locals[primaryVarName] === 'object') {
        baseGraphAdj = stepWithGraph.locals[primaryVarName] as Record<string, string[]>;
      }
    }

    let baseArray: number[] = [];
    if (structureType === 'ARRAY' && primaryVarName) {
      const stepWithArr = rawSteps.find((s) => s.locals[primaryVarName]);
      if (stepWithArr && Array.isArray(stepWithArr.locals[primaryVarName])) {
        baseArray = stepWithArr.locals[primaryVarName] as number[];
      }
    }

    return rawSteps.map((raw, idx) => {
      const lineNo = raw.line;
      const locals = raw.locals || {};

      let visualPayload: NormalizedVisualPayload = { kind: 'ARRAY', data: [] };
      let actionType = 'POINTER_MOVE';
      let title = `Line ${lineNo} Executed`;
      let explanation = `Local variables updated at line ${lineNo}.`;

      if (structureType === 'GRAPH' && primaryVarName) {
        const adj = (locals[primaryVarName] || baseGraphAdj) as Record<string, string[]>;
        const nodeSet = new Set<string>();
        const edges: { from: string; to: string }[] = [];

        Object.entries(adj).forEach(([u, neighbors]) => {
          nodeSet.add(u);
          if (Array.isArray(neighbors)) {
            neighbors.forEach((v) => {
              nodeSet.add(String(v));
              edges.push({ from: String(u), to: String(v) });
            });
          }
        });

        // Compute SVG circle positions
        const nodeList = Array.from(nodeSet);
        const radius = 80;
        const centerX = 250;
        const centerY = 100;

        const nodes = nodeList.map((id, nIdx) => {
          const angle = (nIdx / Math.max(1, nodeList.length)) * 2 * Math.PI;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const isVisited = locals.visited
            ? Array.isArray(locals.visited)
              ? locals.visited.includes(id)
              : String(locals.visited).includes(id)
            : false;
          const isCurrent =
            locals.curr === id || locals.node === id || locals.u === id;

          return {
            id,
            label: id,
            x: Math.round(x),
            y: Math.round(y),
            state: isCurrent
              ? ('visiting' as const)
              : isVisited
              ? ('visited' as const)
              : ('unvisited' as const)
          };
        });

        const queueState = Array.isArray(locals.queue)
          ? locals.queue.map(String)
          : Array.isArray(locals.q)
          ? locals.q.map(String)
          : [];

        visualPayload = {
          kind: 'GRAPH',
          nodes,
          edges,
          activeNodeId: locals.curr || locals.node || locals.u,
          queueState
        };
        actionType = 'NODE_VISIT';
        title = locals.curr ? `Traversing Node "${locals.curr}"` : `Graph State at Line ${lineNo}`;
        explanation = `Adjacency list has ${nodeList.length} nodes and ${edges.length} edges. Queue size: ${queueState.length}.`;
      } else if (structureType === 'MATRIX' && primaryVarName && locals[primaryVarName]) {
        const grid = locals[primaryVarName] as (number | string)[][];
        const rowLabels = grid.map((_, r) => `R${r}`);
        const colLabels = (grid[0] || []).map((_, c) => `C${c}`);
        const activeCell: [number, number] | undefined =
          typeof locals.i === 'number' && typeof locals.j === 'number'
            ? [locals.i, locals.j]
            : typeof locals.r === 'number' && typeof locals.c === 'number'
            ? [locals.r, locals.c]
            : undefined;

        visualPayload = {
          kind: 'MATRIX',
          grid,
          rowLabels,
          colLabels,
          activeCell
        };
        actionType = 'DP_CELL_CALCULATE';
        title = activeCell ? `Updating Cell [${activeCell[0]}, ${activeCell[1]}]` : `Matrix State`;
        explanation = `Matrix dimension: ${grid.length}x${(grid[0] || []).length}.`;
      } else if (structureType === 'ARRAY' && primaryVarName && locals[primaryVarName]) {
        const data = locals[primaryVarName] as any[];
        const pointers: Record<string, { index: number; label: string; color: string }> = {};

        // Find pointer variables
        const colors = ['#0969da', '#cf222e', '#8250df', '#1a7f37', '#d29922'];
        let colorIdx = 0;
        ['left', 'right', 'mid', 'i', 'j', 'start', 'end', 'curr', 'k'].forEach((pKey) => {
          if (typeof locals[pKey] === 'number' && locals[pKey] >= 0 && locals[pKey] < data.length) {
            pointers[pKey.toUpperCase()] = {
              index: locals[pKey],
              label: pKey.toUpperCase(),
              color: colors[colorIdx++ % colors.length]
            };
          }
        });

        // Check for secondary output list (e.g. merged in Merge Intervals, or res/result)
        let secondaryData: any[] | undefined = undefined;
        let secondaryLabel: string | undefined = undefined;
        if (Array.isArray(locals.merged) && primaryVarName !== 'merged') {
          secondaryData = locals.merged;
          secondaryLabel = 'Merged Output';
        } else if (Array.isArray(locals.result) && primaryVarName !== 'result') {
          secondaryData = locals.result;
          secondaryLabel = 'Result';
        }

        visualPayload = {
          kind: 'ARRAY',
          data,
          secondaryData,
          secondaryLabel,
          pointers,
          activeIndices: Object.values(pointers).map((p) => p.index),
          variables: locals
        };
        actionType = 'POINTER_MOVE';
        title = `Array State: ${primaryVarName}`;
        explanation = `Inspecting array of ${data.length} elements with ${Object.keys(pointers).length} active pointers.`;
      } else {
        // Fallback simple array visualization of primitives or live variables
        const numericData = Object.values(locals).filter((v) => typeof v === 'number') as number[];
        visualPayload = {
          kind: 'ARRAY',
          data: numericData,
          pointers: {},
          variables: locals
        };
      }

      return {
        id: `frame-${idx}`,
        stepIndex: idx,
        totalSteps,
        lineMapping: {
          [language]: lineNo,
          python: lineNo,
          javascript: lineNo,
          cpp: lineNo,
          java: lineNo
        },
        actionType,
        visualPayload,
        variables: locals,
        telemetry: {
          comparisonsCount: idx + 1,
          operationsCount: idx + 1,
          theoreticalBound: `Step ${idx + 1} of ${totalSteps}`
        },
        narration: {
          title,
          explanation,
          complexityImpact: `Line ${lineNo}`
        }
      };
    });
  }
}
