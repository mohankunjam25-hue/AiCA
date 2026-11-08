import { AlgorithmDefinition, TraceFrame } from '../core/types';

/* ========================================================================= */
/* 1. BINARY SEARCH (Searching)                                              */
/* ========================================================================= */
export const binarySearchDef: AlgorithmDefinition<{ array: number[]; target: number }> = {
  id: 'binary-search',
  slug: 'binary-search',
  name: 'Binary Search',
  category: 'Searching',
  timeComplexity: 'O(log n)',
  spaceComplexity: 'O(1)',
  description: 'Divide-and-conquer search algorithm that repeatedly halves the search interval.',
  defaultInput: {
    array: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91],
    target: 23
  },
  codeMap: {
    python: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1`,
    javascript: `function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}`,
    cpp: `int binarySearch(const std::vector<int>& arr, int target) {
    int left = 0;
    int right = static_cast<int>(arr.size()) - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}`,
    java: `public int binarySearch(int[] arr, int target) {
    int left = 0;
    int right = arr.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    return -1;
}`
  },
  generateSteps: ({ array, target }) => {
    const steps: TraceFrame[] = [];
    let left = 0;
    let right = array.length - 1;

    steps.push({
      id: 'step-0',
      stepIndex: 0,
      totalSteps: 0,
      lineMapping: { python: 2, javascript: 2, cpp: 2, java: 2 },
      actionType: 'INITIALIZE',
      visualPayload: {
        kind: 'ARRAY',
        data: [...array],
        pointers: { L: { index: left, label: 'L', color: '#0969da' }, R: { index: right, label: 'R', color: '#cf222e' } },
        windowRange: [left, right]
      },
      variables: { left, right, target },
      narration: {
        title: 'Initialize Search Range',
        explanation: `Set search boundaries: left=0 and right=${right} over sorted array of ${array.length} items.`,
        complexityImpact: 'O(1) Init'
      }
    });

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);

      steps.push({
        id: `step-${steps.length}`,
        stepIndex: steps.length,
        totalSteps: 0,
        lineMapping: { python: 6, javascript: 6, cpp: 6, java: 6 },
        actionType: 'POINTER_MOVE',
        visualPayload: {
          kind: 'ARRAY',
          data: [...array],
          pointers: {
            L: { index: left, label: 'L', color: '#0969da' },
            Mid: { index: mid, label: 'Mid', color: '#8250df' },
            R: { index: right, label: 'R', color: '#cf222e' }
          },
          activeIndices: [mid],
          windowRange: [left, right]
        },
        variables: { left, mid, right, 'arr[mid]': array[mid], target },
        narration: {
          title: `Calculate Midpoint (Index ${mid})`,
          explanation: `Mid = floor((${left} + ${right}) / 2) = ${mid}. Inspect value arr[${mid}] = ${array[mid]}.`,
          complexityImpact: 'O(1) Math'
        }
      });

      if (array[mid] === target) {
        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 8, javascript: 8, cpp: 8, java: 8 },
          actionType: 'MATCH_FOUND',
          visualPayload: {
            kind: 'ARRAY',
            data: [...array],
            pointers: { Found: { index: mid, label: 'Target', color: '#2ea043' } },
            matchedIndices: [mid]
          },
          variables: { 'arr[mid] == target': true, resultIndex: mid },
          narration: {
            title: `✓ Target ${target} Found!`,
            explanation: `Match discovered at index ${mid} in logarithmic time!`,
            complexityImpact: 'O(log n) Total'
          }
        });
        break;
      } else if (array[mid] < target) {
        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 10, javascript: 10, cpp: 10, java: 10 },
          actionType: 'WINDOW_SHRINK',
          visualPayload: {
            kind: 'ARRAY',
            data: [...array],
            pointers: {
              L: { index: mid + 1, label: 'L', color: '#0969da' },
              R: { index: right, label: 'R', color: '#cf222e' }
            },
            discardedRanges: [[left, mid]],
            windowRange: [mid + 1, right]
          },
          variables: { 'arr[mid] < target': true, newLeft: mid + 1 },
          narration: {
            title: `Discard Left Half`,
            explanation: `${array[mid]} < ${target}. Target must be in right half. Discarding range [${left}...${mid}].`,
            complexityImpact: 'Halves Search Space'
          }
        });
        left = mid + 1;
      } else {
        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 12, javascript: 12, cpp: 12, java: 12 },
          actionType: 'WINDOW_SHRINK',
          visualPayload: {
            kind: 'ARRAY',
            data: [...array],
            pointers: {
              L: { index: left, label: 'L', color: '#0969da' },
              R: { index: mid - 1, label: 'R', color: '#cf222e' }
            },
            discardedRanges: [[mid, right]],
            windowRange: [left, mid - 1]
          },
          variables: { 'arr[mid] > target': true, newRight: mid - 1 },
          narration: {
            title: `Discard Right Half`,
            explanation: `${array[mid]} > ${target}. Target must be in left half. Discarding range [${mid}...${right}].`,
            complexityImpact: 'Halves Search Space'
          }
        });
        right = mid - 1;
      }
    }

    steps.forEach((s, idx) => {
      s.totalSteps = steps.length;
    });

    return steps;
  }
};

/* ========================================================================= */
/* 2. TWO SUM SORTED (Two Pointers)                                          */
/* ========================================================================= */
export const twoPointersDef: AlgorithmDefinition<{ array: number[]; target: number }> = {
  id: 'two-pointers',
  slug: 'two-pointers',
  name: 'Two Pointers (Sorted Two Sum)',
  category: 'Searching',
  timeComplexity: 'O(n)',
  spaceComplexity: 'O(1)',
  description: 'Shrinks boundaries inward from both ends to find a pair matching target sum.',
  defaultInput: {
    array: [1, 3, 4, 7, 11, 15],
    target: 18
  },
  codeMap: {
    python: `def two_sum_sorted(numbers, target):
    left = 0
    right = len(numbers) - 1

    while left < right:
        current_sum = numbers[left] + numbers[right]
        if current_sum == target:
            return [left, right]
        elif current_sum < target:
            left += 1
        else:
            right -= 1

    return []`,
    javascript: `function twoSumSorted(numbers, target) {
    let left = 0;
    let right = numbers.length - 1;

    while (left < right) {
        const sum = numbers[left] + numbers[right];
        if (sum === target) {
            return [left, right];
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return [];
}`,
    cpp: `std::vector<int> twoSumSorted(const std::vector<int>& numbers, int target) {
    int left = 0;
    int right = static_cast<int>(numbers.size()) - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) {
            return {left, right};
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return {};
}`,
    java: `public int[] twoSumSorted(int[] numbers, int target) {
    int left = 0;
    int right = numbers.length - 1;

    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) {
            return new int[] { left, right };
        } else if (sum < target) {
            left++;
        } else {
            right--;
        }
    }

    return new int[0];
}`
  },
  generateSteps: ({ array, target }) => {
    const steps: TraceFrame[] = [];
    let left = 0;
    let right = array.length - 1;

    while (left < right) {
      const sum = array[left] + array[right];

      steps.push({
        id: `step-${steps.length}`,
        stepIndex: steps.length,
        totalSteps: 0,
        lineMapping: { python: 6, javascript: 6, cpp: 6, java: 6 },
        actionType: 'COMPARE',
        visualPayload: {
          kind: 'ARRAY',
          data: [...array],
          pointers: {
            L: { index: left, label: `L(${array[left]})`, color: '#0969da' },
            R: { index: right, label: `R(${array[right]})`, color: '#cf222e' }
          },
          activeIndices: [left, right]
        },
        variables: { left, right, 'arr[L]': array[left], 'arr[R]': array[right], current_sum: sum, target },
        narration: {
          title: `Evaluate Pair Sum: ${array[left]} + ${array[right]} = ${sum}`,
          explanation: `Compare current sum (${sum}) against target (${target}).`,
          complexityImpact: 'O(1) Step'
        }
      });

      if (sum === target) {
        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 8, javascript: 8, cpp: 8, java: 8 },
          actionType: 'MATCH_FOUND',
          visualPayload: {
            kind: 'ARRAY',
            data: [...array],
            pointers: {
              Found1: { index: left, label: 'Ans1', color: '#2ea043' },
              Found2: { index: right, label: 'Ans2', color: '#2ea043' }
            },
            matchedIndices: [left, right]
          },
          variables: { 'sum == target': true, pair: [left, right] },
          narration: {
            title: `✓ Pair Discovered!`,
            explanation: `Indices [${left}, ${right}] sum up to target ${target} (${array[left]} + ${array[right]} = ${sum}).`,
            complexityImpact: 'O(n) Linear'
          }
        });
        break;
      } else if (sum < target) {
        left++;
      } else {
        right--;
      }
    }

    steps.forEach((s) => (s.totalSteps = steps.length));
    return steps;
  }
};

/* ========================================================================= */
/* 3. BREADTH-FIRST SEARCH (Graphs)                                          */
/* ========================================================================= */
export const bfsDef: AlgorithmDefinition<{ start: string }> = {
  id: 'breadth-first-search',
  slug: 'breadth-first-search',
  name: 'Breadth-First Search (BFS)',
  category: 'Graphs',
  timeComplexity: 'O(V + E)',
  spaceComplexity: 'O(V)',
  description: 'Explores graph level-by-level using a FIFO queue to discover shortest paths.',
  defaultInput: { start: 'A' },
  codeMap: {
    python: `from collections import deque

