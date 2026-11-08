export type FlowchartNodeType =
  | 'start'
  | 'end'
  | 'input'
  | 'output'
  | 'process'
  | 'decision';

export interface FlowchartNodeData {
  label?: string;
  // For process blocks: list of assignments (e.g. 'sum = a + b', 'i = i + 1')
  assignments?: string[];
  // For decision blocks: boolean condition (e.g. 'a > b', 'i < n')
  condition?: string;
  // For input blocks: list of variable names to bind (e.g. ['n', 'target'])
  inputVariables?: string[];
  // For output blocks: expression to evaluate and print (e.g. 'sum' or 'arr')
  outputExpression?: string;
  // Optional comment or explanation
  comment?: string;
}

export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  position: { x: number; y: number };
  data: FlowchartNodeData;
}

export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'true' | 'false' | 'default' | string;
  targetHandle?: string;
  label?: 'TRUE' | 'FALSE' | string;
}

export interface FlowchartGraph {
  id?: string;
  problemId?: string;
  userId?: string;
  version?: number;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  viewport?: { x: number; y: number; zoom: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface FlowchartExecutionStep {
  stepIndex: number;
  nodeId: string;
  nodeType: FlowchartNodeType;
  nodeLabel: string;
  action: string;
  variables: Record<string, any>;
  previousVariables?: Record<string, any>;
  evaluatedCondition?: {
    expression: string;
    result: boolean;
    branchTaken: 'TRUE' | 'FALSE';
  };
  evaluatedAssignment?: {
    expression: string;
    variable: string;
    result: any;
  };
  io?: {
    type: 'INPUT' | 'OUTPUT';
    variables?: Record<string, any>;
    outputValue?: string;
  };
  activeEdgeId?: string;
  error?: string;
}

export interface FlowchartExecutionResult {
  success: boolean;
  status: 'COMPLETED' | 'ERROR' | 'TLE_CYCLE_LIMIT';
  steps: FlowchartExecutionStep[];
  totalSteps: number;
  output: string;
  variables: Record<string, any>;
  error?: {
    nodeId?: string;
    message: string;
    stepIndex?: number;
  };
}

export interface FlowchartValidationError {
  nodeId?: string;
  edgeId?: string;
  type:
    | 'MISSING_START'
    | 'MULTIPLE_STARTS'
    | 'MISSING_END'
    | 'DISCONNECTED_NODE'
    | 'DECISION_BRANCHING'
    | 'INVALID_EXPRESSION'
    | 'INVALID_CONNECTION'
    | 'EMPTY_GRAPH';
  message: string;
}

export interface FlowchartValidationResult {
  isValid: boolean;
  errors: FlowchartValidationError[];
  warnings: Array<{
    nodeId?: string;
    message: string;
  }>;
}
