// Deterministic AST Expression Parser & Interpreter for Flowchart Execution
// Zero eval(), Zero Function(), Safe Sandboxed AST Execution

export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'BOOLEAN'
  | 'IDENTIFIER'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'DOT'
  | 'ASSIGN'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

export interface ASTNode {
  type: string;
  [key: string]: any;
}

export class FlowchartExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FlowchartExpressionError';
  }
}

export class FlowchartTokenizer {
  private pos = 0;
  private input: string;

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];

      // Whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }

      // Numbers
      if (/[0-9]/.test(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Strings (single or double quote)
      if (char === '"' || char === "'") {
        tokens.push(this.readString(char));
        continue;
      }

      // 2-character operators
      const twoChar = this.input.slice(this.pos, this.pos + 2);
      if (
        ['==', '!=', '<=', '>=', '&&', '||', '**', '//'].includes(twoChar)
      ) {
        tokens.push({ type: 'OPERATOR', value: twoChar, position: this.pos });
        this.pos += 2;
        continue;
      }

      // 1-character operators & delimiters
      if (['+', '-', '*', '/', '%', '^', '<', '>', '!'].includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char, position: this.pos });
        this.pos++;
        continue;
      }

      if (char === '=') {
        tokens.push({ type: 'ASSIGN', value: '=', position: this.pos });
        this.pos++;
        continue;
      }

      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', position: this.pos });
        this.pos++;
        continue;
      }
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', position: this.pos });
        this.pos++;
        continue;
      }
      if (char === '[') {
        tokens.push({ type: 'LBRACKET', value: '[', position: this.pos });
        this.pos++;
        continue;
      }
      if (char === ']') {
        tokens.push({ type: 'RBRACKET', value: ']', position: this.pos });
        this.pos++;
        continue;
      }
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: ',', position: this.pos });
        this.pos++;
        continue;
      }
      if (char === '.') {
        tokens.push({ type: 'DOT', value: '.', position: this.pos });
        this.pos++;
        continue;
      }

      // Identifiers / Keywords
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      throw new FlowchartExpressionError(
        `Unexpected character '${char}' at index ${this.pos}`
      );
    }

    tokens.push({ type: 'EOF', value: '', position: this.pos });
    return tokens;
  }

  private readNumber(): Token {
    const start = this.pos;
    let hasDot = false;
    while (this.pos < this.input.length) {
      const c = this.input[this.pos];
      if (/[0-9]/.test(c)) {
        this.pos++;
      } else if (c === '.' && !hasDot) {
        hasDot = true;
        this.pos++;
      } else {
        break;
      }
    }
    return {
      type: 'NUMBER',
      value: this.input.slice(start, this.pos),
      position: start,
    };
  }

  private readString(quote: string): Token {
    const start = this.pos;
    this.pos++; // skip opening quote
    let str = '';
    while (this.pos < this.input.length) {
      const c = this.input[this.pos];
      if (c === quote) {
        this.pos++; // skip closing quote
        return { type: 'STRING', value: str, position: start };
      }
      if (c === '\\' && this.pos + 1 < this.input.length) {
        this.pos++;
        const next = this.input[this.pos];
        if (next === 'n') str += '\n';
        else if (next === 't') str += '\t';
        else str += next;
        this.pos++;
      } else {
        str += c;
        this.pos++;
      }
    }
    throw new FlowchartExpressionError(`Unterminated string starting at index ${start}`);
  }

  private readIdentifier(): Token {
    const start = this.pos;
    while (
      this.pos < this.input.length &&
      /[a-zA-Z0-9_]/.test(this.input[this.pos])
    ) {
      this.pos++;
    }
    const val = this.input.slice(start, this.pos);
    const lower = val.toLowerCase();

    if (lower === 'true' || lower === 'false') {
      return { type: 'BOOLEAN', value: lower, position: start };
    }
    if (['and', 'or', 'not'].includes(lower)) {
      return { type: 'OPERATOR', value: lower, position: start };
    }
    return { type: 'IDENTIFIER', value: val, position: start };
  }
}