def bfs(graph, start):
    visited = {start}
    queue = deque([start])
    order = []

    while queue:
        node = queue.popleft()
        order.append(node)
        for neighbor in graph[node]:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)

    return order`,
    javascript: `function bfs(graph, start) {
    const visited = new Set([start]);
    const queue = [start];
    const order = [];

    while (queue.length > 0) {
        const node = queue.shift();
        order.push(node);
        for (const neighbor of graph[node] || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }

    return order;
}`,
    cpp: `std::vector<char> bfs(const std::unordered_map<char, std::vector<char>>& graph, char start) {
    std::unordered_set<char> visited = {start};
    std::queue<char> q;
    q.push(start);
    std::vector<char> order;

    while (!q.empty()) {
        char node = q.front(); q.pop();
        order.push_back(node);
        for (char neighbor : graph.at(node)) {
            if (!visited.count(neighbor)) {
                visited.insert(neighbor);
                q.push(neighbor);
            }
        }
    }

    return order;
}`,
    java: `public List<String> bfs(Map<String, List<String>> graph, String start) {
    Set<String> visited = new HashSet<>();
    Queue<String> queue = new LinkedList<>();
    List<String> order = new ArrayList<>();

    visited.add(start);
    queue.offer(start);

    while (!queue.isEmpty()) {
        String node = queue.poll();
        order.add(node);
        for (String neighbor : graph.getOrDefault(node, Collections.emptyList())) {
            if (!visited.contains(neighbor)) {
                visited.add(neighbor);
                queue.offer(neighbor);
            }
        }
    }

    return order;
}`
  },
  generateSteps: ({ start }) => {
    const nodes = [
      { id: 'A', label: 'A', x: 80, y: 100, state: 'unvisited' as const },
      { id: 'B', label: 'B', x: 180, y: 40, state: 'unvisited' as const },
      { id: 'C', label: 'C', x: 180, y: 160, state: 'unvisited' as const },
      { id: 'D', label: 'D', x: 300, y: 40, state: 'unvisited' as const },
      { id: 'E', label: 'E', x: 300, y: 160, state: 'unvisited' as const },
      { id: 'F', label: 'F', x: 420, y: 100, state: 'unvisited' as const }
    ];

    const edges = [
      { from: 'A', to: 'B' },
      { from: 'A', to: 'C' },
      { from: 'B', to: 'D' },
      { from: 'C', to: 'E' },
      { from: 'D', to: 'F' },
      { from: 'E', to: 'F' }
    ];

    const adjacency: Record<string, string[]> = {
      A: ['B', 'C'],
      B: ['D'],
      C: ['E'],
      D: ['F'],
      E: ['F'],
      F: []
    };

    const steps: TraceFrame[] = [];
    const visited = new Set<string>([start]);
    const queue = [start];
    const order: string[] = [];

    steps.push({
      id: 'step-0',
      stepIndex: 0,
      totalSteps: 0,
      lineMapping: { python: 4, javascript: 2, cpp: 2, java: 5 },
      actionType: 'INITIALIZE',
      visualPayload: {
        kind: 'GRAPH',
        nodes: nodes.map((n) => (n.id === start ? { ...n, state: 'queued' as const } : n)),
        edges,
        queueState: [...queue]
      },
      variables: { start, queue: [...queue], visited: Array.from(visited) },
      narration: {
        title: `Enqueue Start Node "${start}"`,
        explanation: `Mark node ${start} visited and enqueue it into the BFS queue.`,
        complexityImpact: 'O(1) Enqueue'
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);

      steps.push({
        id: `step-${steps.length}`,
        stepIndex: steps.length,
        totalSteps: 0,
        lineMapping: { python: 9, javascript: 7, cpp: 9, java: 12 },
        actionType: 'NODE_VISIT',
        visualPayload: {
          kind: 'GRAPH',
          nodes: nodes.map((n) =>
            n.id === current
              ? { ...n, state: 'visiting' as const }
              : visited.has(n.id)
              ? { ...n, state: 'visited' as const }
              : n
          ),
          edges,
          activeNodeId: current,
          queueState: [...queue]
        },
        variables: { current, order: [...order], queue: [...queue] },
        narration: {
          title: `Dequeue & Visit Node "${current}"`,
          explanation: `Popped node "${current}" from queue. Exploring all its outgoing neighbors.`,
          complexityImpact: 'Level Order Progress'
        }
      });

      for (const neighbor of adjacency[current] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);

          steps.push({
            id: `step-${steps.length}`,
            stepIndex: steps.length,
            totalSteps: 0,
            lineMapping: { python: 13, javascript: 11, cpp: 13, java: 16 },
            actionType: 'EDGE_TRAVERSE',
            visualPayload: {
              kind: 'GRAPH',
              nodes: nodes.map((n) =>
                n.id === neighbor
                  ? { ...n, state: 'queued' as const }
                  : visited.has(n.id)
                  ? { ...n, state: 'visited' as const }
                  : n
              ),
              edges,
              activeEdge: { from: current, to: neighbor },
              queueState: [...queue]
            },
            variables: { current, neighbor, queue: [...queue], visited: Array.from(visited) },
            narration: {
              title: `Discover Unvisited Neighbor "${neighbor}"`,
              explanation: `Traversed edge (${current} ➔ ${neighbor}). Enqueued "${neighbor}" for next level exploration.`,
              complexityImpact: 'O(1) Enqueue'
            }
          });
        }
      }
    }

    steps.forEach((s) => (s.totalSteps = steps.length));
    return steps;
  }
};

/* ========================================================================= */
/* 4. 0/1 KNAPSACK (Dynamic Programming Matrix)                              */
/* ========================================================================= */
export const knapsackDef: AlgorithmDefinition<{ weights: number[]; values: number[]; capacity: number }> = {
  id: 'knapsack-01',
  slug: 'knapsack-01',
  name: '0/1 Knapsack Problem',
  category: 'Dynamic Programming',
  timeComplexity: 'O(n · W)',
  spaceComplexity: 'O(n · W)',
  description: 'Constructs a 2D DP matrix to find the maximum value that fits within capacity W.',
  defaultInput: {
    weights: [2, 3, 4],
    values: [3, 4, 5],
    capacity: 5
  },
  codeMap: {
    python: `def knapsack(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        for w in range(1, W + 1):
            if weights[i - 1] <= w:
                dp[i][w] = max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                )
            else:
                dp[i][w] = dp[i - 1][w]

    return dp[n][W]`,
    javascript: `function knapsack(weights, values, W) {
    const n = weights.length;
    const dp = Array.from({ length: n + 1 }, () => Array(W + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        for (let w = 1; w <= W; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    return dp[n][W];
}`,
    cpp: `int knapsack(const std::vector<int>& weights, const std::vector<int>& values, int W) {
    int n = weights.size();
    std::vector<std::vector<int>> dp(n + 1, std::vector<int>(W + 1, 0));

    for (int i = 1; i <= n; ++i) {
        for (int w = 1; w <= W; ++w) {
            if (weights[i - 1] <= w) {
                dp[i][w] = std::max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    return dp[n][W];
}`,
    java: `public int knapsack(int[] weights, int[] values, int W) {
    int n = weights.length;
    int[][] dp = new int[n + 1][W + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 1; w <= W; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    values[i - 1] + dp[i - 1][w - weights[i - 1]]
                );
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    return dp[n][W];
}`
  },
  generateSteps: ({ weights, values, capacity }) => {
    const n = weights.length;
    const grid: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
    const rowLabels = ['Init (0)', ...weights.map((wt, i) => `Item ${i + 1} (w=${wt}, v=${values[i]})`)];
    const colLabels = Array.from({ length: capacity + 1 }, (_, c) => `Cap ${c}`);

    const steps: TraceFrame[] = [];

    steps.push({
      id: 'step-0',
      stepIndex: 0,
      totalSteps: 0,
      lineMapping: { python: 3, javascript: 3, cpp: 3, java: 3 },
      actionType: 'INITIALIZE',
      visualPayload: {
        kind: 'MATRIX',
        grid: grid.map((r) => [...r]),
        rowLabels,
        colLabels,
        formulaExplanation: 'Base case: 0 items or 0 capacity yields 0 total value.'
      },
      variables: { n, capacity, 'dp[0][w]': 0 },
      narration: {
        title: 'Initialize 2D DP Table',
        explanation: `Allocated (n+1) x (W+1) matrix initialized with 0 base cases.`,
        complexityImpact: 'O(n · W) Space'
      }
    });

    for (let i = 1; i <= n; i++) {
      const wt = weights[i - 1];
      const val = values[i - 1];

      for (let w = 1; w <= capacity; w++) {
        let formula = '';
        const dependencies: [number, number][] = [];

        if (wt <= w) {
          const excludeVal = grid[i - 1][w];
          const includeVal = val + grid[i - 1][w - wt];
          grid[i][w] = Math.max(excludeVal, includeVal);

          dependencies.push([i - 1, w]);
          dependencies.push([i - 1, w - wt]);
          formula = `dp[${i}][${w}] = max(exclude: ${excludeVal}, include: ${val} + dp[${i - 1}][${w - wt}]=${includeVal}) = ${grid[i][w]}`;
        } else {
          grid[i][w] = grid[i - 1][w];
          dependencies.push([i - 1, w]);
          formula = `Item weight (${wt}) > capacity (${w}). Inheriting: dp[${i}][${w}] = dp[${i - 1}][${w}] = ${grid[i][w]}`;
        }

        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 8, javascript: 8, cpp: 8, java: 8 },
          actionType: 'DP_CELL_CALCULATE',
          visualPayload: {
            kind: 'MATRIX',
            grid: grid.map((r) => [...r]),
            rowLabels,
            colLabels,
            activeCell: [i, w],
            dependencyCells: dependencies,
            formulaExplanation: formula
          },
          variables: { i, w, item_weight: wt, item_value: val, 'dp[i][w]': grid[i][w] },
          narration: {
            title: `Compute Cell dp[${i}][${w}]`,
            explanation: formula,
            complexityImpact: 'O(1) Cell Calculation'
          }
        });
      }
    }

    steps.forEach((s) => (s.totalSteps = steps.length));
    return steps;
  }
};

/* ========================================================================= */
/* 5. LRU CACHE (System Design & Backend Data Structure)                     */
/* ========================================================================= */
export const lruCacheDef: AlgorithmDefinition<{ capacity: number }> = {
  id: 'lru-cache',
  slug: 'lru-cache',
  name: 'LRU Cache (Least Recently Used)',
  category: 'System Design',
  timeComplexity: 'O(1) Get & Put',
  spaceComplexity: 'O(Capacity)',
  description: 'High-speed in-memory cache using Hash Map + Doubly Linked List for instant eviction.',
  defaultInput: { capacity: 3 },
  codeMap: {
    python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # key -> node
        self.head = Node(0, 0) # MRU
        self.tail = Node(0, 0) # LRU
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._insert_head(node)
            return node.value
        return -1

    def put(self, key: int, value: int):
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._insert_head(node)
        if len(self.cache) > self.capacity:
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]`,
    javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return -1;
        const val = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, val); // Promote to MRU
        return val;
    }

    put(key, value) {
        if (this.cache.has(key)) this.cache.delete(key);
        this.cache.set(key, value);
        if (this.cache.size > this.capacity) {
            const lruKey = this.cache.keys().next().value;
            this.cache.delete(lruKey); // Evict LRU
        }
    }
}`,
    cpp: `class LRUCache {
    int capacity;
    std::list<std::pair<int, int>> dll; // MRU to LRU
    std::unordered_map<int, std::list<std::pair<int, int>>::iterator> cache;
public:
    LRUCache(int cap) : capacity(cap) {}

    int get(int key) {
        if (!cache.count(key)) return -1;
        dll.splice(dll.begin(), dll, cache[key]); // Move to front
        return cache[key]->second;
    }

    void put(int key, int value) {
        if (cache.count(key)) {
            cache[key]->second = value;
            dll.splice(dll.begin(), dll, cache[key]);
            return;
        }
        if (dll.size() == capacity) {
            cache.erase(dll.back().first);
            dll.pop_back(); // Evict LRU
        }
        dll.emplace_front(key, value);
        cache[key] = dll.begin();
    }
};`,
    java: `public class LRUCache {
    private final int capacity;
    private final Map<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry eldest) {
                return size() > capacity;
            }
        };
    }

    public int get(int key) {
        return map.getOrDefault(key, -1);
    }

    public void put(int key, int value) {
        map.put(key, value);
    }
}`
  },
  generateSteps: ({ capacity }) => {
    const steps: TraceFrame[] = [];
    const operations: { type: 'PUT' | 'GET'; key: string; value?: number }[] = [
      { type: 'PUT', key: 'A', value: 100 },
      { type: 'PUT', key: 'B', value: 200 },
      { type: 'PUT', key: 'C', value: 300 },
      { type: 'GET', key: 'A' },                 // Cache hit, promote A to MRU
      { type: 'PUT', key: 'D', value: 400 }     // Overflow! Evict B (LRU)
    ];

    const currentHash: Record<string, number> = {};
    const currentList: { key: string; value: number; isMRU?: boolean; isLRU?: boolean }[] = [];

    steps.push({
      id: 'step-0',
      stepIndex: 0,
      totalSteps: 0,
      lineMapping: { python: 2, javascript: 2, cpp: 6, java: 5 },
      actionType: 'INITIALIZE',
      visualPayload: {
        kind: 'SYSTEM_STRUCTURE',
        structureType: 'LRU_CACHE',
        capacity,
        hashTable: {},
        linkedList: []
      },
      variables: { capacity, size: 0 },
      narration: {
        title: 'Initialize LRU Cache',
        explanation: `Allocated Hash Map + Doubly Linked List with max capacity = ${capacity}.`,
        complexityImpact: 'O(1) Init'
      }
    });

    operations.forEach((op, opIdx) => {
      if (op.type === 'PUT') {
        const key = op.key;
        const val = op.value!;
        const existingIdx = currentList.findIndex((n) => n.key === key);

        if (existingIdx !== -1) {
          currentList.splice(existingIdx, 1);
        }

        // Add to Head (MRU)
        currentList.unshift({ key, value: val, isMRU: true });
        currentHash[key] = val;

        let evictedKey: string | null = null;
        if (currentList.length > capacity) {
          const evicted = currentList.pop()!;
          delete currentHash[evicted.key];
          evictedKey = evicted.key;
        }

        steps.push({
          id: `step-${steps.length}`,
          stepIndex: steps.length,
          totalSteps: 0,
          lineMapping: { python: 20, javascript: 14, cpp: 16, java: 19 },
          actionType: evictedKey ? 'CACHE_EVICT' : 'CACHE_ACCESS',
          visualPayload: {
            kind: 'SYSTEM_STRUCTURE',
            structureType: 'LRU_CACHE',
            capacity,
            hashTable: { ...currentHash },
            linkedList: currentList.map((n, i) => ({
              ...n,
              isMRU: i === 0,
              isLRU: i === currentList.length - 1
            })),
            lastAction: evictedKey
              ? { type: 'EVICT', key: evictedKey }
              : { type: 'PUT', key, hit: false }
          },
          variables: { action: `PUT(${key}, ${val})`, size: currentList.length, capacity },
          narration: {
            title: evictedKey
              ? `Capacity Full! Evicted LRU "${evictedKey}"`
              : `Inserted Key "${key}" to MRU Head`,
            explanation: evictedKey
              ? `Cache capacity (${capacity}) exceeded. Removed tail node "${evictedKey}" in O(1) time and inserted "${key}".`
              : `Added key "${key}" to hash map and linked list front in O(1) time.`,
            complexityImpact: 'O(1) Constant'
          }
        });
      } else if (op.type === 'GET') {
        const key = op.key;
        const idx = currentList.findIndex((n) => n.key === key);

        if (idx !== -1) {
          const [hitNode] = currentList.splice(idx, 1);
          currentList.unshift(hitNode); // Promote to MRU

          steps.push({
            id: `step-${steps.length}`,
            stepIndex: steps.length,
            totalSteps: 0,
            lineMapping: { python: 11, javascript: 7, cpp: 9, java: 15 },
            actionType: 'CACHE_ACCESS',
            visualPayload: {
              kind: 'SYSTEM_STRUCTURE',
              structureType: 'LRU_CACHE',
              capacity,
              hashTable: { ...currentHash },
              linkedList: currentList.map((n, i) => ({
                ...n,
                isMRU: i === 0,
                isLRU: i === currentList.length - 1
              })),
              lastAction: { type: 'GET', key, hit: true }
            },
            variables: { action: `GET(${key})`, hit: true, value: hitNode.value },
            narration: {
              title: `Cache HIT: Key "${key}" Accessed!`,
              explanation: `Found "${key}" in hash map. Spliced node to MRU head position in O(1) time.`,
              complexityImpact: 'O(1) Hash Map + Pointer Update'
            }
          });
        }
      }
    });

    steps.forEach((s) => (s.totalSteps = steps.length));
    return steps;
  }
};

/* ========================================================================= */
/* ALGORITHM REGISTRY MAP & EXPORTS                                          */
/* ========================================================================= */
export const ALGORITHM_REGISTRY: Record<string, AlgorithmDefinition<any>> = {
  'binary-search': binarySearchDef,
  'two-pointers': twoPointersDef,
  'breadth-first-search': bfsDef,
  'knapsack-01': knapsackDef,
  'lru-cache': lruCacheDef
};

export const ALL_ALGORITHM_DEFINITIONS = Object.values(ALGORITHM_REGISTRY);

export function getAlgorithmDef(idOrSlug: string): AlgorithmDefinition | undefined {
  if (ALGORITHM_REGISTRY[idOrSlug]) return ALGORITHM_REGISTRY[idOrSlug];
  return ALL_ALGORITHM_DEFINITIONS.find((a) => a.slug === idOrSlug || a.id === idOrSlug);
}
