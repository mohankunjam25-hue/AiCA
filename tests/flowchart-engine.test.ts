import { describe, it, expect } from 'vitest';
import {
  FlowchartExpressionParser,
  FlowchartInterpreterEnv,
  evaluateExpression,
  executeAssignment,
  evaluateCondition,
  FlowchartExpressionError,
} from '../packages/shared/src/utils/flowchart-expression-parser.js';
import {
  validateFlowchart,
  executeFlowchart,
} from '../packages/shared/src/utils/flowchart-engine.js';
import { FlowchartGraph } from '../packages/shared/src/types/flowchart.js';

describe('Flowchart AST Expression Parser & Evaluator', () => {
  it('evaluates basic arithmetic expressions with correct precedence', () => {
    const env = new FlowchartInterpreterEnv({ a: 10, b: 5, c: 2 });
    const ast = FlowchartExpressionParser.parse('a + b * c');
    expect(evaluateExpression(ast, env)).toBe(20);

    const parenAst = FlowchartExpressionParser.parse('(a + b) * c');
    expect(evaluateExpression(parenAst, env)).toBe(30);

    const divAst = FlowchartExpressionParser.parse('a / b');
    expect(evaluateExpression(divAst, env)).toBe(2);

    const modAst = FlowchartExpressionParser.parse('a % 3');
    expect(evaluateExpression(modAst, env)).toBe(1);

    const expAst = FlowchartExpressionParser.parse('c ^ 3');
    expect(evaluateExpression(expAst, env)).toBe(8);
  });

  it('evaluates comparison and boolean logic operators', () => {
    const env = new FlowchartInterpreterEnv({ x: 15, y: 20 });
    expect(evaluateCondition('x < y', env)).toBe(true);
    expect(evaluateCondition('x > y', env)).toBe(false);
    expect(evaluateCondition('x <= 15', env)).toBe(true);
    expect(evaluateCondition('y >= 20', env)).toBe(true);
    expect(evaluateCondition('x == 15', env)).toBe(true);
    expect(evaluateCondition('x != 15', env)).toBe(false);
    expect(evaluateCondition('x < y && y == 20', env)).toBe(true);
    expect(evaluateCondition('x > y || x == 15', env)).toBe(true);
    expect(evaluateCondition('!(x > y)', env)).toBe(true);
    expect(evaluateCondition('x < y and not (x == 20)', env)).toBe(true);
  });

  it('supports built-in mathematical and utility functions', () => {
    const env = new FlowchartInterpreterEnv({
      arr: [3, 1, 9, 4],
      neg: -42,
      f: 3.7,
    });
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('min(10, 5, 20)'), env)
    ).toBe(5);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('max(10, 5, 20)'), env)
    ).toBe(20);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('abs(neg)'), env)
    ).toBe(42);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('floor(f)'), env)
    ).toBe(3);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('ceil(f)'), env)
    ).toBe(4);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('round(f)'), env)
    ).toBe(4);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('len(arr)'), env)
    ).toBe(4);
    expect(
      evaluateExpression(FlowchartExpressionParser.parse('arr[2]'), env)
    ).toBe(9);
  });

  it('supports Python-style integer division (//) and pseudocode keywords (Return/print)', () => {
    const env = new FlowchartInterpreterEnv({ N: 1234, count: 4 });

    // Integer division //
    const intDivAst = FlowchartExpressionParser.parse('N // 10');
    expect(evaluateExpression(intDivAst, env)).toBe(123);

    // Assignment with //
    executeAssignment('N = N // 10', env);
    expect(env.get('N')).toBe(123);

    // Pseudocode Return / print prefix in expressions
    const returnAst = FlowchartExpressionParser.parse('Return 1');
    expect(evaluateExpression(returnAst, env)).toBe(1);

    const returnVarAst = FlowchartExpressionParser.parse('return count');
    expect(evaluateExpression(returnVarAst, env)).toBe(4);

    const printAst = FlowchartExpressionParser.parse('print(count)');
    expect(evaluateExpression(printAst, env)).toBe(4);

    // Math.floor method call
    const mathAst = FlowchartExpressionParser.parse('Math.floor(123 / 10)');
    expect(evaluateExpression(mathAst, env)).toBe(12);
  });

  it('safely throws errors on division by zero and undefined variables', () => {
    const env = new FlowchartInterpreterEnv({ a: 10, b: 0 });
    const divZero = FlowchartExpressionParser.parse('a / b');
    expect(() => evaluateExpression(divZero, env)).toThrow(
      /Division by zero/
    );

    const undefAst = FlowchartExpressionParser.parse('undefinedVar + 1');
    expect(() => evaluateExpression(undefAst, env)).toThrow(
      /Undefined variable 'undefinedVar'/
    );
  });

  it('executes assignments and array manipulations', () => {
    const env = new FlowchartInterpreterEnv({ a: 5, b: 10, arr: [100, 200] });

    executeAssignment('sum = a + b', env);
    expect(env.get('sum')).toBe(15);

    executeAssignment('arr[1] = 999', env);
    expect(env.get('arr')).toEqual([100, 999]);

    executeAssignment('arr.append(300)', env);
    expect(env.get('arr')).toEqual([100, 999, 300]);
  });
});

