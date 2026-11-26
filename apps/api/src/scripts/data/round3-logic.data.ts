// Round 3: Algorithmic & Logic Challenges (10 Core + 1 Tie-Breaker)
export interface ProblemSeedDefinition {
  title: string;
  slug: string;
  status: 'PUBLISHED';
  version: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  timeLimitMs: number;
  memoryLimitKb: number;
  benchmarks: {
    targetTimeMs: number;
    pythonMultiplier: number;
    jsMultiplier: number;
    cppMultiplier: number;
    javaMultiplier: number;
  };
  functionSignature?: {
    functionName: string;
    className?: string;
    returnType: string;
    parameters: { name: string; type: string }[];
  };
  starterCode: {
    javascript: string;
    python: string;
    cpp: string;
  };
  testCases: {
    id: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    isEdgeCase: boolean;
    explanation?: string;
    weight: number;
  }[];
  referenceSolution: {
    javascript: string;
    python: string;
  };
}

export const round3LogicProblems: ProblemSeedDefinition[] = [
  // #1. Find the Largest of Three Numbers
  {
    title: 'Find the Largest of Three Numbers',
    slug: 'find-largest-of-three-numbers',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Conditionals', 'Math', 'Beginner', 'Logic-Challenge'],
    description: `Given three numbers \`a\`, \`b\`, and \`c\`, determine and return the largest of the three numbers without using built-in shortcuts like \`Math.max()\` or Python's \`max()\`.

Implement the decision-making logic using conditional branching.

### Input Format
A single line containing three space-separated integers: \`a\`, \`b\`, and \`c\`.

### Output Format
Print the largest number.`,
    constraints: [
      '-10^9 <= a, b, c <= 10^9',
      'Numbers can be negative, zero, positive, or equal.',
      'Do not use Math.max() or max() built-ins.'
    ],
    examples: [
      { input: '12 45 29', output: '45', explanation: '45 is greater than both 12 and 29.' },
      { input: '7 7 7', output: '7', explanation: 'All three numbers are equal.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'findLargestOfThree',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'a', type: 'int' }, { name: 'b', type: 'int' }, { name: 'c', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function findLargestOfThree(a, b, c) {
    // Write your conditional logic here without Math.max()
    let largest = a;
    return largest;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 3) {
    const a = parseInt(input[0], 10);
    const b = parseInt(input[1], 10);
    const c = parseInt(input[2], 10);
    console.log(findLargestOfThree(a, b, c));
}`,
      python: `import sys

def findLargestOfThree(a: int, b: int, c: int) -> int:
    # Write your conditional logic here without max()
    largest = a
    return largest

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if len(tokens) >= 3:
        a, b, c = map(int, tokens[:3])
        print(findLargestOfThree(a, b, c))`,
      cpp: `#include <iostream>
using namespace std;

int findLargestOfThree(int a, int b, int c) {
    int largest = a;
    if (b > largest) largest = b;
    if (c > largest) largest = c;
    return largest;
}

int main() {
    int a, b, c;
    if (cin >> a >> b >> c) {
        cout << findLargestOfThree(a, b, c) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-l3-1', input: '12 45 29', expectedOutput: '45', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-l3-2', input: '7 7 7', expectedOutput: '7', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-l3-3', input: '-10 -3 -25', expectedOutput: '-3', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-l3-4', input: '10 10 5', expectedOutput: '10', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-l3-5', input: '0 0 -1', expectedOutput: '0', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-l3-6', input: '100 200 150', expectedOutput: '200', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
function findLargestOfThree(a, b, c) {
    let largest = a;
    if (b > largest) largest = b;
    if (c > largest) largest = c;
    return largest;
}
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length >= 3) {
    console.log(findLargestOfThree(parseInt(input[0], 10), parseInt(input[1], 10), parseInt(input[2], 10)));
}`,
      python: `import sys
def findLargestOfThree(a: int, b: int, c: int) -> int:
    largest = a
    if b > largest: largest = b
    if c > largest: largest = c
    return largest
tokens = sys.stdin.read().split()
if len(tokens) >= 3:
    print(findLargestOfThree(int(tokens[0]), int(tokens[1]), int(tokens[2])))`
    }
  },

  // #2. Check Even or Odd
  {
    title: 'Check Even or Odd',
    slug: 'check-even-or-odd',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Math', 'Bit-Manipulation', 'Beginner', 'Logic-Challenge'],
    description: `Given an integer \`n\`, determine whether the number is **Even** or **Odd**.

Remember that negative integers and zero must be handled correctly:
- Even numbers are evenly divisible by 2 (\`n % 2 === 0\`).
- Odd numbers have a remainder of 1 or -1 when divided by 2.

### Input Format
A single integer \`n\`.

### Output Format
Print \`Even\` or \`Odd\`.`,
    constraints: [
      '-10^9 <= n <= 10^9',
      'n is an integer.'
    ],
    examples: [
      { input: '7', output: 'Odd', explanation: '7 is not divisible by 2.' },
      { input: '12', output: 'Even', explanation: '12 is divisible by 2.' },
      { input: '-4', output: 'Even', explanation: '-4 is evenly divisible by 2.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'checkEvenOrOdd',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'n', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function checkEvenOrOdd(n) {
    // Return "Even" or "Odd"
    return n % 2 === 0 ? "Even" : "Odd";
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input.length > 0) {
    const n = parseInt(input, 10);
    console.log(checkEvenOrOdd(n));
}`,
      python: `import sys

def checkEvenOrOdd(n: int) -> str:
    # Return "Even" or "Odd"
    return "Even" if n % 2 == 0 else "Odd"

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(checkEvenOrOdd(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

string checkEvenOrOdd(int n) {
    return (n % 2 == 0) ? "Even" : "Odd";
}

int main() {
    int n;
    if (cin >> n) cout << checkEvenOrOdd(n) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-eo-1', input: '7', expectedOutput: 'Odd', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-eo-2', input: '12', expectedOutput: 'Even', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-eo-3', input: '0', expectedOutput: 'Even', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-eo-4', input: '-3', expectedOutput: 'Odd', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-eo-5', input: '-4', expectedOutput: 'Even', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-eo-6', input: '1000001', expectedOutput: 'Odd', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim();
if (input.length > 0) {
    const n = parseInt(input, 10);
    console.log(n % 2 === 0 ? "Even" : "Odd");
}`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw:
    n = int(raw)
    print("Even" if n % 2 == 0 else "Odd")`
    }
  },

  // #3. Calculate Sum from 1 to N
  {
    title: 'Calculate Sum from 1 to N',
    slug: 'calculate-sum-1-to-n',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Loops', 'Math', 'Beginner', 'Logic-Challenge'],
    description: `Given an integer \`n\`, calculate the sum of all integers from \`1\` to \`n\` inclusive (\`1 + 2 + ... + n\`).

If \`n < 1\`, return \`0\`.

### Input Format
A single integer \`n\`.

### Output Format
Print the total sum.`,
    constraints: [
      '-10^6 <= n <= 10^6',
      'For n < 1, the result is 0.'
    ],
    examples: [
      { input: '5', output: '15', explanation: '1 + 2 + 3 + 4 + 5 = 15' },
      { input: '1', output: '1', explanation: 'Sum of 1 is 1.' },
      { input: '0', output: '0', explanation: 'n < 1 returns 0.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 10, pythonMultiplier: 3.0, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'sumFrom1ToN',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'n', type: 'int' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function sumFrom1ToN(n) {
    if (n < 1) return 0;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input.length > 0) {
    console.log(sumFrom1ToN(parseInt(input, 10)));
}`,
      python: `import sys

def sumFrom1ToN(n: int) -> int:
    if n < 1:
        return 0
    return (n * (n + 1)) // 2

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(sumFrom1ToN(int(raw)))`,
      cpp: `#include <iostream>
using namespace std;

long long sumFrom1ToN(int n) {
    if (n < 1) return 0;
    return (1LL * n * (n + 1)) / 2;
}

int main() {
    int n;
    if (cin >> n) cout << sumFrom1ToN(n) << endl;
    return 0;
}`
    },
    testCases: [
      { id: 'tc-s1n-1', input: '5', expectedOutput: '15', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-s1n-2', input: '1', expectedOutput: '1', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-s1n-3', input: '0', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-s1n-4', input: '-5', expectedOutput: '0', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-s1n-5', input: '10', expectedOutput: '55', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-s1n-6', input: '100', expectedOutput: '5050', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const raw = fs.readFileSync(0, 'utf-8').trim();
if (raw) {
    const n = parseInt(raw, 10);
    if (n < 1) console.log(0);
    else {
        let sum = 0;
        for (let i = 1; i <= n; i++) sum += i;
        console.log(sum);
    }
}`,
      python: `import sys
raw = sys.stdin.read().strip()
if raw:
    n = int(raw)
    print(0 if n < 1 else (n * (n + 1)) // 2)`
    }
  },

  // #4. Find the Second Largest Number in an Array
  {
    title: 'Find the Second Largest Number in an Array',
    slug: 'second-largest-in-array',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Arrays', 'Two-Pointers', 'Intermediate', 'Logic-Challenge'],
    description: `Given an array of integers \`arr\`, find and return the **second largest distinct element** in a single pass ($O(N)$ time) without sorting the array.

If the array has fewer than two distinct elements, return \`-1\`.

### Input Format
First line: \`n\` (length of array).
Second line: \`n\` space-separated integers.

### Output Format
Print the second largest distinct integer, or \`-1\` if none exists.`,
    constraints: [
      '1 <= n <= 10^5',
      '-10^9 <= arr[i] <= 10^9',
      'Must run in O(N) time and O(1) auxiliary space without sorting.'
    ],
    examples: [
      { input: '5\\n10 50 50 20 40', output: '40', explanation: 'Distinct elements are 10, 20, 40, 50. Second largest is 40.' },
      { input: '4\\n1 2 3 4', output: '3', explanation: 'Second largest element is 3.' },
      { input: '3\\n5 5 5', output: '-1', explanation: 'No distinct second largest exists.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'secondLargest',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function secondLargest(arr) {
    if (arr.length < 2) return -1;
    let first = -Infinity;
    let second = -Infinity;
    for (const num of arr) {
        if (num > first) {
            second = first;
            first = num;
        } else if (num > second && num < first) {
            second = num;
        }
    }
    return second === -Infinity ? -1 : second;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    console.log(secondLargest(arr));
}`,
      python: `import sys

def secondLargest(arr: list[int]) -> int:
    if len(arr) < 2:
        return -1
    first = second = -float('inf')
    for num in arr:
        if num > first:
            second = first
            first = num
        elif num > second and num < first:
            second = num
    return -1 if second == -float('inf') else int(second)

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        arr = [int(x) for x in tokens[1:n+1]]
        print(secondLargest(arr))`,
      cpp: `#include <iostream>
#include <vector>
#include <climits>
using namespace std;

long long secondLargest(const vector<long long>& arr) {
    if (arr.size() < 2) return -1;
    long long first = LLONG_MIN, second = LLONG_MIN;
    for (long long num : arr) {
        if (num > first) {
            second = first;
            first = num;
        } else if (num > second && num < first) {
            second = num;
        }
    }
    return second == LLONG_MIN ? -1 : second;
}

int main() {
    int n;
    if (cin >> n) {
        vector<long long> arr(n);
        for (int i = 0; i < n; i++) cin >> arr[i];
        cout << secondLargest(arr) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-sl-1', input: '5\n10 50 50 20 40', expectedOutput: '40', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-sl-2', input: '4\n1 2 3 4', expectedOutput: '3', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-sl-3', input: '3\n5 5 5', expectedOutput: '-1', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-sl-4', input: '3\n-10 -2 -5', expectedOutput: '-5', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-sl-5', input: '1\n9', expectedOutput: '-1', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-sl-6', input: '6\n100 20 300 40 300 50', expectedOutput: '100', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    let first = -Infinity, second = -Infinity;
    for (const num of arr) {
        if (num > first) {
            second = first;
            first = num;
        } else if (num > second && num < first) {
            second = num;
        }
    }
    console.log(second === -Infinity ? -1 : second);
}`,
      python: `import sys
tokens = sys.stdin.read().split()
if tokens:
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n+1]]
    first = second = -float('inf')
    for num in arr:
        if num > first:
            second = first
            first = num
        elif num > second and num < first:
            second = num
    print(-1 if second == -float('inf') else int(second))`
    }
  },

  // #5. Reverse a String Without Built-in reverse
  {
    title: 'Reverse a String Without reverse()',
    slug: 'reverse-string-no-builtin',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Strings', 'Two-Pointers', 'Beginner', 'Logic-Challenge'],
    description: `Given a string \`str\`, reverse the string without using built-in helper functions like \`Array.prototype.reverse()\` or Python's \`[::-1]\`.

Implement the reversal using an iterative pointer approach or string accumulation.

### Input Format
A single line containing string \`str\`.

### Output Format
Print the reversed string.`,
    constraints: [
      '0 <= str.length <= 10^5',
      'str may contain letters, digits, spaces, and punctuation.'
    ],
    examples: [
      { input: 'JavaScript', output: 'tpircSavaJ', explanation: 'Letters reversed in order.' },
      { input: 'hello', output: 'olleh', explanation: 'Reversed hello is olleh.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'reverseString',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 's', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function reverseString(str) {
    let reversed = '';
    for (let i = str.length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}

const input = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
console.log(reverseString(input));`,
      python: `import sys

def reverseString(s: str) -> str:
    res = []
    for i in range(len(s) - 1, -1, -1):
        res.append(s[i])
    return ''.join(res)

if __name__ == '__main__':
    raw = sys.stdin.read().rstrip('\\r\\n')
    print(reverseString(raw))`,
      cpp: `#include <iostream>
#include <string>
using namespace std;

string reverseString(string s) {
    int l = 0, r = (int)s.length() - 1;
    while (l < r) {
        swap(s[l++], s[r--]);
    }
    return s;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << reverseString(s) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-rs-1', input: 'JavaScript', expectedOutput: 'tpircSavaJ', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-rs-2', input: 'hello', expectedOutput: 'olleh', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-rs-3', input: 'a', expectedOutput: 'a', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-rs-4', input: 'racecar', expectedOutput: 'racecar', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-rs-5', input: 'hi 1!', expectedOutput: '!1 ih', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const raw = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
let rev = '';
for (let i = raw.length - 1; i >= 0; i--) rev += raw[i];
console.log(rev);`,
      python: `import sys
raw = sys.stdin.read().rstrip('\\r\\n')
res = []
for i in range(len(raw) - 1, -1, -1):
    res.append(raw[i])
print(''.join(res))`
    }
  },

  // #6. Find Duplicate Elements
  {
    title: 'Find Duplicate Elements',
    slug: 'find-duplicate-elements',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Arrays', 'Hash-Table', 'Intermediate', 'Logic-Challenge'],
    description: `Given an array \`arr\` of \`n\` integers, find and return all elements that appear more than once in the array.

Each duplicate element should appear in the output **only once** in order of its discovery.
If no duplicate exists, print \`None\`.

### Input Format
First line: \`n\` (length of array).
Second line: \`n\` space-separated integers.

### Output Format
Space-separated duplicate integers, or \`None\`.`,
    constraints: [
      '1 <= n <= 10^5',
      '-10^9 <= arr[i] <= 10^9',
      'Prefer O(N) time with Hash Set over nested O(N^2) loops.'
    ],
    examples: [
      { input: '7\\n1 2 3 2 4 1 5', output: '2 1', explanation: '2 and 1 appear more than once.' },
      { input: '4\\n1 2 3 4', output: 'None', explanation: 'All elements are unique.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'findDuplicates',
      className: 'Solution',
      returnType: 'list<int>',
      parameters: [{ name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function findDuplicates(arr) {
    const seen = new Set();
    const duplicates = new Set();
    for (const item of arr) {
        if (seen.has(item)) {
            duplicates.add(item);
        } else {
            seen.add(item);
        }
    }
    return Array.from(duplicates);
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    const dups = findDuplicates(arr);
    console.log(dups.length > 0 ? dups.join(' ') : 'None');
}`,
      python: `import sys

def findDuplicates(arr: list[int]) -> list[int]:
    seen = set()
    duplicates = []
    dup_set = set()
    for item in arr:
        if item in seen:
            if item not in dup_set:
                duplicates.append(item)
                dup_set.add(item)
        else:
            seen.add(item)
    return duplicates

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        arr = [int(x) for x in tokens[1:n+1]]
        dups = findDuplicates(arr)
        print(' '.join(map(str, dups)) if dups else 'None')`,
      cpp: `#include <iostream>
#include <vector>
#include <unordered_set>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        unordered_set<long long> seen, duplicates;
        vector<long long> dupOrder;
        for (int i = 0; i < n; i++) {
            long long x;
            cin >> x;
            if (seen.count(x)) {
                if (!duplicates.count(x)) {
                    duplicates.insert(x);
                    dupOrder.push_back(x);
                }
            } else {
                seen.insert(x);
            }
        }
        if (dupOrder.empty()) cout << "None" << endl;
        else {
            for (size_t i = 0; i < dupOrder.size(); i++) {
                if (i > 0) cout << " ";
                cout << dupOrder[i];
            }
            cout << endl;
        }
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-fd-1', input: '7\n1 2 3 2 4 1 5', expectedOutput: '2 1', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-fd-2', input: '4\n1 2 3 4', expectedOutput: 'None', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-fd-3', input: '3\n7 7 7', expectedOutput: '7', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-fd-4', input: '6\n5 3 4 3 5 6', expectedOutput: '3 5', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-fd-5', input: '2\n9 9', expectedOutput: '9', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n + 1).map(Number);
    const seen = new Set(), dups = new Set();
    for (const item of arr) {
        if (seen.has(item)) dups.add(item);
        else seen.add(item);
    }
    const res = Array.from(dups);
    console.log(res.length > 0 ? res.join(' ') : 'None');
}`,
      python: `import sys
tokens = sys.stdin.read().split()
if tokens:
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n+1]]
    seen = set()
    dups = []
    dup_set = set()
    for item in arr:
        if item in seen:
            if item not in dup_set:
                dups.append(item)
                dup_set.add(item)
        else:
            seen.add(item)
    print(' '.join(map(str, dups)) if dups else 'None')`
    }
  },

  // #7. Check Palindrome
  {
    title: 'Valid Palindrome String',
    slug: 'valid-palindrome-string',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Strings', 'Two-Pointers', 'Beginner', 'Logic-Challenge'],
    description: `Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

### Input Format
A single line containing string \`s\`.

### Output Format
Print \`true\` or \`false\`.`,
    constraints: [
      '1 <= s.length <= 2 * 10^5',
      's consists only of printable ASCII characters.'
    ],
    examples: [
      { input: 'Madam', output: 'true', explanation: 'madam reads same forward and backward.' },
      { input: 'A man, a plan, a canal: Panama', output: 'true', explanation: 'amanaplanacanalpanama is a palindrome.' },
      { input: 'Hello', output: 'false', explanation: 'hello is not a palindrome.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'isPalindrome',
      className: 'Solution',
      returnType: 'boolean',
      parameters: [{ name: 's', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function isPalindrome(str) {
    const clean = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    let left = 0;
    let right = clean.length - 1;
    while (left < right) {
        if (clean[left] !== clean[right]) return false;
        left++;
        right--;
    }
    return true;
}

const input = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
console.log(isPalindrome(input));`,
      python: `import sys

def isPalindrome(s: str) -> bool:
    clean = [ch.lower() for ch in s if ch.isalnum()]
    l, r = 0, len(clean) - 1
    while l < r:
        if clean[l] != clean[r]:
            return False
        l += 1
        r -= 1
    return True

if __name__ == '__main__':
    raw = sys.stdin.read().rstrip('\\r\\n')
    print('true' if isPalindrome(raw) else 'false')`,
      cpp: `#include <iostream>
#include <string>
#include <cctype>
using namespace std;

bool isPalindrome(const string& s) {
    int l = 0, r = (int)s.length() - 1;
    while (l < r) {
        while (l < r && !isalnum((unsigned char)s[l])) l++;
        while (l < r && !isalnum((unsigned char)s[r])) r--;
        if (tolower((unsigned char)s[l]) != tolower((unsigned char)s[r])) return false;
        l++;
        r--;
    }
    return true;
}

int main() {
    string s;
    if (getline(cin, s)) {
        cout << (isPalindrome(s) ? "true" : "false") << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-pal-1', input: 'Madam', expectedOutput: 'true', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-pal-2', input: 'Hello', expectedOutput: 'false', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-pal-3', input: 'A man, a plan, a canal: Panama', expectedOutput: 'true', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-pal-4', input: 'race a car', expectedOutput: 'false', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-pal-5', input: 'a', expectedOutput: 'true', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-pal-6', input: "No 'x' in Nixon", expectedOutput: 'true', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const raw = fs.readFileSync(0, 'utf-8').replace(/[\\r\\n]+$/, '');
const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
let l = 0, r = clean.length - 1, ok = true;
while (l < r) {
    if (clean[l] !== clean[r]) { ok = false; break; }
    l++; r--;
}
console.log(ok ? 'true' : 'false');`,
      python: `import sys
raw = sys.stdin.read().rstrip('\\r\\n')
clean = [ch.lower() for ch in raw if ch.isalnum()]
print('true' if clean == clean[::-1] else 'false')`
    }
  },

  // #8. Count Character Frequency
  {
    title: 'Count Character Frequency',
    slug: 'count-character-frequency',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Strings', 'Hash-Table', 'Beginner', 'Logic-Challenge'],
    description: `Given a string \`s\`, compute the frequency of each distinct character in the string.

Output the character frequencies in alphabetically sorted order formatted as:
\`<char>:<count>,<char>:<count>,...\`

### Input Format
A single line containing string \`s\`.

### Output Format
Comma-separated list of alphabetically sorted character frequency pairs.`,
    constraints: [
      '1 <= s.length <= 10^5',
      's consists of lowercase English letters.'
    ],
    examples: [
      { input: 'aabbc', output: 'a:2,b:2,c:1', explanation: 'a appears 2 times, b 2 times, c 1 time.' },
      { input: 'code', output: 'c:1,d:1,e:1,o:1', explanation: 'Sorted alphabetically.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'countCharFrequency',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 's', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function countCharFrequency(str) {
    const freq = {};
    for (const ch of str) {
        freq[ch] = (freq[ch] || 0) + 1;
    }
    const sortedKeys = Object.keys(freq).sort();
    return sortedKeys.map(k => \`\${k}:\${freq[k]}\`).join(',');
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) console.log(countCharFrequency(input));`,
      python: `import sys

def countCharFrequency(s: str) -> str:
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    return ','.join(f"{k}:{freq[k]}" for k in sorted(freq.keys()))

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(countCharFrequency(raw))`,
      cpp: `#include <iostream>
#include <map>
#include <string>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        map<char, int> freq;
        for (char c : s) freq[c]++;
        bool first = true;
        for (auto const& [ch, cnt] : freq) {
            if (!first) cout << ",";
            cout << ch << ":" << cnt;
            first = false;
        }
        cout << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-cf-1', input: 'aabbc', expectedOutput: 'a:2,b:2,c:1', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-cf-2', input: 'code', expectedOutput: 'c:1,d:1,e:1,o:1', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-cf-3', input: 'a', expectedOutput: 'a:1', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-cf-4', input: 'banana', expectedOutput: 'a:3,b:1,n:2', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-cf-5', input: 'mississippi', expectedOutput: 'i:4,m:1,p:2,s:4', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const str = fs.readFileSync(0, 'utf-8').trim();
if (str) {
    const freq = {};
    for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
    console.log(Object.keys(freq).sort().map(k => \`\${k}:\${freq[k]}\`).join(','));
}`,
      python: `import sys
s = sys.stdin.read().strip()
if s:
    freq = {}
    for ch in s: freq[ch] = freq.get(ch, 0) + 1
    print(','.join(f"{k}:{freq[k]}" for k in sorted(freq.keys())))`
    }
  },

  // #9. Find the Missing Number in a Sequence
  {
    title: 'Find Missing Number in Sequence',
    slug: 'find-missing-number-sequence',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Arrays', 'Math', 'Bit-Manipulation', 'Intermediate', 'Logic-Challenge'],
    description: `Given an array containing \`n - 1\` distinct integers in the range from \`1\` to \`n\`, find the one missing integer.

Solve the problem in $O(N)$ time and $O(1)$ extra space using mathematical sum or XOR.

### Input Format
First line: \`n\` (the maximum value in the sequence).
Second line: \`n - 1\` space-separated integers.

### Output Format
Print the single missing integer.`,
    constraints: [
      '2 <= n <= 10^5',
      'The array has length n - 1 with elements from 1 to n.',
      'Array may be unsorted.'
    ],
    examples: [
      { input: '5\\n1 2 4 5', output: '3', explanation: 'The missing number from 1 to 5 is 3.' },
      { input: '3\\n2 3', output: '1', explanation: 'The missing number from 1 to 3 is 1.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'findMissingNumber',
      className: 'Solution',
      returnType: 'int',
      parameters: [{ name: 'n', type: 'int' }, { name: 'nums', type: 'list<int>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function findMissingNumber(n, arr) {
    const expectedSum = (n * (n + 1)) / 2;
    let actualSum = 0;
    for (const num of arr) actualSum += num;
    return expectedSum - actualSum;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n).map(Number);
    console.log(findMissingNumber(n, arr));
}`,
      python: `import sys

def findMissingNumber(n: int, arr: list[int]) -> int:
    expected_sum = (n * (n + 1)) // 2
    return expected_sum - sum(arr)

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        arr = [int(x) for x in tokens[1:n]]
        print(findMissingNumber(n, arr))`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        long long expected = (1LL * n * (n + 1)) / 2;
        long long actual = 0;
        for (int i = 0; i < n - 1; i++) {
            long long x;
            cin >> x;
            actual += x;
        }
        cout << (expected - actual) << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-mn-1', input: '5\n1 2 4 5', expectedOutput: '3', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-mn-2', input: '3\n2 3', expectedOutput: '1', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-mn-3', input: '3\n1 2', expectedOutput: '3', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-mn-4', input: '4\n4 1 2', expectedOutput: '3', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-mn-5', input: '6\n2 4 1 6 3', expectedOutput: '5', isPublic: false, isEdgeCase: false, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const arr = input.slice(1, n).map(Number);
    const expected = (n * (n + 1)) / 2;
    let actual = 0;
    for (const x of arr) actual += x;
    console.log(expected - actual);
}`,
      python: `import sys
tokens = sys.stdin.read().split()
if tokens:
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n]]
    print((n * (n + 1)) // 2 - sum(arr))`
    }
  },

  // #10. Student Attendance Calculation Algorithm
  {
    title: 'Student Attendance Calculator',
    slug: 'student-attendance-calculator',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'MEDIUM',
    tags: ['Conditionals', 'Math', 'Real-World', 'Intermediate', 'Logic-Challenge'],
    description: `Design an attendance evaluation algorithm for a learning institution.

Given a sequence of daily status codes:
- \`"P"\` = Present (counts as 1)
- \`"L"\` = Late (counts as present = 1)
- \`"A"\` = Absent (counts as 0)

Calculate:
1. Total classes recorded.
2. Present count (sum of \`P\` and \`L\`).
3. Attendance percentage rounded to 2 decimal places: \`(present / total) * 100\`.
4. Eligibility status: If percentage >= 75.00%, status is \`"Eligible"\`; otherwise \`"Shortage Warning"\`. If total == 0, percentage is \`0.00%\` and status is \`"No Records"\`.

### Input Format
First line: \`n\` (number of attendance records).
Second line: \`n\` space-separated single-character status codes (\`P\`, \`L\`, or \`A\`).

### Output Format
A single line formatted as:
\`Total: <total>, Present: <present>, Percentage: <percentage>%, Status: <status>\``,
    constraints: [
      '0 <= n <= 10^4',
      'Status codes are P, L, or A.'
    ],
    examples: [
      {
        input: '5\\nP A P L P',
        output: 'Total: 5, Present: 4, Percentage: 80.00%, Status: Eligible',
        explanation: '4 present out of 5 classes is 80%, which is >= 75%.'
      },
      {
        input: '4\\nP P P A',
        output: 'Total: 4, Present: 3, Percentage: 75.00%, Status: Eligible',
        explanation: '3 present out of 4 classes is exactly 75%.'
      }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'evaluateAttendance',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 'records', type: 'list<string>' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function evaluateAttendance(records) {
    if (!records || records.length === 0) {
        return 'Total: 0, Present: 0, Percentage: 0.00%, Status: No Records';
    }
    let present = 0;
    for (const code of records) {
        if (code === 'P' || code === 'L') present++;
    }
    const pct = ((present / records.length) * 100).toFixed(2);
    const status = Number(pct) >= 75.0 ? 'Eligible' : 'Shortage Warning';
    return \`Total: \${records.length}, Present: \${present}, Percentage: \${pct}%, Status: \${status}\`;
}

const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    const records = n > 0 ? input.slice(1, n + 1) : [];
    console.log(evaluateAttendance(records));
}`,
      python: `import sys

def evaluateAttendance(records: list[str]) -> str:
    if not records:
        return 'Total: 0, Present: 0, Percentage: 0.00%, Status: No Records'
    present = sum(1 for c in records if c in ('P', 'L'))
    pct = (present / len(records)) * 100.0
    status = 'Eligible' if round(pct, 2) >= 75.0 else 'Shortage Warning'
    return f"Total: {len(records)}, Present: {present}, Percentage: {pct:.2f}%, Status: {status}"

if __name__ == '__main__':
    tokens = sys.stdin.read().split()
    if tokens:
        n = int(tokens[0])
        records = tokens[1:n+1] if n > 0 else []
        print(evaluateAttendance(records))`,
      cpp: `#include <iostream>
#include <vector>
#include <iomanip>
using namespace std;

int main() {
    int n;
    if (cin >> n) {
        if (n == 0) {
            cout << "Total: 0, Present: 0, Percentage: 0.00%, Status: No Records" << endl;
            return 0;
        }
        int present = 0;
        for (int i = 0; i < n; i++) {
            char c;
            cin >> c;
            if (c == 'P' || c == 'L') present++;
        }
        double pct = (double)present / n * 100.0;
        string status = (pct + 1e-9 >= 75.0) ? "Eligible" : "Shortage Warning";
        cout << fixed << setprecision(2);
        cout << "Total: " << n << ", Present: " << present << ", Percentage: " << pct << "%, Status: " << status << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-att-1', input: '5\nP A P L P', expectedOutput: 'Total: 5, Present: 4, Percentage: 80.00%, Status: Eligible', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-att-2', input: '4\nP P P A', expectedOutput: 'Total: 4, Present: 3, Percentage: 75.00%, Status: Eligible', isPublic: true, isEdgeCase: true, weight: 1 },
      { id: 'tc-att-3', input: '4\nP A A P', expectedOutput: 'Total: 4, Present: 2, Percentage: 50.00%, Status: Shortage Warning', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-att-4', input: '3\nL L L', expectedOutput: 'Total: 3, Present: 3, Percentage: 100.00%, Status: Eligible', isPublic: false, isEdgeCase: true, weight: 1 },
      { id: 'tc-att-5', input: '0', expectedOutput: 'Total: 0, Present: 0, Percentage: 0.00%, Status: No Records', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
if (input.length > 0) {
    const n = parseInt(input[0], 10);
    if (n === 0) {
        console.log('Total: 0, Present: 0, Percentage: 0.00%, Status: No Records');
    } else {
        const records = input.slice(1, n + 1);
        let present = 0;
        for (const c of records) if (c === 'P' || c === 'L') present++;
        const pct = ((present / n) * 100).toFixed(2);
        const status = Number(pct) >= 75.0 ? 'Eligible' : 'Shortage Warning';
        console.log(\`Total: \${n}, Present: \${present}, Percentage: \${pct}%, Status: \${status}\`);
    }
}`,
      python: `import sys
tokens = sys.stdin.read().split()
if tokens:
    n = int(tokens[0])
    if n == 0:
        print('Total: 0, Present: 0, Percentage: 0.00%, Status: No Records')
    else:
        records = tokens[1:n+1]
        present = sum(1 for c in records if c in ('P', 'L'))
        pct = (present / n) * 100.0
        status = 'Eligible' if round(pct, 2) >= 75.0 else 'Shortage Warning'
        print(f"Total: {n}, Present: {present}, Percentage: {pct:.2f}%, Status: {status}")`
    }
  },

  // #11. First Non-Repeating Character (Bonus Tie-Breaker)
  {
    title: 'First Non-Repeating Character',
    slug: 'first-non-repeating-char',
    status: 'PUBLISHED',
    version: 1,
    difficulty: 'EASY',
    tags: ['Strings', 'Hash-Table', 'Queue', 'Intermediate', 'Logic-Challenge'],
    description: `Given a string \`s\`, find the first non-repeating character in it and print it.

If no such unique character exists, print \`None\`.

### Input Format
A single line containing string \`s\`.

### Output Format
Print the first non-repeating character, or \`None\`.`,
    constraints: [
      '1 <= s.length <= 10^5',
      's consists of lowercase English letters.'
    ],
    examples: [
      { input: 'swiss', output: 'w', explanation: "'s' repeats, 'w' is the first unique character." },
      { input: 'aabbcc', output: 'None', explanation: 'All characters repeat.' }
    ],
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    benchmarks: { targetTimeMs: 15, pythonMultiplier: 3.5, jsMultiplier: 2.0, cppMultiplier: 1.0, javaMultiplier: 2.0 },
    functionSignature: {
      functionName: 'firstUniqueChar',
      className: 'Solution',
      returnType: 'string',
      parameters: [{ name: 's', type: 'string' }]
    },
    starterCode: {
      javascript: `const fs = require('fs');

function firstUniqueChar(str) {
    const freq = {};
    for (const ch of str) {
        freq[ch] = (freq[ch] || 0) + 1;
    }
    for (const ch of str) {
        if (freq[ch] === 1) return ch;
    }
    return 'None';
}

const input = fs.readFileSync(0, 'utf-8').trim();
if (input) console.log(firstUniqueChar(input));`,
      python: `import sys

def firstUniqueChar(s: str) -> str:
    freq = {}
    for ch in s:
        freq[ch] = freq.get(ch, 0) + 1
    for ch in s:
        if freq[ch] == 1:
            return ch
    return 'None'

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(firstUniqueChar(raw))`,
      cpp: `#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

int main() {
    string s;
    if (cin >> s) {
        unordered_map<char, int> freq;
        for (char c : s) freq[c]++;
        char ans = 0;
        for (char c : s) {
            if (freq[c] == 1) {
                ans = c;
                break;
            }
        }
        if (ans) cout << ans << endl;
        else cout << "None" << endl;
    }
    return 0;
}`
    },
    testCases: [
      { id: 'tc-fnr-1', input: 'swiss', expectedOutput: 'w', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-fnr-2', input: 'aabbcc', expectedOutput: 'None', isPublic: true, isEdgeCase: false, weight: 1 },
      { id: 'tc-fnr-3', input: 'leetcode', expectedOutput: 'l', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-fnr-4', input: 'loveleetcode', expectedOutput: 'v', isPublic: false, isEdgeCase: false, weight: 1 },
      { id: 'tc-fnr-5', input: 'z', expectedOutput: 'z', isPublic: false, isEdgeCase: true, weight: 1 }
    ],
    referenceSolution: {
      javascript: `const fs = require('fs');
const s = fs.readFileSync(0, 'utf-8').trim();
if (s) {
    const freq = {};
    for (const ch of s) freq[ch] = (freq[ch] || 0) + 1;
    let found = 'None';
    for (const ch of s) {
        if (freq[ch] === 1) { found = ch; break; }
    }
    console.log(found);
}`,
      python: `import sys
s = sys.stdin.read().strip()
if s:
    freq = {}
    for ch in s: freq[ch] = freq.get(ch, 0) + 1
    ans = 'None'
    for ch in s:
        if freq[ch] == 1:
            ans = ch
            break
    print(ans)`
    }
  }
];
