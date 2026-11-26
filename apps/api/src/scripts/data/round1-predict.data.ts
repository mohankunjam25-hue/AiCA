import { ProblemSeedDefinition } from './round3-logic.data.js';

export const round1PredictProblems: ProblemSeedDefinition[] = [
  // Q1. Variables, Data Types & String Concatenation
  {
    title: 'Predict Output: Variables & String Concatenation',
    slug: 'predict-output-string-concatenation',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['JavaScript', 'Type-Coercion', 'Beginner', 'Predict-Output'],
    description: `Predict the exact console output of the following JavaScript snippet without running it:

\`\`\`javascript
let a = 5;
let b = "3";
let c = 2;
console.log(a + b + c);
console.log(a + c + b);
\`\`\`

### Concept
- In \`a + b + c\`: \`5 + "3"\` results in string \`"53"\`, then \`"53" + 2\` becomes \`"532"\`.
- In \`a + c + b\`: \`5 + 2\` performs numeric addition first (\`7\`), then \`7 + "3"\` results in \`"73"\`.

### Input Format
A trigger line \`run\`.

### Output Format
Print the two output lines:
\`532\`
\`73\``,
    constraints: ['Standard JavaScript ES6+ execution.'],
    examples: [
      { input: 'run', output: '532\\n73', explanation: 'Left-to-right evaluation with string concatenation coercion.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `// Predict what is logged by the two console.log lines
function predictOutput() {
    let a = 5;
    let b = "3";
    let c = 2;
    console.log(a + b + c);
    console.log(a + c + b);
}

predictOutput();`,
      python: `def predictOutput():
    print("532")
    print("73")

predictOutput()`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "532" << endl << "73" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q1-1', input: 'run', expectedOutput: '532\n73', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("532");\nconsole.log("73");`,
      python: `print("532")\nprint("73")`
    }
  },

  // Q2. == vs === and Type Coercion
  {
    title: 'Predict Output: Loose vs Strict Equality',
    slug: 'predict-output-loose-vs-strict-equality',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['JavaScript', 'Equality', 'Coercion', 'Beginner', 'Predict-Output'],
    description: `Predict the exact boolean outputs of the following statements:

\`\`\`javascript
console.log(0 == false);
console.log(0 === false);
console.log("10" == 10);
console.log("10" === 10);
\`\`\`

### Concept
- \`0 == false\` is \`true\` because \`false\` coerces to \`0\`.
- \`0 === false\` is \`false\` (different types: number vs boolean).
- \`"10" == 10\` is \`true\` (string \`"10"\` coerces to number \`10\`).
- \`"10" === 10\` is \`false\` (different types: string vs number).

### Output Format
Print the 4 boolean results on separate lines.`,
    constraints: ['Standard JavaScript coercion rules.'],
    examples: [
      { input: 'run', output: 'true\\nfalse\\ntrue\\nfalse', explanation: 'Equality evaluation.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `console.log(0 == false);
console.log(0 === false);
console.log("10" == 10);
console.log("10" === 10);`,
      python: `print("true")
print("false")
print("true")
print("false")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "true" << endl << "false" << endl << "true" << endl << "false" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q2-1', input: 'run', expectedOutput: 'true\nfalse\ntrue\nfalse', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("true");\nconsole.log("false");\nconsole.log("true");\nconsole.log("false");`,
      python: `print("true")\nprint("false")\nprint("true")\nprint("false")`
    }
  },

  // Q3. Pre-increment vs Post-increment
  {
    title: 'Predict Output: Pre-increment vs Post-increment',
    slug: 'predict-output-pre-vs-post-increment',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['JavaScript', 'Operators', 'Beginner', 'Predict-Output'],
    description: `Predict the output of the following increment operations:

\`\`\`javascript
let x = 5;
let y = x++;
let z = ++x;
console.log(x, y, z);
\`\`\`

### Concept
- \`y = x++\`: \`y\` gets current \`5\`, then \`x\` becomes \`6\`.
- \`z = ++x\`: \`x\` increments to \`7\`, then \`z\` receives \`7\`.
- Final: \`x = 7\`, \`y = 5\`, \`z = 7\`.

### Output Format
Print the three integers space-separated on a single line.`,
    constraints: ['Standard unary increment semantics.'],
    examples: [
      { input: 'run', output: '7 5 7', explanation: 'x=7, y=5, z=7.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `let x = 5;
let y = x++;
let z = ++x;
console.log(x, y, z);`,
      python: `print("7 5 7")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "7 5 7" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q3-1', input: 'run', expectedOutput: '7 5 7', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("7 5 7");`,
      python: `print("7 5 7")`
    }
  },

  // Q4. Conditions, Loops & continue Statement
  {
    title: 'Predict Output: Loop with Continue Statement',
    slug: 'predict-output-loop-continue',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['JavaScript', 'Loops', 'Control-Flow', 'Beginner', 'Predict-Output'],
    description: `Predict the value of \`sum\` after this loop terminates:

\`\`\`javascript
let sum = 0;
for (let i = 1; i <= 5; i++) {
  if (i % 2 === 0) continue;
  sum += i;
}
console.log(sum);
\`\`\`

### Concept
The loop skips even numbers (\`2\` and \`4\`) and sums odd numbers: \`1 + 3 + 5 = 9\`.

### Output Format
Print the final value of \`sum\`.`,
    constraints: ['1 <= i <= 5'],
    examples: [
      { input: 'run', output: '9', explanation: '1 + 3 + 5 = 9.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `let sum = 0;
for (let i = 1; i <= 5; i++) {
    if (i % 2 === 0) continue;
    sum += i;
}
console.log(sum);`,
      python: `print(9)`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << 9 << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q4-1', input: 'run', expectedOutput: '9', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log(9);`,
      python: `print(9)`
    }
  },

  // Q5. Arrays & const Reference Mutability
  {
    title: 'Predict Output: const Array Reference Mutability',
    slug: 'predict-output-const-array-mutability',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['JavaScript', 'Arrays', 'Mutability', 'Beginner', 'Predict-Output'],
    description: `Predict the output of the following operations on a \`const\` array:

\`\`\`javascript
const nums = [10, 20, 30];
nums.push(40);
nums[1] = 25;
console.log(nums.length, nums[1], nums[3]);
\`\`\`

### Concept
In JavaScript, \`const\` prevents reassignment of the variable binding, but does not freeze the underlying array data. Mutations like \`.push()\` and index assignment succeed without error.
- \`nums.length\` = \`4\`
- \`nums[1]\` = \`25\`
- \`nums[3]\` = \`40\`

### Output Format
Print the three numbers space-separated on a single line.`,
    constraints: ['Standard JavaScript object reference mutability.'],
    examples: [
      { input: 'run', output: '4 25 40', explanation: 'length=4, nums[1]=25, nums[3]=40.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `const nums = [10, 20, 30];
nums.push(40);
nums[1] = 25;
console.log(nums.length, nums[1], nums[3]);`,
      python: `print("4 25 40")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "4 25 40" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q5-1', input: 'run', expectedOutput: '4 25 40', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("4 25 40");`,
      python: `print("4 25 40")`
    }
  },

  // Q6. var vs let & Block Scope
  {
    title: 'Predict Output: var vs let Block Scope',
    slug: 'predict-output-var-vs-let-scope',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['JavaScript', 'Scope', 'Intermediate', 'Predict-Output'],
    description: `Predict the output of the two \`console.log\` statements:

\`\`\`javascript
var a = 10;
let b = 20;
if (true) {
  var a = 30;
  let b = 40;
  console.log(a, b);
}
console.log(a, b);
\`\`\`

### Concept
- \`var a\` is function-scoped (or globally scoped). Declaring \`var a = 30\` inside the block overwrites outer \`a\`.
- \`let b\` is block-scoped. Inside the \`if\` block, \`b\` is \`40\`. Outside, the outer \`b\` remains \`20\`.

### Output Format
Print the two lines:
\`30 40\`
\`30 20\``,
    constraints: ['Standard ES6 block scoping.'],
    examples: [
      { input: 'run', output: '30 40\\n30 20', explanation: 'Inside: 30 40, Outside: 30 20.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `var a = 10;
let b = 20;
if (true) {
    var a = 30;
    let b = 40;
    console.log(a, b);
}
console.log(a, b);`,
      python: `print("30 40")
print("30 20")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "30 40" << endl << "30 20" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q6-1', input: 'run', expectedOutput: '30 40\n30 20', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("30 40");\nconsole.log("30 20");`,
      python: `print("30 40")\nprint("30 20")`
    }
  },

  // Q7. Hoisting (var vs Function Declaration)
  {
    title: 'Predict Output: Hoisting (var vs Function Declaration)',
    slug: 'predict-output-hoisting-var-function',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['JavaScript', 'Hoisting', 'Intermediate', 'Predict-Output'],
    description: `Predict what is printed by the following code:

\`\`\`javascript
console.log(greet());
console.log(count);
var count = 5;
function greet() {
  return "Hello JS";
}
console.log(count);
\`\`\`

### Concept
- Function declarations are hoisted completely with their implementation (\`greet()\` returns \`"Hello JS"\`).
- \`var count\` is hoisted with initial value \`undefined\`.
- After assignment, \`count\` becomes \`5\`.

### Output Format
Print the three lines:
\`Hello JS\`
\`undefined\`
\`5\``,
    constraints: ['Standard JavaScript hoisting.'],
    examples: [
      { input: 'run', output: 'Hello JS\\nundefined\\n5', explanation: 'Hoisting behavior.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `console.log(greet());
console.log(count);
var count = 5;
function greet() {
    return "Hello JS";
}
console.log(count);`,
      python: `print("Hello JS")
print("undefined")
print("5")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "Hello JS" << endl << "undefined" << endl << "5" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q7-1', input: 'run', expectedOutput: 'Hello JS\nundefined\n5', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("Hello JS");\nconsole.log("undefined");\nconsole.log(5);`,
      python: `print("Hello JS")\nprint("undefined")\nprint("5")`
    }
  },

  // Q8. Nested Loops & String Accumulation
  {
    title: 'Predict Output: Nested Loops String Pattern',
    slug: 'predict-output-nested-loops-pattern',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['JavaScript', 'Nested-Loops', 'Intermediate', 'Predict-Output'],
    description: `Predict the string accumulated by the nested loop:

\`\`\`javascript
let result = "";
for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= i; j++) {
    result += j;
  }
  result += "-";
}
console.log(result);
\`\`\`

### Concept
- \`i = 1\`: adds \`1-\`
- \`i = 2\`: adds \`12-\`
- \`i = 3\`: adds \`123-\`
Total: \`1-12-123-\`

### Output Format
Print the accumulated string.`,
    constraints: ['1 <= i <= 3'],
    examples: [
      { input: 'run', output: '1-12-123-', explanation: 'Triangular accumulation.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `let result = "";
for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= i; j++) {
        result += j;
    }
    result += "-";
}
console.log(result);`,
      python: `print("1-12-123-")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "1-12-123-" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q8-1', input: 'run', expectedOutput: '1-12-123-', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("1-12-123-");`,
      python: `print("1-12-123-")`
    }
  },

  // Q9. Functions, Callbacks & Array Join
  {
    title: 'Predict Output: Custom Higher-Order Map',
    slug: 'predict-output-higher-order-map',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['JavaScript', 'Callbacks', 'Intermediate', 'Predict-Output'],
    description: `Predict the output of the custom \`process\` callback function:

\`\`\`javascript
function process(arr, fn) {
  let out = [];
  for (let item of arr) {
    out.push(fn(item));
  }
  return out;
}
const nums = [1, 2, 3, 4];
const res = process(nums, (n) => n * 2);
console.log(res.join(","));
\`\`\`

### Concept
The callback multiplies each element by 2 (\`[2, 4, 6, 8]\`) and joins them with commas.

### Output Format
Print the comma-separated string.`,
    constraints: ['Input array [1, 2, 3, 4].'],
    examples: [
      { input: 'run', output: '2,4,6,8', explanation: 'Elements doubled and joined.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `function process(arr, fn) {
    let out = [];
    for (let item of arr) {
        out.push(fn(item));
    }
    return out;
}
const nums = [1, 2, 3, 4];
const res = process(nums, (n) => n * 2);
console.log(res.join(","));`,
      python: `print("2,4,6,8")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "2,4,6,8" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q9-1', input: 'run', expectedOutput: '2,4,6,8', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("2,4,6,8");`,
      python: `print("2,4,6,8")`
    }
  },

  // Q10. Implicit Type Coercion (-, +, Boolean, typeof NaN)
  {
    title: 'Predict Output: Implicit Coercion & Typeof NaN',
    slug: 'predict-output-implicit-coercion-nan',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['JavaScript', 'Type-Coercion', 'Intermediate', 'Predict-Output'],
    description: `Predict the output of the four console statements:

\`\`\`javascript
console.log("5" - 2);
console.log("5" + 2);
console.log(true + false);
console.log(typeof NaN);
\`\`\`

### Concept
- \`"5" - 2\`: Minus forces numeric subtraction -> \`3\`.
- \`"5" + 2\`: Plus with a string triggers concatenation -> \`"52"\`.
- \`true + false\`: \`1 + 0\` -> \`1\`.
- \`typeof NaN\`: In JavaScript, \`NaN\` is of type \`"number"\`.

### Output Format
Print the four outputs on separate lines:
\`3\`
\`52\`
\`1\`
\`number\``,
    constraints: ['Standard JavaScript arithmetic coercion.'],
    examples: [
      { input: 'run', output: '3\\n52\\n1\\nnumber', explanation: 'Exact coercion evaluation.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `console.log("5" - 2);
console.log("5" + 2);
console.log(true + false);
console.log(typeof NaN);`,
      python: `print("3")
print("52")
print("1")
print("number")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "3" << endl << "52" << endl << "1" << endl << "number" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q10-1', input: 'run', expectedOutput: '3\n52\n1\nnumber', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log(3);\nconsole.log("52");\nconsole.log(1);\nconsole.log("number");`,
      python: `print("3")\nprint("52")\nprint("1")\nprint("number")`
    }
  },

  // Q11. Closures & Independent Lexical Environments
  {
    title: 'Predict Output: Independent Closure Instances',
    slug: 'predict-output-closure-independent-state',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['JavaScript', 'Closures', 'Advanced', 'Predict-Output'],
    description: `Predict the output of independent closure counters:

\`\`\`javascript
function makeCounter(start) {
  let count = start;
  return function () {
    count += 2;
    return count;
  };
}
const c1 = makeCounter(1);
const c2 = makeCounter(10);
console.log(c1(), c1(), c2());
\`\`\`

### Concept
- \`c1\` starts at \`1\`. First call -> \`3\`. Second call -> \`5\`.
- \`c2\` has an independent lexical environment starting at \`10\`. First call -> \`12\`.
- Output: \`3 5 12\`.

### Output Format
Print the three integers space-separated on a single line.`,
    constraints: ['Lexical scoping rules.'],
    examples: [
      { input: 'run', output: '3 5 12', explanation: 'c1=3, c1=5, c2=12.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `function makeCounter(start) {
    let count = start;
    return function () {
        count += 2;
        return count;
    };
}
const c1 = makeCounter(1);
const c2 = makeCounter(10);
console.log(c1(), c1(), c2());`,
      python: `print("3 5 12")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "3 5 12" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q11-1', input: 'run', expectedOutput: '3 5 12', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("3 5 12");`,
      python: `print("3 5 12")`
    }
  },

  // Q12. Loop Closures: var vs let Binding
  {
    title: 'Predict Output: Closures in Loops (var vs let)',
    slug: 'predict-output-loop-closures-var-let',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['JavaScript', 'Closures', 'Scope', 'Advanced', 'Predict-Output'],
    description: `Predict the output of closures created across loops:

\`\`\`javascript
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
for (let j = 0; j < 3; j++) {
  fns.push(() => j);
}
console.log(fns[0](), fns[1](), fns[3](), fns[4]());
\`\`\`

### Concept
- The \`var i\` loop shares one hoisted variable \`i\`. After the loop finishes, \`i = 3\`. So \`fns[0]()\` and \`fns[1]()\` both return \`3\`.
- The \`let j\` loop creates a new lexical binding for each iteration. \`fns[3]()\` returns \`0\` and \`fns[4]()\` returns \`1\`.

### Output Format
Print the four integers space-separated:
\`3 3 0 1\``,
    constraints: ['Standard ES6 closure bindings.'],
    examples: [
      { input: 'run', output: '3 3 0 1', explanation: 'fns[0]=3, fns[1]=3, fns[3]=0, fns[4]=1.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `const fns = [];
for (var i = 0; i < 3; i++) {
    fns.push(() => i);
}
for (let j = 0; j < 3; j++) {
    fns.push(() => j);
}
console.log(fns[0](), fns[1](), fns[3](), fns[4]());`,
      python: `print("3 3 0 1")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "3 3 0 1" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q12-1', input: 'run', expectedOutput: '3 3 0 1', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("3 3 0 1");`,
      python: `print("3 3 0 1")`
    }
  },

  // Q13. Promise Chaining & .catch() Error Recovery
  {
    title: 'Predict Output: Promise Chaining & Catch Recovery',
    slug: 'predict-output-promise-catch-recovery',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['JavaScript', 'Promises', 'Async', 'Advanced', 'Predict-Output'],
    description: `Predict what is printed when this Promise pipeline executes:

\`\`\`javascript
Promise.resolve(5)
  .then((x) => x * 2)
  .then((x) => {
    throw new Error("Boom");
  })
  .catch(() => 100)
  .then((x) => console.log("Final:", x));
\`\`\`

### Concept
1. \`Promise.resolve(5)\` resolves to \`5\`.
2. First \`.then\`: \`5 * 2 = 10\`.
3. Second \`.then\`: throws error \`"Boom"\`.
4. \`.catch()\`: catches the error and returns fallback value \`100\`.
5. Third \`.then\`: receives \`100\` and logs \`"Final: 100"\`.

### Output Format
Print the exact string:
\`Final: 100\``,
    constraints: ['Standard Promises/A+ resolution.'],
    examples: [
      { input: 'run', output: 'Final: 100', explanation: 'Catch block recovers error with 100.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `Promise.resolve(5)
    .then((x) => x * 2)
    .then((x) => {
        throw new Error("Boom");
    })
    .catch(() => 100)
    .then((x) => console.log("Final:", x));`,
      python: `print("Final: 100")`,
      cpp: `#include <iostream>
using namespace std;
int main() { cout << "Final: 100" << endl; return 0; }`
    },
    testCases: [
      { id: 'tc-q13-1', input: 'run', expectedOutput: 'Final: 100', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("Final: 100");`,
      python: `print("Final: 100")`
    }
  },

  // Q14. JavaScript Event Loop (Call Stack, Microtask, Macrotask)
  {
    title: 'Predict Output: JavaScript Event Loop Execution Order',
    slug: 'predict-output-event-loop-order',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['JavaScript', 'Event-Loop', 'Async', 'Advanced', 'Predict-Output'],
    description: `Predict the exact sequence in which letters \`A\`, \`B\`, \`C\`, \`D\` are printed:

\`\`\`javascript
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
\`\`\`

### Concept
1. Synchronous call stack runs first: logs \`"A"\`, then schedules \`setTimeout\` in macrotask queue, schedules \`Promise.then\` in microtask queue, then logs \`"D"\`.
2. Microtask queue drains before macrotasks: logs \`"C"\`.
3. Macrotask queue runs: logs \`"B"\`.
Final sequence: \`A\`, \`D\`, \`C\`, \`B\`.

### Output Format
Print the four letters on separate lines:
\`A\`
\`D\`
\`C\`
\`B\``,
    constraints: ['Standard JavaScript Event Loop priority.'],
    examples: [
      { input: 'run', output: 'A\\nD\\nC\\nB', explanation: 'Sync -> Microtask -> Macrotask.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");`,
      python: `print("A")
print("D")
print("C")
print("B")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "A" << endl << "D" << endl << "C" << endl << "B" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q14-1', input: 'run', expectedOutput: 'A\nD\nC\nB', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("A");\nconsole.log("D");\nconsole.log("C");\nconsole.log("B");`,
      python: `print("A")\nprint("D")\nprint("C")\nprint("B")`
    }
  },

  // Q15. Async/Await & Event Loop Interleaving
  {
    title: 'Predict Output: Async/Await Microtask Interleaving',
    slug: 'predict-output-async-await-interleaving',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['JavaScript', 'Async-Await', 'Event-Loop', 'Advanced', 'Predict-Output'],
    description: `Predict the exact sequence in which numbers \`0\`, \`1\`, \`2\`, \`3\` are printed:

\`\`\`javascript
async function run() {
  console.log("1");
  await Promise.resolve();
  console.log("2");
}
console.log("0");
run();
console.log("3");
\`\`\`

### Concept
1. \`console.log("0")\` logs \`"0"\`.
2. \`run()\` executes synchronously up to the \`await\`: logs \`"1"\`.
3. \`await Promise.resolve()\` yields control and queues the remainder of \`run()\` into the microtask queue.
4. Synchronous code continues: \`console.log("3")\` logs \`"3"\`.
5. Call stack empties, microtask runs: logs \`"2"\`.
Sequence: \`0\`, \`1\`, \`3\`, \`2\`.

### Output Format
Print the four numbers on separate lines:
\`0\`
\`1\`
\`3\`
\`2\``,
    constraints: ['Standard ES2017 async/await semantics.'],
    examples: [
      { input: 'run', output: '0\\n1\\n3\\n2', explanation: 'Interleaving of async/await microtasks.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'predictOutput',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `async function run() {
    console.log("1");
    await Promise.resolve();
    console.log("2");
}
console.log("0");
run();
console.log("3");`,
      python: `print("0")
print("1")
print("3")
print("2")`,
      cpp: `#include <iostream>
using namespace std;
int main() {
    cout << "0" << endl << "1" << endl << "3" << endl << "2" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-q15-1', input: 'run', expectedOutput: '0\n1\n3\n2', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `console.log("0");\nconsole.log("1");\nconsole.log("3");\nconsole.log("2");`,
      python: `print("0")\nprint("1")\nprint("3")\nprint("2")`
    }
  }
];
