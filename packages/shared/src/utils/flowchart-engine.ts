import {
  FlowchartGraph,
  FlowchartNode,
  FlowchartEdge,
  FlowchartExecutionStep,
  FlowchartExecutionResult,
  FlowchartValidationResult,
  FlowchartValidationError,
} from '../types/flowchart.js';
import {
  FlowchartExpressionParser,
  FlowchartInterpreterEnv,
  evaluateExpression,
  executeAssignment,
  evaluateCondition,
  FlowchartExpressionError,
} from './flowchart-expression-parser.js';

export const MAX_EXECUTION_STEPS = 500;

/**
 * Validate a Flowchart graph structure before execution.
 */
export function validateFlowchart(graph: FlowchartGraph): FlowchartValidationResult {
  const errors: FlowchartValidationError[] = [];
  const warnings: Array<{ nodeId?: string; message: string }> = [];

  if (!graph || !graph.nodes || graph.nodes.length === 0) {
    return {
      isValid: false,
      errors: [
        {
          type: 'EMPTY_GRAPH',
          message: 'The flowchart contains no blocks. Add a Start block to begin.',
        },
      ],
      warnings: [],
    };
  }

  const nodes = graph.nodes;
  const edges = graph.edges || [];
  const nodeMap = new Map<string, FlowchartNode>(nodes.map((n) => [n.id, n]));

  // 1. Start node validation
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({
      type: 'MISSING_START',
      message: 'Flowchart must have exactly one Start block.',
    });
  } else if (startNodes.length > 1) {
    errors.push({
      type: 'MULTIPLE_STARTS',
      message: `Flowchart has ${startNodes.length} Start blocks. Only one Start block is permitted.`,
    });
  }

  // 2. End node validation
  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({
      type: 'MISSING_END',
      message: 'Flowchart must have at least one End block.',
    });
  }

  // 3. Check incoming and outgoing edges per node
  const incomingEdges = new Map<string, FlowchartEdge[]>();
  const outgoingEdges = new Map<string, FlowchartEdge[]>();

  for (const node of nodes) {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source)) {
      errors.push({
        edgeId: edge.id,
        type: 'INVALID_CONNECTION',
        message: `Edge connects from non-existent node "${edge.source}".`,
      });
      continue;
    }
    if (!nodeMap.has(edge.target)) {
      errors.push({
        edgeId: edge.id,
        type: 'INVALID_CONNECTION',
        message: `Edge connects to non-existent node "${edge.target}".`,
      });
      continue;
    }
    outgoingEdges.get(edge.source)!.push(edge);
    incomingEdges.get(edge.target)!.push(edge);
  }

  for (const node of nodes) {
    const inEdges = incomingEdges.get(node.id) || [];
    const outEdges = outgoingEdges.get(node.id) || [];

    // Start block rules
    if (node.type === 'start') {
      if (inEdges.length > 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: 'Start block cannot have incoming connections.',
        });
      }
      if (outEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: 'Start block must connect to the next block.',
        });
      }
    }

    // End block rules
    if (node.type === 'end') {
      if (outEdges.length > 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: 'End block cannot have outgoing connections.',
        });
      }
      if (inEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: 'End block must have at least one incoming connection.',
        });
      }
    }

    // Decision block rules
    if (node.type === 'decision') {
      const condition = node.data?.condition?.trim();
      if (!condition) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_EXPRESSION',
          message: `Decision block "${node.data?.label || node.id}" requires a condition (e.g. "a > b").`,
        });
      } else {
        // Validate expression syntax
        try {
          FlowchartExpressionParser.parse(condition);
        } catch (e: any) {
          errors.push({
            nodeId: node.id,
            type: 'INVALID_EXPRESSION',
            message: `Syntax error in condition "${condition}": ${e.message}`,
          });
        }
      }

      // Check TRUE and FALSE outgoing branches
      const hasTrueBranch = outEdges.some(
        (e) =>
          e.sourceHandle === 'true' ||
          e.label?.toUpperCase() === 'TRUE' ||
          e.label === 'T'
      );
      const hasFalseBranch = outEdges.some(
        (e) =>
          e.sourceHandle === 'false' ||
          e.label?.toUpperCase() === 'FALSE' ||
          e.label === 'F'
      );

      if (!hasTrueBranch || !hasFalseBranch) {
        errors.push({
          nodeId: node.id,
          type: 'DECISION_BRANCHING',
          message: `Decision block "${node.data?.label || node.id}" must have both a TRUE and a FALSE outgoing branch.`,
        });
      }
    }

    // Process block rules
    if (node.type === 'process') {
      const assignments = node.data?.assignments || [];
      if (assignments.length === 0) {
        warnings.push({
          nodeId: node.id,
          message: `Process block "${node.data?.label || node.id}" has no assignments defined.`,
        });
      } else {
        // Check syntax of each assignment
        for (const stmt of assignments) {
          if (!stmt.trim()) continue;
          try {
            // Dry run tokenization/parsing
            if (stmt.includes('=')) {
              const eq = stmt.indexOf('=');
              const rhs = stmt.slice(eq + 1).trim();
              FlowchartExpressionParser.parse(rhs);
            } else if (stmt.includes('.') && stmt.includes('(')) {
              FlowchartExpressionParser.parse(stmt);
            } else {
              throw new FlowchartExpressionError(
                `Assignment must contain '=' or a method call`
              );
            }
          } catch (e: any) {
            errors.push({
              nodeId: node.id,
              type: 'INVALID_EXPRESSION',
              message: `Syntax error in assignment "${stmt}": ${e.message}`,
            });
          }
        }
      }

      if (outEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: `Process block "${node.data?.label || node.id}" has no outgoing connection.`,
        });
      }
    }

    // Input block rules
    if (node.type === 'input') {
      const vars = node.data?.inputVariables || [];
      if (vars.length === 0) {
        warnings.push({
          nodeId: node.id,
          message: `Input block "${node.data?.label || node.id}" specifies no variable names.`,
        });
      }
      if (outEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: `Input block "${node.data?.label || node.id}" has no outgoing connection.`,
        });
      }
    }

    // Output block rules
    if (node.type === 'output') {
      const outExpr = node.data?.outputExpression?.trim();
      if (!outExpr) {
        warnings.push({
          nodeId: node.id,
          message: `Output block "${node.data?.label || node.id}" has no expression to print.`,
        });
      } else {
        try {
          FlowchartExpressionParser.parse(outExpr);
        } catch (e: any) {
          errors.push({
            nodeId: node.id,
            type: 'INVALID_EXPRESSION',
            message: `Syntax error in output expression "${outExpr}": ${e.message}`,
          });
        }
      }
      if (outEdges.length === 0) {
        errors.push({
          nodeId: node.id,
          type: 'INVALID_CONNECTION',
          message: `Output block "${node.data?.label || node.id}" has no outgoing connection.`,
        });
      }
    }
  }

  // 4. Reachability from Start
  if (startNodes.length === 1) {
    const visited = new Set<string>();
    const queue = [startNodes[0].id];
    visited.add(startNodes[0].id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const nextEdges = outgoingEdges.get(current) || [];
      for (const e of nextEdges) {
        if (!visited.has(e.target)) {
          visited.add(e.target);
          queue.push(e.target);
        }
      }
    }

    // Check if any node is disconnected
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        warnings.push({
          nodeId: node.id,
          message: `Block "${node.data?.label || node.id}" (${node.type}) cannot be reached from Start block.`,
        });
      }
    }

    // Check if at least one End block is reachable
    const reachableEnd = endNodes.some((end) => visited.has(end.id));
    if (!reachableEnd && endNodes.length > 0) {
      errors.push({
        type: 'DISCONNECTED_NODE',
        message: 'No path exists from Start block to any End block.',
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Parses raw input string into sequential tokens / values for Input blocks.
 * Handles space/newline separated numbers, strings, and JSON arrays/objects.
 */
export function parseInputTokens(input: string): any[] {
  if (!input || !input.trim()) return [];

  const trimmed = input.trim();

  // If input is JSON array of inputs (like [[1, 2], 3]), attempt parse
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Fall through to line/token parsing
    }
  }

  // Tokenize lines and words
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tokens: any[] = [];

  for (const line of lines) {
    // Check if the whole line is a JSON array e.g. [1, 2, 3] or string
    if (line.startsWith('[') && line.endsWith(']')) {
      try {
        tokens.push(JSON.parse(line));
        continue;
      } catch {
        // Fall through
      }
    }

    const parts = line.split(/\s+/);
    for (const p of parts) {
      if (!isNaN(Number(p))) {
        tokens.push(Number(p));
      } else if (p.toLowerCase() === 'true') {
        tokens.push(true);
      } else if (p.toLowerCase() === 'false') {
        tokens.push(false);
      } else {
        tokens.push(p);
      }
    }
  }

  return tokens;
}

export interface FlowchartExecutionOptions {
  maxSteps?: number;
  initialVariables?: Record<string, any>;
}

/**
 * Execute a Flowchart graph step-by-step or in full batch.
 */
export function executeFlowchart(
  graph: FlowchartGraph,
  rawInput: string = '',
  options: FlowchartExecutionOptions = {}
): FlowchartExecutionResult {
  const maxSteps = options.maxSteps || MAX_EXECUTION_STEPS;
  const validation = validateFlowchart(graph);

  if (!validation.isValid) {
    return {
      success: false,
      status: 'ERROR',
      steps: [],
      totalSteps: 0,
      output: '',
      variables: {},
      error: {
        message: validation.errors[0]?.message || 'Flowchart validation failed.',
        nodeId: validation.errors[0]?.nodeId,
      },
    };
  }

  const nodes = graph.nodes;
  const edges = graph.edges || [];
  const nodeMap = new Map<string, FlowchartNode>(nodes.map((n) => [n.id, n]));
  const outgoingEdges = new Map<string, FlowchartEdge[]>();

  for (const node of nodes) {
    outgoingEdges.set(node.id, []);
  }
  for (const edge of edges) {
    if (outgoingEdges.has(edge.source)) {
      outgoingEdges.get(edge.source)!.push(edge);
    }
  }

  const startNode = nodes.find((n) => n.type === 'start')!;
  const env = new FlowchartInterpreterEnv(options.initialVariables || {});
  const inputQueue = parseInputTokens(rawInput);
  const outputLines: string[] = [];
  const steps: FlowchartExecutionStep[] = [];

  let currentNode: FlowchartNode | undefined = startNode;
  let stepIndex = 0;

  while (currentNode && stepIndex < maxSteps) {
    stepIndex++;
    const prevVarsSnapshot = env.toObject();

    try {
      // 1. START NODE
      if (currentNode.type === 'start') {
        const outEdge = outgoingEdges.get(currentNode.id)?.[0];
        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'start',
          nodeLabel: currentNode.data?.label || 'Start',
          action: 'Execution started',
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
          activeEdgeId: outEdge?.id,
        });

        if (!outEdge) {
          throw new Error('Start block has no outgoing connection');
        }
        currentNode = nodeMap.get(outEdge.target);
        continue;
      }

      // 2. INPUT NODE
      if (currentNode.type === 'input') {
        const inputVars = currentNode.data?.inputVariables || [];
        const boundVars: Record<string, any> = {};

        for (const varName of inputVars) {
          if (inputQueue.length === 0) {
            throw new Error(
              `Input required for variable "${varName}", but input stream is empty.`
            );
          }
          const val = inputQueue.shift();
          env.set(varName, val);
          boundVars[varName] = val;
        }

        const outEdge = outgoingEdges.get(currentNode.id)?.[0];
        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'input',
          nodeLabel: currentNode.data?.label || 'Input',
          action: `Read input: ${Object.entries(boundVars)
            .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
            .join(', ')}`,
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
          io: {
            type: 'INPUT',
            variables: boundVars,
          },
          activeEdgeId: outEdge?.id,
        });

        if (!outEdge) {
          throw new Error(`Input block "${currentNode.id}" has no outgoing connection`);
        }
        currentNode = nodeMap.get(outEdge.target);
        continue;
      }

      // 3. PROCESS NODE
      if (currentNode.type === 'process') {
        const assignments = currentNode.data?.assignments || [];
        let lastAssignment: any = null;

        for (const stmt of assignments) {
          if (!stmt.trim()) continue;
          lastAssignment = executeAssignment(stmt, env);
        }

        const outEdge = outgoingEdges.get(currentNode.id)?.[0];
        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'process',
          nodeLabel: currentNode.data?.label || 'Process',
          action: assignments.join('; ') || 'Execute process',
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
          evaluatedAssignment: lastAssignment
            ? {
                expression: lastAssignment.expression,
                variable: lastAssignment.variable,
                result: lastAssignment.value,
              }
            : undefined,
          activeEdgeId: outEdge?.id,
        });

        if (!outEdge) {
          throw new Error(`Process block "${currentNode.id}" has no outgoing connection`);
        }
        currentNode = nodeMap.get(outEdge.target);
        continue;
      }

      // 4. DECISION NODE
      if (currentNode.type === 'decision') {
        const conditionStr = currentNode.data?.condition || '';
        const conditionResult = evaluateCondition(conditionStr, env);
        const branchTaken: 'TRUE' | 'FALSE' = conditionResult ? 'TRUE' : 'FALSE';

        const outEdges = outgoingEdges.get(currentNode.id) || [];
        const chosenEdge = outEdges.find((e) => {
          if (branchTaken === 'TRUE') {
            return (
              e.sourceHandle === 'true' ||
              e.label?.toUpperCase() === 'TRUE' ||
              e.label === 'T'
            );
          } else {
            return (
              e.sourceHandle === 'false' ||
              e.label?.toUpperCase() === 'FALSE' ||
              e.label === 'F'
            );
          }
        });

        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'decision',
          nodeLabel: currentNode.data?.label || 'Decision',
          action: `Evaluated (${conditionStr}) -> ${branchTaken}`,
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
          evaluatedCondition: {
            expression: conditionStr,
            result: conditionResult,
            branchTaken,
          },
          activeEdgeId: chosenEdge?.id,
        });

        if (!chosenEdge) {
          throw new Error(
            `Decision evaluated to ${branchTaken}, but no outgoing edge for "${branchTaken}" was found.`
          );
        }

        currentNode = nodeMap.get(chosenEdge.target);
        continue;
      }

      // 5. OUTPUT NODE
      if (currentNode.type === 'output') {
        const expr = currentNode.data?.outputExpression?.trim() || '';
        let outputVal = '';

        if (expr) {
          const ast = FlowchartExpressionParser.parse(expr);
          const rawVal = evaluateExpression(ast, env);
          outputVal = formatOutputValue(rawVal);
          outputLines.push(outputVal);
        }

        const outEdge = outgoingEdges.get(currentNode.id)?.[0];
        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'output',
          nodeLabel: currentNode.data?.label || 'Output',
          action: `Output: ${outputVal}`,
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
          io: {
            type: 'OUTPUT',
            outputValue: outputVal,
          },
          activeEdgeId: outEdge?.id,
        });

        if (!outEdge) {
          throw new Error(`Output block "${currentNode.id}" has no outgoing connection`);
        }
        currentNode = nodeMap.get(outEdge.target);
        continue;
      }

      // 6. END NODE
      if (currentNode.type === 'end') {
        steps.push({
          stepIndex,
          nodeId: currentNode.id,
          nodeType: 'end',
          nodeLabel: currentNode.data?.label || 'End',
          action: 'Execution terminated successfully',
          variables: env.toObject(),
          previousVariables: prevVarsSnapshot,
        });

        return {
          success: true,
          status: 'COMPLETED',
          steps,
          totalSteps: steps.length,
          output: outputLines.join('\n').trim(),
          variables: env.toObject(),
        };
      }

      throw new Error(`Unknown block type "${currentNode.type}"`);
    } catch (err: any) {
      const activeNode = currentNode || startNode;
      steps.push({
        stepIndex,
        nodeId: activeNode.id,
        nodeType: activeNode.type,
        nodeLabel: activeNode.data?.label || activeNode.id,
        action: `Execution error: ${err.message}`,
        variables: env.toObject(),
        previousVariables: prevVarsSnapshot,
        error: err.message,
      });

      return {
        success: false,
        status: 'ERROR',
        steps,
        totalSteps: steps.length,
        output: outputLines.join('\n').trim(),
        variables: env.toObject(),
        error: {
          nodeId: activeNode.id,
          message: err.message,
          stepIndex,
        },
      };
    }
  }

  // If loop exited because stepIndex >= maxSteps
  const lastNode = currentNode || startNode;
  return {
    success: false,
    status: 'TLE_CYCLE_LIMIT',
    steps,
    totalSteps: steps.length,
    output: outputLines.join('\n').trim(),
    variables: env.toObject(),
    error: {
      nodeId: lastNode.id,
      message: `Execution exceeded maximum safety limit of ${maxSteps} steps. Potential infinite loop detected in flowchart.`,
      stepIndex,
    },
  };
}

function formatOutputValue(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return `[${val.map((item) => formatOutputValue(item)).join(', ')}]`;
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}