describe('Flowchart Graph Validation', () => {
  it('detects missing Start block', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 'end-1', type: 'end', position: { x: 0, y: 100 }, data: {} },
      ],
      edges: [],
    };
    const result = validateFlowchart(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.type === 'MISSING_START')).toBe(true);
  });

  it('detects multiple Start blocks', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
        { id: 'start-2', type: 'start', position: { x: 50, y: 0 }, data: {} },
        { id: 'end-1', type: 'end', position: { x: 0, y: 100 }, data: {} },
      ],
      edges: [{ id: 'e1', source: 'start-1', target: 'end-1' }],
    };
    const result = validateFlowchart(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.type === 'MULTIPLE_STARTS')).toBe(true);
  });

  it('detects Decision block missing TRUE or FALSE branch', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'd',
          type: 'decision',
          position: { x: 0, y: 100 },
          data: { condition: 'x > 0' },
        },
        { id: 'e', type: 'end', position: { x: 0, y: 200 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'd' },
        { id: 'e2', source: 'd', target: 'e', sourceHandle: 'true', label: 'TRUE' },
      ],
    };
    const result = validateFlowchart(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.type === 'DECISION_BRANCHING')).toBe(true);
  });
});

describe('Flowchart Execution Engine', () => {
  it('executes simple two-number addition correctly', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'input',
          type: 'input',
          position: { x: 0, y: 80 },
          data: { inputVariables: ['a', 'b'] },
        },
        {
          id: 'process',
          type: 'process',
          position: { x: 0, y: 160 },
          data: { assignments: ['sum = a + b'] },
        },
        {
          id: 'output',
          type: 'output',
          position: { x: 0, y: 240 },
          data: { outputExpression: 'sum' },
        },
        { id: 'end', type: 'end', position: { x: 0, y: 320 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 'start', target: 'input' },
        { id: 'e2', source: 'input', target: 'process' },
        { id: 'e3', source: 'process', target: 'output' },
        { id: 'e4', source: 'output', target: 'end' },
      ],
    };

    const res = executeFlowchart(graph, '12 8');
    expect(res.success).toBe(true);
    expect(res.status).toBe('COMPLETED');
    expect(res.output).toBe('20');
    expect(res.variables).toEqual({ a: 12, b: 8, sum: 20 });
    expect(res.steps.length).toBe(5);
  });

  it('executes decision branching correctly (TRUE and FALSE paths)', () => {
    const makeBranchGraph = (): FlowchartGraph => ({
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'in',
          type: 'input',
          position: { x: 0, y: 70 },
          data: { inputVariables: ['score'] },
        },
        {
          id: 'dec',
          type: 'decision',
          position: { x: 0, y: 140 },
          data: { condition: 'score >= 50' },
        },
        {
          id: 'out_pass',
          type: 'output',
          position: { x: -100, y: 220 },
          data: { outputExpression: '"PASS"' },
        },
        {
          id: 'out_fail',
          type: 'output',
          position: { x: 100, y: 220 },
          data: { outputExpression: '"FAIL"' },
        },
        { id: 'e', type: 'end', position: { x: 0, y: 300 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'in' },
        { id: 'e2', source: 'in', target: 'dec' },
        { id: 'e3', source: 'dec', target: 'out_pass', sourceHandle: 'true', label: 'TRUE' },
        { id: 'e4', source: 'dec', target: 'out_fail', sourceHandle: 'false', label: 'FALSE' },
        { id: 'e5', source: 'out_pass', target: 'e' },
        { id: 'e6', source: 'out_fail', target: 'e' },
      ],
    });

    const passRes = executeFlowchart(makeBranchGraph(), '75');
    expect(passRes.success).toBe(true);
    expect(passRes.output).toBe('PASS');

    const failRes = executeFlowchart(makeBranchGraph(), '40');
    expect(failRes.success).toBe(true);
    expect(failRes.output).toBe('FAIL');
  });

  it('executes a while-loop (sum 1 to N) correctly', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'in',
          type: 'input',
          position: { x: 0, y: 60 },
          data: { inputVariables: ['n'] },
        },
        {
          id: 'init',
          type: 'process',
          position: { x: 0, y: 120 },
          data: { assignments: ['sum = 0', 'i = 1'] },
        },
        {
          id: 'loop_check',
          type: 'decision',
          position: { x: 0, y: 200 },
          data: { condition: 'i <= n' },
        },
        {
          id: 'accumulate',
          type: 'process',
          position: { x: -120, y: 280 },
          data: { assignments: ['sum = sum + i', 'i = i + 1'] },
        },
        {
          id: 'out',
          type: 'output',
          position: { x: 120, y: 280 },
          data: { outputExpression: 'sum' },
        },
        { id: 'end', type: 'end', position: { x: 120, y: 350 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'in' },
        { id: 'e2', source: 'in', target: 'init' },
        { id: 'e3', source: 'init', target: 'loop_check' },
        // Loop TRUE branch
        {
          id: 'e4',
          source: 'loop_check',
          target: 'accumulate',
          sourceHandle: 'true',
          label: 'TRUE',
        },
        // Loop back edge
        { id: 'e5', source: 'accumulate', target: 'loop_check' },
        // Loop FALSE branch
        {
          id: 'e6',
          source: 'loop_check',
          target: 'out',
          sourceHandle: 'false',
          label: 'FALSE',
        },
        { id: 'e7', source: 'out', target: 'end' },
      ],
    };

    // Sum 1 to 5 = 1 + 2 + 3 + 4 + 5 = 15
    const res = executeFlowchart(graph, '5');
    expect(res.success).toBe(true);
    expect(res.output).toBe('15');
    expect(res.variables.sum).toBe(15);
    expect(res.variables.i).toBe(6);
  });

  it('guards against infinite loops and terminates gracefully at 500 steps (TLE_CYCLE_LIMIT)', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'dec',
          type: 'decision',
          position: { x: 0, y: 80 },
          data: { condition: '1 == 1' },
        },
        {
          id: 'step',
          type: 'process',
          position: { x: -80, y: 160 },
          data: { assignments: ['x = 1'] },
        },
        { id: 'end', type: 'end', position: { x: 80, y: 160 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'dec' },
        { id: 'e2', source: 'dec', target: 'step', sourceHandle: 'true', label: 'TRUE' },
        { id: 'e3', source: 'step', target: 'dec' },
        { id: 'e4', source: 'dec', target: 'end', sourceHandle: 'false', label: 'FALSE' },
      ],
    };

    const res = executeFlowchart(graph, '', { maxSteps: 100 });
    expect(res.success).toBe(false);
    expect(res.status).toBe('TLE_CYCLE_LIMIT');
    expect(res.totalSteps).toBe(100);
    expect(res.error?.message).toMatch(/limit/i);
  });

  it('safely captures runtime division by zero during step execution', () => {
    const graph: FlowchartGraph = {
      nodes: [
        { id: 's', type: 'start', position: { x: 0, y: 0 }, data: {} },
        {
          id: 'proc',
          type: 'process',
          position: { x: 0, y: 80 },
          data: { assignments: ['x = 10 / 0'] },
        },
        { id: 'e', type: 'end', position: { x: 0, y: 160 }, data: {} },
      ],
      edges: [
        { id: 'e1', source: 's', target: 'proc' },
        { id: 'e2', source: 'proc', target: 'e' },
      ],
    };

    const res = executeFlowchart(graph);
    expect(res.success).toBe(false);
    expect(res.status).toBe('ERROR');
    expect(res.error?.message).toMatch(/Division by zero/);
    expect(res.error?.nodeId).toBe('proc');
  });
});
