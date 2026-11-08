export type SupportedLanguage = 'python' | 'javascript' | 'cpp' | 'java';

export type VisualActionType =
  | 'INITIALIZE'
  | 'COMPARE'
  | 'SWAP'
  | 'POINTER_MOVE'
  | 'WINDOW_EXPAND'
  | 'WINDOW_SHRINK'
  | 'NODE_VISIT'
  | 'EDGE_TRAVERSE'
  | 'DP_CELL_CALCULATE'
  | 'CACHE_ACCESS'
  | 'CACHE_EVICT'
  | 'TOKEN_CONSUME'
  | 'TOKEN_REFILL'
  | 'MATCH_FOUND'
  | 'TERMINATION';

// 1. Linear Array & Window Payload
export interface ArrayVisualPayload {
  kind: 'ARRAY';
  data: number[];
  pointers?: Record<string, { index: number; label: string; color?: string }>;
  activeIndices?: number[];
  modifiedIndices?: number[];
  matchedIndices?: number[];
  discardedRanges?: [number, number][];
  windowRange?: [number, number];
}

// 2. Tree Payload (Binary Tree, BST, Heap)
export interface TreeNodeData {
  id: string;
  value: string | number;
  leftId?: string;
  rightId?: string;
  x?: number;
  y?: number;
  status?: 'idle' | 'active' | 'visited' | 'matched' | 'eliminated';
}

export interface TreeVisualPayload {
  kind: 'TREE';
  nodes: TreeNodeData[];
  rootId: string;
  activeNodeId?: string;
  traversalPath?: string[];
  targetValue?: string | number;
}

// 3. Graph Payload (BFS, DFS, Dijkstra)
export interface GraphNodeData {
  id: string;
  label: string;
  x: number;
  y: number;
  state: 'unvisited' | 'queued' | 'visiting' | 'visited';
  distance?: number | string;
}

export interface GraphEdgeData {
  from: string;
  to: string;
  weight?: number;
  isTraversing?: boolean;
  inShortestPath?: boolean;
}

export interface GraphVisualPayload {
  kind: 'GRAPH';
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  activeNodeId?: string;
  activeEdge?: { from: string; to: string };
  queueState?: string[]; // BFS queue or Dijkstra priority queue
  callStack?: string[];  // DFS recursive call stack
}

// 4. Matrix / 2D DP Table Payload
export interface MatrixVisualPayload {
  kind: 'MATRIX';
  grid: (number | string)[][];
  rowLabels: string[];
  colLabels: string[];
  activeCell?: [number, number];
  dependencyCells?: [number, number][];
  formulaExplanation?: string;
}

// 5. System Design Payload (LRU Cache, Token Bucket)
export interface SystemVisualPayload {
  kind: 'SYSTEM_STRUCTURE';
  structureType: 'LRU_CACHE' | 'TOKEN_BUCKET';
  // LRU specifics
  capacity?: number;
  hashTable?: Record<string, any>;
  linkedList?: { key: string; value: any; isMRU?: boolean; isLRU?: boolean }[];
  lastAction?: { type: 'GET' | 'PUT' | 'EVICT'; key: string; hit?: boolean };
  // Token Bucket specifics
  bucket?: {
    currentTokens: number;
    maxCapacity: number;
    refillRate: number; // tokens/sec
    requestStatus?: 'ALLOWED' | 'DROPPED';
  };
}

export type VisualPayload =
  | ArrayVisualPayload
  | TreeVisualPayload
  | GraphVisualPayload
  | MatrixVisualPayload
  | SystemVisualPayload;

export interface TelemetryData {
  comparisonsCount?: number;
  swapsCount?: number;
  operationsCount?: number;
  spaceEliminatedPct?: number;
  theoreticalBound?: string;
  notes?: string;
}

export interface TraceFrame {
  id: string;
  stepIndex: number;
  totalSteps: number;
  lineMapping: Record<SupportedLanguage, number>; // 1-indexed line number in each language
  actionType: VisualActionType;
  visualPayload: VisualPayload;
  variables: Record<string, any>;
  telemetry?: TelemetryData;
  narration: {
    title: string;
    explanation: string;
    complexityImpact?: string;
  };
}

export interface AlgorithmPresets<TInput = any> {
  bestCase?: { label: string; input: TInput };
  worstCase?: { label: string; input: TInput };
  generateRandom?: () => TInput;
}

export interface AlgorithmDefinition<TInput = any> {
  id: string;
  slug: string;
  name: string;
  category: 'Searching' | 'Sorting' | 'Graphs' | 'Trees' | 'Dynamic Programming' | 'System Design';
  timeComplexity: string;
  spaceComplexity: string;
  description: string;
  defaultInput: TInput;
  presets?: AlgorithmPresets<TInput>;
  codeMap: Record<SupportedLanguage, string>;
  generateSteps: (input: TInput) => TraceFrame[];
  validateCustomInput?: (inputStr: string) => { valid: boolean; parsed?: TInput; error?: string };
}