export class FlowchartExpressionParser {
  private tokens: Token[] = [];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  static parse(expression: string): ASTNode {
    const tokenizer = new FlowchartTokenizer(expression);
    const tokens = tokenizer.tokenize();
    const parser = new FlowchartExpressionParser(tokens);
    const ast = parser.parseExpression();
    if (!parser.isAtEnd()) {
      throw new FlowchartExpressionError(
        `Unexpected token '${parser.peek().value}' after expression`
      );
    }
    return ast;
  }

  parseExpression(): ASTNode {
    // Gracefully handle pseudocode prefix keywords: "return 1", "Return count", "print 42"
    if (
      this.current < this.tokens.length &&
      this.tokens[this.current].type === 'IDENTIFIER' &&
      ['return', 'print', 'output'].includes(this.tokens[this.current].value.toLowerCase())
    ) {
      this.current++;
    }
    return this.parseLogicalOr();
  }

  private parseLogicalOr(): ASTNode {
    let expr = this.parseLogicalAnd();
    while (this.matchOperator('||', 'or')) {
      const operator = this.previous().value;
      const right = this.parseLogicalAnd();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseLogicalAnd(): ASTNode {
    let expr = this.parseEquality();
    while (this.matchOperator('&&', 'and')) {
      const operator = this.previous().value;
      const right = this.parseEquality();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseEquality(): ASTNode {
    let expr = this.parseComparison();
    while (this.matchOperator('==', '!=')) {
      const operator = this.previous().value;
      const right = this.parseComparison();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseComparison(): ASTNode {
    let expr = this.parseAdditive();
    while (this.matchOperator('<', '<=', '>', '>=')) {
      const operator = this.previous().value;
      const right = this.parseAdditive();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseAdditive(): ASTNode {
    let expr = this.parseMultiplicative();
    while (this.matchOperator('+', '-')) {
      const operator = this.previous().value;
      const right = this.parseMultiplicative();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseMultiplicative(): ASTNode {
    let expr = this.parseExponent();
    while (this.matchOperator('*', '/', '//', '%')) {
      const operator = this.previous().value;
      const right = this.parseExponent();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseExponent(): ASTNode {
    let expr = this.parseUnary();
    while (this.matchOperator('^', '**')) {
      const operator = this.previous().value;
      const right = this.parseUnary();
      expr = { type: 'BinaryOp', operator, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ASTNode {
    if (this.matchOperator('-', '+', '!', 'not')) {
      const operator = this.previous().value;
      const argument = this.parseUnary();
      return { type: 'UnaryOp', operator, argument };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match('LBRACKET')) {
        // Array index access: expr[index]
        const indexExpr = this.parseExpression();
        this.consume('RBRACKET', "Expected ']' after array index");
        expr = { type: 'MemberAccess', object: expr, property: indexExpr };
      } else if (this.match('DOT')) {
        // Property or method call: expr.length or expr.append(val)
        const nameToken = this.consume(
          'IDENTIFIER',
          'Expected identifier after "."'
        );
        const name = nameToken.value;

        if (this.match('LPAREN')) {
          const args = this.parseArguments();
          expr = { type: 'MethodCall', object: expr, method: name, args };
        } else {
          expr = {
            type: 'PropertyAccess',
            object: expr,
            property: name,
          };
        }
      } else if (this.match('LPAREN')) {
        // Function call on identifier: fn(a, b)
        if (expr.type !== 'Identifier') {
          throw new FlowchartExpressionError(
            'Only identifiers can be invoked as functions'
          );
        }
        const args = this.parseArguments();
        expr = { type: 'Call', callee: expr.name, args };
      } else {
        break;
      }
    }

    return expr;
  }

  private parseArguments(): ASTNode[] {
    const args: ASTNode[] = [];
    if (!this.check('RPAREN')) {
      do {
        args.push(this.parseExpression());
      } while (this.match('COMMA'));
    }
    this.consume('RPAREN', "Expected ')' after function arguments");
    return args;
  }

  private parsePrimary(): ASTNode {
    if (this.match('NUMBER')) {
      const num = Number(this.previous().value);
      return { type: 'Literal', value: num };
    }
    if (this.match('STRING')) {
      return { type: 'Literal', value: this.previous().value };
    }
    if (this.match('BOOLEAN')) {
      return { type: 'Literal', value: this.previous().value === 'true' };
    }
    if (this.match('IDENTIFIER')) {
      return { type: 'Identifier', name: this.previous().value };
    }
    if (this.match('LPAREN')) {
      const expr = this.parseExpression();
      this.consume('RPAREN', "Expected ')' after expression");
      return expr;
    }
    if (this.match('LBRACKET')) {
      // Array literal [1, 2, 3]
      const elements: ASTNode[] = [];
      if (!this.check('RBRACKET')) {
        do {
          elements.push(this.parseExpression());
        } while (this.match('COMMA'));
      }
      this.consume('RBRACKET', "Expected ']' after array elements");
      return { type: 'ArrayLiteral', elements };
    }

    throw new FlowchartExpressionError(
      `Unexpected token '${this.peek().value || 'EOF'}' at position ${this.peek().position}`
    );
  }

  private match(...types: TokenType[]): boolean {
    for (const t of types) {
      if (this.check(t)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private matchOperator(...ops: string[]): boolean {
    if (this.check('OPERATOR')) {
      if (ops.includes(this.peek().value)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return type === 'EOF';
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return (
      this.current >= this.tokens.length ||
      this.tokens[this.current].type === 'EOF'
    );
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw new FlowchartExpressionError(
      `${message} (found '${this.peek().value}' at ${this.peek().position})`
    );
  }
}

// Built-in functions registry
const BUILTINS: Record<string, (...args: any[]) => any> = {
  min: (...args: any[]) => {
    if (args.length === 0) throw new FlowchartExpressionError('min() requires at least 1 argument');
    if (Array.isArray(args[0]) && args.length === 1) return Math.min(...args[0]);
    return Math.min(...args);
  },
  max: (...args: any[]) => {
    if (args.length === 0) throw new FlowchartExpressionError('max() requires at least 1 argument');
    if (Array.isArray(args[0]) && args.length === 1) return Math.max(...args[0]);
    return Math.max(...args);
  },
  abs: (x: any) => Math.abs(Number(x)),
  len: (x: any) => {
    if (x == null) return 0;
    if (Array.isArray(x) || typeof x === 'string') return x.length;
    if (typeof x === 'object') return Object.keys(x).length;
    return 0;
  },
  length: (x: any) => BUILTINS.len(x),
  floor: (x: any) => Math.floor(Number(x)),
  ceil: (x: any) => Math.ceil(Number(x)),
  round: (x: any) => Math.round(Number(x)),
  sqrt: (x: any) => Math.sqrt(Number(x)),
  pow: (base: any, exp: any) => Math.pow(Number(base), Number(exp)),
  int: (x: any) => parseInt(x, 10),
  float: (x: any) => parseFloat(x),
  str: (x: any) => (x === null || x === undefined ? '' : String(x)),
  append: (arr: any, val: any) => {
    if (!Array.isArray(arr)) throw new FlowchartExpressionError('append() target must be an array');
    arr.push(val);
    return arr;
  },
  pop: (arr: any) => {
    if (!Array.isArray(arr)) throw new FlowchartExpressionError('pop() target must be an array');
    return arr.pop();
  },
  print: (...args: any[]) => (args.length === 1 ? args[0] : args),
};

export class FlowchartInterpreterEnv {
  private variables: Map<string, any>;

  constructor(initialVars: Record<string, any> = {}) {
    this.variables = new Map(Object.entries(initialVars));
  }

  get(name: string): any {
    if (name === 'Math') {
      return Math;
    }
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    throw new FlowchartExpressionError(`Undefined variable '${name}'`);
  }

  has(name: string): boolean {
    if (name === 'Math') return true;
    return this.variables.has(name);
  }

  set(name: string, value: any): void {
    this.variables.set(name, value);
  }

  toObject(): Record<string, any> {
    const obj: Record<string, any> = {};
    for (const [k, v] of this.variables.entries()) {
      // Deep clone arrays/objects to prevent mutation leaks across steps
      if (Array.isArray(v)) {
        obj[k] = [...v];
      } else if (v && typeof v === 'object') {
        obj[k] = { ...v };
      } else {
        obj[k] = v;
      }
    }
    return obj;
  }
}

export function evaluateExpression(
  ast: ASTNode,
  env: FlowchartInterpreterEnv
): any {
  switch (ast.type) {
    case 'Literal':
      return ast.value;

    case 'Identifier':
      return env.get(ast.name);

    case 'ArrayLiteral':
      return ast.elements.map((el: ASTNode) => evaluateExpression(el, env));

    case 'MemberAccess': {
      const target = evaluateExpression(ast.object, env);
      const prop = evaluateExpression(ast.property, env);
      if (target == null) {
        throw new FlowchartExpressionError('Cannot index null or undefined');
      }
      if (Array.isArray(target)) {
        const idx = Number(prop);
        if (isNaN(idx)) {
          throw new FlowchartExpressionError(`Array index must be a number, got '${prop}'`);
        }
        // Support Python-like negative indexing
        const actualIdx = idx < 0 ? target.length + idx : idx;
        if (actualIdx < 0 || actualIdx >= target.length) {
          throw new FlowchartExpressionError(
            `Array index out of bounds: index ${idx} for array of length ${target.length}`
          );
        }
        return target[actualIdx];
      }
      return target[prop];
    }

    case 'PropertyAccess': {
      const target = evaluateExpression(ast.object, env);
      if (target == null) {
        throw new FlowchartExpressionError(`Cannot access property '${ast.property}' of null`);
      }
      if (ast.property === 'length') {
        return Array.isArray(target) || typeof target === 'string'
          ? target.length
          : undefined;
      }
      return target[ast.property];
    }

    case 'MethodCall': {
      const target = evaluateExpression(ast.object, env);
      const args = ast.args.map((a: ASTNode) => evaluateExpression(a, env));
      if (Array.isArray(target)) {
        if (ast.method === 'append' || ast.method === 'push') {
          target.push(args[0]);
          return target;
        }
        if (ast.method === 'pop') {
          return target.pop();
        }
        if (ast.method === 'sort') {
          target.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
          return target;
        }
        if (ast.method === 'reverse') {
          target.reverse();
          return target;
        }
      }
      if (target === Math && typeof (Math as any)[ast.method] === 'function') {
        return (Math as any)[ast.method](...args);
      }
      throw new FlowchartExpressionError(
        `Unsupported method '${ast.method}' on ${typeof target}`
      );
    }

    case 'Call': {
      const fn = BUILTINS[ast.callee];
      if (!fn) {
        throw new FlowchartExpressionError(`Unknown function '${ast.callee}()'`);
      }
      const evaluatedArgs = ast.args.map((a: ASTNode) =>
        evaluateExpression(a, env)
      );
      return fn(...evaluatedArgs);
    }

    case 'UnaryOp': {
      const val = evaluateExpression(ast.argument, env);
      switch (ast.operator) {
        case '-':
          return -val;
        case '+':
          return +val;
        case '!':
        case 'not':
          return !val;
        default:
          throw new FlowchartExpressionError(
            `Unknown unary operator '${ast.operator}'`
          );
      }
    }

    case 'BinaryOp': {
      const left = evaluateExpression(ast.left, env);
      const right = evaluateExpression(ast.right, env);

      switch (ast.operator) {
        case '+':
          // Array concatenation or string concatenation or addition
          if (Array.isArray(left) && Array.isArray(right)) {
            return [...left, ...right];
          }
          if (typeof left === 'string' || typeof right === 'string') {
            return `${left}${right}`;
          }
          return Number(left) + Number(right);

        case '-':
          return Number(left) - Number(right);

        case '*':
          return Number(left) * Number(right);

        case '/':
          if (Number(right) === 0) {
            throw new FlowchartExpressionError('Division by zero');
          }
          return Number(left) / Number(right);

        case '//':
          if (Number(right) === 0) {
            throw new FlowchartExpressionError('Division by zero in integer division');
          }
          return Math.floor(Number(left) / Number(right));

        case '%':
          if (Number(right) === 0) {
            throw new FlowchartExpressionError('Division by zero in modulo operation');
          }
          return Number(left) % Number(right);

        case '^':
        case '**':
          return Math.pow(Number(left), Number(right));

        case '==':
          return left === right;

        case '!=':
          return left !== right;

        case '<':
          return left < right;

        case '<=':
          return left <= right;

        case '>':
          return left > right;

        case '>=':
          return left >= right;

        case '&&':
        case 'and':
          return Boolean(left) && Boolean(right);

        case '||':
        case 'or':
          return Boolean(left) || Boolean(right);

        default:
          throw new FlowchartExpressionError(
            `Unknown binary operator '${ast.operator}'`
          );
      }
    }

    default:
      throw new FlowchartExpressionError(`Unknown AST node type: ${ast.type}`);
  }
}

export interface AssignmentExecutionResult {
  variable: string;
  expression: string;
  value: any;
}

/**
 * Execute an assignment string like:
 * "sum = a + b"
 * "i = i + 1"
 * "arr[0] = 42"
 * "arr.append(x)"
 */
export function executeAssignment(
  statement: string,
  env: FlowchartInterpreterEnv
): AssignmentExecutionResult {
  const trimmed = statement.trim();
  if (!trimmed) {
    throw new FlowchartExpressionError('Empty assignment statement');
  }

  // Check if it's a method call statement like arr.append(x)
  if (trimmed.includes('.') && trimmed.includes('(') && !trimmed.includes('=')) {
    const ast = FlowchartExpressionParser.parse(trimmed);
    const result = evaluateExpression(ast, env);
    // Find the root object name
    const rootVar = trimmed.split('.')[0].trim();
    return {
      variable: rootVar,
      expression: trimmed,
      value: env.has(rootVar) ? env.get(rootVar) : result,
    };
  }

  // Standard assignment: target = expr
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) {
    throw new FlowchartExpressionError(
      `Invalid assignment statement: '${statement}'. Expected '='.`
    );
  }

  const targetStr = trimmed.slice(0, eqIdx).trim();
  const exprStr = trimmed.slice(eqIdx + 1).trim();

  if (!targetStr) {
    throw new FlowchartExpressionError('Missing assignment target');
  }
  if (!exprStr) {
    throw new FlowchartExpressionError(`Missing expression in assignment '${statement}'`);
  }

  const exprAst = FlowchartExpressionParser.parse(exprStr);
  const value = evaluateExpression(exprAst, env);

  // Check if target is an array index: arr[i]
  if (targetStr.includes('[') && targetStr.endsWith(']')) {
    const lbracket = targetStr.indexOf('[');
    const arrayName = targetStr.slice(0, lbracket).trim();
    const indexExprStr = targetStr.slice(lbracket + 1, -1).trim();

    if (!env.has(arrayName)) {
      throw new FlowchartExpressionError(`Undefined array variable '${arrayName}'`);
    }

    const arr = env.get(arrayName);
    if (!Array.isArray(arr)) {
      throw new FlowchartExpressionError(`Variable '${arrayName}' is not an array`);
    }

    const indexAst = FlowchartExpressionParser.parse(indexExprStr);
    const idx = Number(evaluateExpression(indexAst, env));

    if (isNaN(idx)) {
      throw new FlowchartExpressionError(`Array index must be a number`);
    }

    const actualIdx = idx < 0 ? arr.length + idx : idx;
    if (actualIdx < 0 || actualIdx >= arr.length) {
      throw new FlowchartExpressionError(
        `Array index ${idx} out of bounds for array of length ${arr.length}`
      );
    }

    arr[actualIdx] = value;
    return {
      variable: `${arrayName}[${idx}]`,
      expression: exprStr,
      value,
    };
  }

  // Simple variable assignment
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(targetStr)) {
    throw new FlowchartExpressionError(
      `Invalid variable name '${targetStr}'. Must be an alphanumeric identifier.`
    );
  }

  env.set(targetStr, value);
  return {
    variable: targetStr,
    expression: exprStr,
    value,
  };
}

/**
 * Evaluate a boolean condition for Decision blocks.
 * e.g. "a > b", "i < n && sum != 0", "flag"
 */
export function evaluateCondition(
  condition: string,
  env: FlowchartInterpreterEnv
): boolean {
  const trimmed = condition.trim();
  if (!trimmed) {
    throw new FlowchartExpressionError('Empty condition expression in Decision block');
  }
  const ast = FlowchartExpressionParser.parse(trimmed);
  const result = evaluateExpression(ast, env);
  return Boolean(result);
}
