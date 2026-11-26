import { ProblemSeedDefinition } from './round3-logic.data.js';

export const round2DebugProblems: ProblemSeedDefinition[] = [
  // D1. Syntax Error (Unclosed Parenthesis)
  {
    title: 'Code Rescue: Syntax Error in Conditional',
    slug: 'code-rescue-syntax-unclosed-paren',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Syntax', 'Beginner', 'Debugging-Battle'],
    description: `A teammate wrote a function \`checkAge(age)\` to determine if a user is an \`"Adult"\` (age 18 or older) or a \`"Minor"\`. However, the code refuses to parse and crashes with a \`SyntaxError\`.

### Buggy Code Snippet
\`\`\`javascript
function checkAge(age) {
  if (age >= 18 {
    return "Adult";
  } else {
    return "Minor";
  }
}
\`\`\`

### Task
Locate the syntax error, repair the statement, and ensure all age verification test cases pass.

### Input Format
A single line containing an integer \`age\`.

### Output Format
Print \`Adult\` or \`Minor\`.`,
    constraints: ['0 <= age <= 150'],
    examples: [
      { input: '20', output: 'Adult', explanation: '20 >= 18 is true.' },
      { input: '15', output: 'Minor', explanation: '15 < 18 is true.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'checkAge',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'age', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the syntax error below
function checkAge(age) {
    if (age >= 18 {
        return "Adult";
    } else {
        return "Minor";
    }
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input.length > 0) {
    console.log(checkAge(parseInt(input, 10)));
}`,
      python: `import sys

def checkAge(age: int) -> str:
    return "Adult" if age >= 18 else "Minor"

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(checkAge(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

string checkAge(int age) {
    return (age >= 18) ? "Adult" : "Minor";
}

int main() {
    int age;
    if (cin >> age) cout << checkAge(age) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d1-1', input: '20', expectedOutput: 'Adult', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d1-2', input: '15', expectedOutput: 'Minor', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d1-3', input: '18', expectedOutput: 'Adult', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d1-4', input: '0', expectedOutput: 'Minor', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d1-5', input: '65', expectedOutput: 'Adult', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function checkAge(age) {
    if (age >= 18) {
        return "Adult";
    } else {
        return "Minor";
    }
}
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) console.log(checkAge(parseInt(input, 10)));`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print("Adult" if int(raw) >= 18 else "Minor")`
    }
  },

  // D2. Reference Error (Typo in Identifier)
  {
    title: 'Code Rescue: Typo in Variable Identifier',
    slug: 'code-rescue-reference-typo',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Variables', 'Beginner', 'Debugging-Battle'],
    description: `A billing function calculates total cost by summing \`price\` and \`tax\`. However, when executed, it crashes with \`ReferenceError: totalAmont is not defined\`.

### Buggy Code Snippet
\`\`\`javascript
function calculateTotal(price, tax) {
  let totalAmount = price + tax;
  return totalAmont;
}
\`\`\`

### Task
Fix the variable identifier misspelling and verify that the function returns the correct numeric sum.

### Input Format
Two space-separated integers: \`price\` and \`tax\`.

### Output Format
Print the total bill amount.`,
    constraints: ['0 <= price, tax <= 10^7'],
    examples: [
      { input: '100 18', output: '118', explanation: '100 + 18 = 118.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'calculateTotal',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'price', type: 'int' }, { name: 'tax', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the ReferenceError typo below
function calculateTotal(price, tax) {
    let totalAmount = price + tax;
    return totalAmont;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) {
    console.log(calculateTotal(parseInt(input[0], 10), parseInt(input[1], 10)));
}`,
      python: `import sys

def calculateTotal(price: int, tax: int) -> int:
    return price + tax

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if len(tokens) >= 2:
        print(calculateTotal(int(tokens[0]), int(tokens[1])))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int price, tax;
    if (cin >> price >> tax) cout << price + tax << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d2-1', input: '100 18', expectedOutput: '118', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d2-2', input: '250 50', expectedOutput: '300', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d2-3', input: '0 0', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d2-4', input: '9999 1', expectedOutput: '10000', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function calculateTotal(price, tax) {
    let totalAmount = price + tax;
    return totalAmount;
}
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) console.log(calculateTotal(parseInt(input[0], 10), parseInt(input[1], 10)));`,
      python: `import sys
t = sys.stdin.read().split()
if len(t) >= 2: print(int(t[0]) + int(t[1]))`
    }
  },

  // D3. Incorrect Logical Operator (OR instead of AND)
  {
    title: 'Code Rescue: Logical Operator Range Validation',
    slug: 'code-rescue-logical-range-check',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Conditionals', 'Logic-Error', 'Beginner', 'Debugging-Battle'],
    description: `An exam score is only valid if it falls inclusively between \`0\` and \`100\`. However, the current function marks scores like \`150\` as \`"Valid"\`!

### Buggy Code Snippet
\`\`\`javascript
function isValidScore(score) {
  if (score >= 0 || score <= 100) {
    return "Valid";
  }
  return "Invalid";
}
\`\`\`

### Task
Fix the boolean conditional operator so only numbers in the closed interval $[0, 100]$ return \`"Valid"\`.

### Input Format
A single line containing integer \`score\`.

### Output Format
Print \`Valid\` or \`Invalid\`.`,
    constraints: ['-10^4 <= score <= 10^4'],
    examples: [
      { input: '150', output: 'Invalid', explanation: '150 > 100 so it is invalid.' },
      { input: '85', output: 'Valid', explanation: '85 is between 0 and 100.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'isValidScore',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'score', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the logical condition below
function isValidScore(score) {
    if (score >= 0 || score <= 100) {
        return "Valid";
    }
    return "Invalid";
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input.length > 0) console.log(isValidScore(parseInt(input, 10)));`,
      python: `import sys

def isValidScore(score: int) -> str:
    return "Valid" if 0 <= score <= 100 else "Invalid"

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw: print(isValidScore(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

string isValidScore(int score) {
    return (score >= 0 && score <= 100) ? "Valid" : "Invalid";
}

int main() {
    int s;
    if (cin >> s) cout << isValidScore(s) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d3-1', input: '150', expectedOutput: 'Invalid', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d3-2', input: '85', expectedOutput: 'Valid', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d3-3', input: '-5', expectedOutput: 'Invalid', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d3-4', input: '0', expectedOutput: 'Valid', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d3-5', input: '100', expectedOutput: 'Valid', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function isValidScore(score) {
    if (score >= 0 && score <= 100) return "Valid";
    return "Invalid";
}
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) console.log(isValidScore(parseInt(input, 10)));`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print("Valid" if 0 <= int(raw) <= 100 else "Invalid")`
    }
  },

  // D4. Off-by-One Loop Boundary Error
  {
    title: 'Code Rescue: Off-by-One Array Indexing',
    slug: 'code-rescue-off-by-one-loop',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Arrays', 'Loops', 'Beginner', 'Debugging-Battle'],
    description: `A function is designed to compute the sum of numbers in an array. However, it returns \`NaN\` instead of the actual total because the loop overshoots the array bounds!

### Buggy Code Snippet
\`\`\`javascript
function sumArray(nums) {
  let sum = 0;
  for (let i = 0; i <= nums.length; i++) {
    sum += nums[i];
  }
  return sum;
}
\`\`\`

### Task
Repair the loop boundary condition so it does not access \`nums[nums.length]\` (which evaluates to \`undefined\`).

### Input Format
First line: \`n\` (length of array).
Second line: \`n\` space-separated integers.

### Output Format
Print the integer sum.`,
    constraints: ['1 <= n <= 10^5', '-10^6 <= nums[i] <= 10^6'],
    examples: [
      { input: '3\\n10 20 30', output: '60', explanation: '10 + 20 + 30 = 60.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'sumArray',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the off-by-one loop boundary
function sumArray(nums) {
    let sum = 0;
    for (let i = 0; i <= nums.length; i++) {
        sum += nums[i];
    }
    return sum;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    console.log(sumArray(nums));
}`,
      python: `import sys

def sumArray(nums: list[int]) -> int:
    return sum(nums)

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        nums = [int(x) for x in tokens[1:n+1]]
        print(sumArray(nums))`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        long long sum = 0;
        for (int i = 0; i < n; i++) {
            long long x; cin >> x;
            sum += x;
        }
        cout << sum << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d4-1', input: '3\n10 20 30', expectedOutput: '60', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d4-2', input: '4\n5 5 5 5', expectedOutput: '20', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d4-3', input: '1\n0', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d4-4', input: '3\n-10 -20 30', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    let sum = 0;
    for (let i = 0; i < nums.length; i++) sum += nums[i];
    console.log(sum);
}`,
      python: `import sys
t = sys.stdin.read().split()
if t:
    n = int(t[0])
    nums = [int(x) for x in t[1:n+1]]
    print(sum(nums))`
    }
  },

  // D5. Infinite Loop (i++ instead of i--)
  {
    title: 'Code Rescue: Infinite Countdown Loop',
    slug: 'code-rescue-infinite-loop-countdown',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Loops', 'Intermediate', 'Debugging-Battle'],
    description: `A function is designed to generate a countdown array from \`n\` down to \`1\`. However, running it causes an infinite loop and freezes execution!

### Buggy Code Snippet
\`\`\`javascript
function countdown(n) {
  let result = [];
  for (let i = n; i > 0; i++) {
    result.push(i);
  }
  return result;
}
\`\`\`

### Task
Identify why the loop never terminates and fix the iteration step.

### Input Format
A single integer \`n\`.

### Output Format
Space-separated countdown numbers from \`n\` down to \`1\`.`,
    constraints: ['1 <= n <= 10^4'],
    examples: [
      { input: '3', output: '3 2 1', explanation: 'Countdown from 3 is [3, 2, 1].' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'countdown',
      className: 'Solution',
      returnType: 'list<int>',
      parameters: [{ name: 'n', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the infinite loop direction
function countdown(n) {
    let result = [];
    for (let i = n; i > 0; i++) {
        result.push(i);
    }
    return result;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const n = parseInt(input, 10);
    console.log(countdown(n).join(' '));
}`,
      python: `import sys

def countdown(n: int) -> list[int]:
    return list(range(n, 0, -1))

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(' '.join(map(str, countdown(int(raw)))))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        for (int i = n; i >= 1; i--) {
            if (i < n) cout << " ";
            cout << i;
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d5-1', input: '3', expectedOutput: '3 2 1', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d5-2', input: '5', expectedOutput: '5 4 3 2 1', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d5-3', input: '1', expectedOutput: '1', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const n = parseInt(input, 10);
    const result = [];
    for (let i = n; i > 0; i--) result.push(i);
    console.log(result.join(' '));
}`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print(' '.join(str(i) for i in range(int(raw), 0, -1)))`
    }
  },

  // D6. Early Return Bug in Loop
  {
    title: 'Code Rescue: Early Return in Array Search',
    slug: 'code-rescue-early-return-bug',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Arrays', 'Control-Flow', 'Intermediate', 'Debugging-Battle'],
    description: `A function checks whether an array contains at least one even integer. On input \`[1, 3, 4, 5]\`, it mistakenly returns \`false\` because it returns early on the very first odd element!

### Buggy Code Snippet
\`\`\`javascript
function containsEven(nums) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] % 2 === 0) {
      return true;
    } else {
      return false;
    }
  }
}
\`\`\`

### Task
Fix the loop control flow so that the function only returns \`false\` after inspecting all elements.

### Input Format
First line: \`n\` (length of array).
Second line: \`n\` space-separated integers.

### Output Format
Print \`true\` or \`false\`.`,
    constraints: ['1 <= n <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    examples: [
      { input: '4\\n1 3 4 5', output: 'true', explanation: '4 is even.' },
      { input: '3\\n1 3 5', output: 'false', explanation: 'No even numbers.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'containsEven',
      className: 'Solution',
      returnType: 'boolean',
      parameters: [{ name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the early return error
function containsEven(nums) {
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] % 2 === 0) {
            return true;
        } else {
            return false;
        }
    }
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    console.log(containsEven(nums) ? 'true' : 'false');
}`,
      python: `import sys

def containsEven(nums: list[int]) -> bool:
    return any(x % 2 == 0 for x in nums)

if __name__ == '__main__':
    t = sys.stdin.read().split()
    if t:
        n = int(t[0])
        nums = [int(x) for x in t[1:n+1]]
        print('true' if containsEven(nums) else 'false')`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        bool hasEven = false;
        for (int i = 0; i < n; i++) {
            long long x; cin >> x;
            if (x % 2 == 0) hasEven = true;
        }
        cout << (hasEven ? "true" : "false") << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d6-1', input: '4\n1 3 4 5', expectedOutput: 'true', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d6-2', input: '3\n1 3 5', expectedOutput: 'false', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d6-3', input: '1\n2', expectedOutput: 'true', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-d6-4', input: '5\n7 9 11 13 14', expectedOutput: 'true', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    let ok = false;
    for (let i = 0; i < nums.length; i++) {
        if (nums[i] % 2 === 0) { ok = true; break; }
    }
    console.log(ok ? 'true' : 'false');
}`,
      python: `import sys
t = sys.stdin.read().split()
if t:
    n = int(t[0])
    nums = [int(x) for x in t[1:n+1]]
    print('true' if any(x % 2 == 0 for x in nums) else 'false')`
    }
  },

  // D7. Variable Scope Shadowing
  {
    title: 'Code Rescue: Variable Scope Shadowing',
    slug: 'code-rescue-scope-shadowing',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Scope', 'Intermediate', 'Debugging-Battle'],
    description: `A function calculates discounted prices for a catalog. Each item gets a default discount of \`10\`, but items priced over \`500\` should receive a discount of \`20\`. Due to variable shadowing with \`let\`, the higher discount is trapped inside the \`if\` block!

### Buggy Code Snippet
\`\`\`javascript
function getDiscountedPrices(prices) {
  let result = [];
  for (let i = 0; i < prices.length; i++) {
    let discount = 10;
    if (prices[i] > 500) {
      let discount = 20; // SHADOWED!
    }
    result.push(prices[i] - discount);
  }
  return result;
}
\`\`\`

### Task
Fix the variable scoping error so that \`prices[i] > 500\` correctly applies the \`20\` discount.

### Input Format
First line: \`n\` (number of prices).
Second line: \`n\` space-separated integers.

### Output Format
Space-separated discounted prices.`,
    constraints: ['1 <= n <= 10^5', 'prices[i] >= 0'],
    examples: [
      { input: '2\\n200 600', output: '190 580', explanation: '200 gets 10 discount (190), 600 gets 20 discount (580).' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'getDiscountedPrices',
      className: 'Solution',
      returnType: 'list<int>',
      parameters: [{ name: 'prices', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the variable shadowing bug
function getDiscountedPrices(prices) {
    let result = [];
    for (let i = 0; i < prices.length; i++) {
        let discount = 10;
        if (prices[i] > 500) {
            let discount = 20;
        }
        result.push(prices[i] - discount);
    }
    return result;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const prices = input.slice(1, n + 1).map(Number);
    console.log(getDiscountedPrices(prices).join(' '));
}`,
      python: `import sys

def getDiscountedPrices(prices: list[int]) -> list[int]:
    return [p - (20 if p > 500 else 10) for p in prices]

if __name__ == '__main__':
    t = sys.stdin.read().split()
    if t:
        n = int(t[0])
        prices = [int(x) for x in t[1:n+1]]
        print(' '.join(map(str, getDiscountedPrices(prices))))`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        for (int i = 0; i < n; i++) {
            int p; cin >> p;
            int discount = (p > 500) ? 20 : 10;
            if (i > 0) cout << " ";
            cout << (p - discount);
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d7-1', input: '2\n200 600', expectedOutput: '190 580', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d7-2', input: '3\n100 700 300', expectedOutput: '90 680 290', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d7-3', input: '1\n500', expectedOutput: '490', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const prices = input.slice(1, n + 1).map(Number);
    const res = prices.map(p => p - (p > 500 ? 20 : 10));
    console.log(res.join(' '));
}`,
      python: `import sys
t = sys.stdin.read().split()
if t:
    n = int(t[0])
    prices = [int(x) for x in t[1:n+1]]
    print(' '.join(str(p - (20 if p > 500 else 10)) for p in prices))`
    }
  },

  // D8. Implicit Type Conversion / Concatenation
  {
    title: 'Code Rescue: String Coercion in Addition',
    slug: 'code-rescue-type-coercion-sum',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Types', 'Beginner', 'Debugging-Battle'],
    description: `A function receives user input marks from form fields as strings (e.g. \`"35"\` and \`"15"\`). Instead of adding them numerically to produce \`50\`, JavaScript performs string concatenation and returns \`"3515"\`!

### Buggy Code Snippet
\`\`\`javascript
function addMarks(theoryStr, practicalStr) {
  let total = theoryStr + practicalStr;
  return total;
}
\`\`\`

### Task
Convert string inputs to numbers before adding them.

### Input Format
Two space-separated string tokens: \`theoryStr\` and \`practicalStr\`.

### Output Format
Print the numeric sum.`,
    constraints: ['Inputs are non-negative numeric strings.'],
    examples: [
      { input: '35 15', output: '50', explanation: '35 + 15 = 50.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'addMarks',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'theoryStr', type: 'string' }, { name: 'practicalStr', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the string coercion bug
function addMarks(theoryStr, practicalStr) {
    let total = theoryStr + practicalStr;
    return total;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) {
    console.log(addMarks(input[0], input[1]));
}`,
      python: `import sys

def addMarks(a: str, b: str) -> int:
    return int(a) + int(b)

if __name__ == '__main__':
    t = sys.stdin.read().split()
    if len(t) >= 2:
        print(addMarks(t[0], t[1]))`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string a, b;
    if (cin >> a >> b) {
        cout << (stoi(a) + stoi(b)) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d8-1', input: '35 15', expectedOutput: '50', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d8-2', input: '40 60', expectedOutput: '100', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d8-3', input: '0 0', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 2) console.log(Number(input[0]) + Number(input[1]));`,
      python: `import sys
t = sys.stdin.read().split()
if len(t) >= 2: print(int(t[0]) + int(t[1]))`
    }
  },

  // D9. Nested Loop Boundary Bug
  {
    title: 'Code Rescue: Nested Loop Pair Generation',
    slug: 'code-rescue-nested-loop-pairs',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Nested-Loops', 'Intermediate', 'Debugging-Battle'],
    description: `A function is designed to generate pairs \`"i-j"\` for all $1 \\le j \\le i \\le n$.
However, for \`n = 3\`, it outputs \`["2-1", "3-1", "3-2"]\`, missing all diagonal pairs \`"1-1"\`, \`"2-2"\`, and \`"3-3"\`!

### Buggy Code Snippet
\`\`\`javascript
function printPairs(n) {
  let pairs = [];
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j < i; j++) { // MISSING EQUAL!
      pairs.push(i + "-" + j);
    }
  }
  return pairs;
}
\`\`\`

### Task
Correct the inner loop boundary condition so all valid pairs are included.

### Input Format
A single integer \`n\`.

### Output Format
Space-separated pairs formatted as \`i-j\`.`,
    constraints: ['1 <= n <= 100'],
    examples: [
      { input: '3', output: '1-1 2-1 2-2 3-1 3-2 3-3', explanation: 'All pairs with 1 <= j <= i <= 3.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'printPairs',
      className: 'Solution',
      returnType: 'list<string>',
      parameters: [{ name: 'n', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the inner loop condition
function printPairs(n) {
    let pairs = [];
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j < i; j++) {
            pairs.push(i + "-" + j);
        }
    }
    return pairs;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    console.log(printPairs(parseInt(input, 10)).join(' '));
}`,
      python: `import sys

def printPairs(n: int) -> list[str]:
    return [f"{i}-{j}" for i in range(1, n + 1) for j in range(1, i + 1)]

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(' '.join(printPairs(int(raw))))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        bool first = true;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                if (!first) cout << " ";
                cout << i << "-" << j;
                first = false;
            }
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d9-1', input: '3', expectedOutput: '1-1 2-1 2-2 3-1 3-2 3-3', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d9-2', input: '2', expectedOutput: '1-1 2-1 2-2', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d9-3', input: '1', expectedOutput: '1-1', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const raw = fs.readFileSync(0, 'utf-8').trim();
if (raw) {
    const n = parseInt(raw, 10);
    const pairs = [];
    for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= i; j++) pairs.push(\`\${i}-\${j}\`);
    }
    console.log(pairs.join(' '));
}`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw:
    n = int(raw)
    print(' '.join(f"{i}-{j}" for i in range(1, n + 1) for j in range(1, i + 1)))`
    }
  },

  // D10. Object Mutation Leak
  {
    title: 'Code Rescue: Unintended Object Mutation',
    slug: 'code-rescue-object-mutation-leak',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Objects', 'Immutability', 'Intermediate', 'Debugging-Battle'],
    description: `A function is designed to return an updated student record with bonus score points without altering the original student object.
However, it copies by reference (\`let updated = student\`), unintentionally mutating the original object!

### Buggy Code Snippet
\`\`\`javascript
function addBonus(student, bonus) {
  let updated = student; // BY REFERENCE!
  updated.score += bonus;
  return updated;
}
\`\`\`

### Task
Repair the function by creating a shallow copy (e.g. \`{ ...student }\`) so the original object remains untouched.

### Input Format
First line: \`name\`, \`originalScore\`, and \`bonus\` space-separated.

### Output Format
Print \`original: <score>, updated: <score>\`.`,
    constraints: ['0 <= score, bonus <= 1000'],
    examples: [
      { input: 'Riya 80 10', output: 'original: 80, updated: 90', explanation: 'Original stays 80, updated receives 90.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'addBonus',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'name', type: 'string' }, { name: 'score', type: 'int' }, { name: 'bonus', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Prevent mutating original student object
function addBonus(student, bonus) {
    let updated = student;
    updated.score += bonus;
    return updated;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 3) {
    const student = { name: input[0], score: parseInt(input[1], 10) };
    const bonus = parseInt(input[2], 10);
    const withBonus = addBonus(student, bonus);
    console.log(\`original: \${student.score}, updated: \${withBonus.score}\`);
}`,
      python: `import sys

def addBonus(name: str, score: int, bonus: int) -> str:
    return f"original: {score}, updated: {score + bonus}"

if __name__ == '__main__':
    t = sys.stdin.read().split()
    if len(t) >= 3:
        print(addBonus(t[0], int(t[1]), int(t[2])))`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    int score, bonus;
    if (cin >> name >> score >> bonus) {
        cout << "original: " << score << ", updated: " << (score + bonus) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d10-1', input: 'Riya 80 10', expectedOutput: 'original: 80, updated: 90', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d10-2', input: 'Aman 50 25', expectedOutput: 'original: 50, updated: 75', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d10-3', input: 'Zero 0 0', expectedOutput: 'original: 0, updated: 0', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function addBonus(student, bonus) {
    return { ...student, score: student.score + bonus };
}
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 3) {
    const student = { name: input[0], score: parseInt(input[1], 10) };
    const bonus = parseInt(input[2], 10);
    const withBonus = addBonus(student, bonus);
    console.log(\`original: \${student.score}, updated: \${withBonus.score}\`);
}`,
      python: `import sys
t = sys.stdin.read().split()
if len(t) >= 3:
    print(f"original: {int(t[1])}, updated: {int(t[1]) + int(t[2])}")`
    }
  },

  // D11. forEach Returns undefined
  {
    title: 'Code Rescue: forEach Returning Undefined',
    slug: 'code-rescue-foreach-return-undefined',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Debugging', 'Higher-Order-Functions', 'Beginner', 'Debugging-Battle'],
    description: `A function is intended to double every number in an array and return the transformed array. However, it mistakenly assigns the return value of \`forEach()\` (which always returns \`undefined\`)!

### Buggy Code Snippet
\`\`\`javascript
function doubleArray(nums) {
  let doubled = nums.forEach((n) => {
    return n * 2;
  });
  return doubled;
}
\`\`\`

### Task
Replace \`forEach()\` with \`map()\` so a new transformed array is produced.

### Input Format
First line: \`n\` (length of array).
Second line: \`n\` space-separated integers.

### Output Format
Space-separated doubled integers.`,
    constraints: ['1 <= n <= 10^5'],
    examples: [
      { input: '3\\n1 2 3', output: '2 4 6', explanation: 'Each element doubled.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'doubleArray',
      className: 'Solution',
      returnType: 'list<int>',
      parameters: [{ name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: forEach returns undefined!
function doubleArray(nums) {
    let doubled = nums.forEach((n) => {
        return n * 2;
    });
    return doubled;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    const res = doubleArray(nums);
    console.log(Array.isArray(res) ? res.join(' ') : 'undefined');
}`,
      python: `import sys

def doubleArray(nums: list[int]) -> list[int]:
    return [x * 2 for x in nums]

if __name__ == '__main__':
    t = sys.stdin.read().split()
    if t:
        n = int(t[0])
        nums = [int(x) for x in t[1:n+1]]
        print(' '.join(map(str, doubleArray(nums))))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        for (int i = 0; i < n; i++) {
            long long x; cin >> x;
            if (i > 0) cout << " ";
            cout << (x * 2);
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d11-1', input: '3\n1 2 3', expectedOutput: '2 4 6', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d11-2', input: '3\n0 5 10', expectedOutput: '0 10 20', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d11-3', input: '1\n7', expectedOutput: '14', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const nums = input.slice(1, n + 1).map(Number);
    console.log(nums.map(x => x * 2).join(' '));
}`,
      python: `import sys
t = sys.stdin.read().split()
if t:
    n = int(t[0])
    print(' '.join(str(int(x) * 2) for x in t[1:n+1]))`
    }
  },

  // D12. Closure in Loop (var vs let)
  {
    title: 'Code Rescue: Closure Loop Variable Binding',
    slug: 'code-rescue-closure-loop-binding',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Closures', 'Scope', 'Advanced', 'Debugging-Battle'],
    description: `A function registers callback functions in a loop to return numbered task labels \`"Task 1"\`, \`"Task 2"\`, etc.
Because it uses \`var i\`, all callbacks share the same function-scoped variable, resulting in \`"Task 4"\` printed for every item!

### Buggy Code Snippet
\`\`\`javascript
function createTimers(count) {
  const callbacks = [];
  for (var i = 1; i <= count; i++) {
    callbacks.push(function () {
      return "Task " + i;
    });
  }
  return callbacks.map((fn) => fn());
}
\`\`\`

### Task
Fix the loop variable declaration so each closure binds its own distinct iteration value.

### Input Format
A single integer \`count\`.

### Output Format
Comma-separated list of generated task labels.`,
    constraints: ['1 <= count <= 50'],
    examples: [
      { input: '3', output: 'Task 1, Task 2, Task 3', explanation: 'Each callback returns its respective iteration task.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'createTimers',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'count', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the closure loop variable binding
function createTimers(count) {
    const callbacks = [];
    for (var i = 1; i <= count; i++) {
        callbacks.push(function () {
            return "Task " + i;
        });
    }
    return callbacks.map((fn) => fn());
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const count = parseInt(input, 10);
    console.log(createTimers(count).join(', '));
}`,
      python: `import sys

def createTimers(count: int) -> list[str]:
    return [f"Task {i}" for i in range(1, count + 1)]

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(', '.join(createTimers(int(raw))))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int count;
    if (cin >> count) {
        for (int i = 1; i <= count; i++) {
            if (i > 1) cout << ", ";
            cout << "Task " << i;
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d12-1', input: '3', expectedOutput: 'Task 1, Task 2, Task 3', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d12-2', input: '1', expectedOutput: 'Task 1', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-d12-3', input: '5', expectedOutput: 'Task 1, Task 2, Task 3, Task 4, Task 5', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    const count = parseInt(input, 10);
    const callbacks = [];
    for (let i = 1; i <= count; i++) {
        callbacks.push(() => "Task " + i);
    }
    console.log(callbacks.map(fn => fn()).join(', '));
}`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print(', '.join(f"Task {i}" for i in range(1, int(raw) + 1)))`
    }
  },

  // D13. Async Function Missing await
  {
    title: 'Code Rescue: Missing Await in Async Flow',
    slug: 'code-rescue-async-missing-await',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Async-Await', 'Promises', 'Advanced', 'Debugging-Battle'],
    description: `A function fetches an asynchronous user score and adds a bonus of \`5\` points to display the final result.
Because \`await\` was omitted, the score Promise is converted to a string, producing \`"Score: [object Promise]5"\`!

### Buggy Code Snippet
\`\`\`javascript
async function fetchUserScore(base) {
  return base;
}

async function showResult(base) {
  const score = fetchUserScore(base); // MISSING AWAIT!
  console.log("Score:", score + 5);
}
\`\`\`

### Task
Add the missing \`await\` operator so the numeric score is resolved before addition.

### Input Format
A single integer \`baseScore\`.

### Output Format
Print \`Score: <total>\`.`,
    constraints: ['0 <= baseScore <= 10^5'],
    examples: [
      { input: '95', output: 'Score: 100', explanation: '95 + 5 = 100.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'showResult',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'base', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

async function fetchUserScore(base) {
    return base;
}

// BUGGY CODE: Fix the missing await below
async function showResult(base) {
    const score = fetchUserScore(base);
    console.log("Score:", score + 5);
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    showResult(parseInt(input, 10));
}`,
      python: `import sys

def showResult(base: int) -> str:
    return f"Score: {base + 5}"

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(showResult(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int b;
    if (cin >> b) cout << "Score: " << (b + 5) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d13-1', input: '95', expectedOutput: 'Score: 100', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d13-2', input: '0', expectedOutput: 'Score: 5', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-d13-3', input: '995', expectedOutput: 'Score: 1000', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
async function fetchUserScore(base) { return base; }
async function showResult(base) {
    const score = await fetchUserScore(base);
    console.log("Score:", score + 5);
}
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) showResult(parseInt(input, 10));`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print(f"Score: {int(raw) + 5}")`
    }
  },

  // D14. Promise Chain Missing Return
  {
    title: 'Code Rescue: Missing Return in Promise Chain',
    slug: 'code-rescue-promise-missing-return',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Debugging', 'Promises', 'Advanced', 'Debugging-Battle'],
    description: `A function uses a Promise chain to double a number and then add \`10\` to it.
Because the first \`.then()\` uses curly braces without a \`return\` statement, it resolves to \`undefined\`, causing the subsequent addition to produce \`NaN\`!

### Buggy Code Snippet
\`\`\`javascript
function getDoubleAsync(num) {
  return Promise.resolve(num)
    .then((n) => {
      n * 2; // MISSING RETURN!
    })
    .then((doubled) => doubled + 10);
}
\`\`\`

### Task
Add the missing \`return\` statement so the doubled value is piped to the next handler.

### Input Format
A single integer \`num\`.

### Output Format
Print the computed result.`,
    constraints: ['-10^4 <= num <= 10^4'],
    examples: [
      { input: '5', output: '20', explanation: '(5 * 2) + 10 = 20.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'getDoubleAsync',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'num', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Fix the missing return inside then()
function getDoubleAsync(num) {
    return Promise.resolve(num)
        .then((n) => {
            n * 2;
        })
        .then((doubled) => doubled + 10);
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) {
    getDoubleAsync(parseInt(input, 10)).then(res => console.log(res));
}`,
      python: `import sys

def getDoubleAsync(num: int) -> int:
    return (num * 2) + 10

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(getDoubleAsync(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    int n;
    if (cin >> n) cout << (n * 2 + 10) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d14-1', input: '5', expectedOutput: '20', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d14-2', input: '10', expectedOutput: '30', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d14-3', input: '0', expectedOutput: '10', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function getDoubleAsync(num) {
    return Promise.resolve(num)
        .then((n) => n * 2)
        .then((doubled) => doubled + 10);
}
const input = fs.readFileSync(0, 'utf-8').trim();
if (input) getDoubleAsync(parseInt(input, 10)).then(res => console.log(res));`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw: print(int(raw) * 2 + 10)`
    }
  },

  // D15. Event Loop Timing / Callback Error
  {
    title: 'Code Rescue: Async Callback Timing in Event Loop',
    slug: 'code-rescue-async-callback-timing',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'HARD',
    tags: ['Debugging', 'Event-Loop', 'Callbacks', 'Advanced', 'Debugging-Battle'],
    description: `A function is designed to load data asynchronously and deliver the updated result (\`"Loaded"\`) via a callback function.
However, because \`callback(data)\` is called outside and before the \`setTimeout\` completes, it always delivers the initial state \`"Empty"\`!

### Buggy Code Snippet
\`\`\`javascript
function loadData(callback) {
  let data = "Empty";
  setTimeout(() => {
    data = "Loaded";
  }, 10);
  callback(data); // INVOKED PREMATURELY!
}
\`\`\`

### Task
Ensure the callback receives the resolved \`"Loaded"\` data once the async operation finishes.

### Input Format
A single trigger line (e.g. \`start\`).

### Output Format
Print \`Result: Loaded\`.`,
    constraints: ['Input is any trigger token.'],
    examples: [
      { input: 'start', output: 'Result: Loaded', explanation: 'Callback runs with Loaded status.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'loadData',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'trigger', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

// BUGGY CODE: Callback is invoked before setTimeout finishes!
function loadData(callback) {
    let data = "Empty";
    setTimeout(() => {
        data = "Loaded";
    }, 10);
    callback(data);
}

const input = fs.readFileSync(0, 'utf-8').trim();
loadData((result) => console.log("Result:", result));`,
      python: `import sys

def loadData() -> str:
    return "Result: Loaded"

if __name__ == '__main__':
    print(loadData())`,
      cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Result: Loaded" << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-d15-1', input: 'start', expectedOutput: 'Result: Loaded', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-d15-2', input: 'run', expectedOutput: 'Result: Loaded', isPublic: true, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `function loadData(callback) {
    let data = "Empty";
    setTimeout(() => {
        data = "Loaded";
        callback(data);
    }, 10);
}
loadData((result) => console.log("Result:", result));`,
      python: `print("Result: Loaded")`
    }
  }
];
