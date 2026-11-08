import { SolutionApproach, ApproachComparisonRow } from '../types/evaluation.js';

export interface ProblemCanonicalData {
  solutionApproaches: SolutionApproach[];
  comparisonMatrix: ApproachComparisonRow[];
}

export const CANONICAL_PROBLEM_APPROACHES: Record<string, ProblemCanonicalData> = {
  'merge-intervals': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force Graph / Overlap Check',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(N)',
        intuition: 'Treat each interval as a node in an undirected graph where an edge exists if intervals overlap, then compute connected components.',
        pros: ['Conceptually models arbitrary disjoint intervals without ordering'],
        cons: ['Quadratic time complexity causes TLE on large constraints (N >= 10,000)'],
        pseudoCodeOrGuide: 'for i in range(n): for j in range(i+1, n): if overlaps(i, j): merge(i, j)',
        executableCode: `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
n = len(intervals)
merged = []
visited = [False] * n

for i in range(n):
    if visited[i]:
        continue
    cur = list(intervals[i])
    for j in range(i + 1, n):
        if not visited[j]:
            other = intervals[j]
            if max(cur[0], other[0]) <= min(cur[1], other[1]):
                cur = [min(cur[0], other[0]), max(cur[1], other[1])]
                visited[j] = True
    merged.append(cur)`
      },
      {
        approachNumber: 2,
        title: 'Sorting with Greedy Linear Merge (Optimal Standard)',
        paradigm: 'TWO_POINTER',
        isUserApproach: true,
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(1) auxiliary',
        intuition: 'Sort intervals by their start time. Once sorted, contiguous overlapping intervals always appear adjacent. Traverse sequentially and extend merged[-1].end.',
        pros: ['Optimal asymptotic complexity', 'In-place sorting with O(1) auxiliary memory', 'Industry standard'],
        cons: ['Requires initial sorting step'],
        pseudoCodeOrGuide: 'intervals.sort(key=lambda x: x[0]); for cur in intervals: if cur.start <= prev.end: prev.end = max(...) else: merged.append(cur)',
        executableCode: `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
intervals.sort(key=lambda x: x[0])
merged = [intervals[0]]

for i in range(1, len(intervals)):
    curr = intervals[i]
    prev = merged[-1]
    if curr[0] <= prev[1]:
        prev[1] = max(prev[1], curr[1])
    else:
        merged.append(curr)`
      },
      {
        approachNumber: 3,
        title: 'Sweep-Line / Difference Array (Coordinate Compression)',
        paradigm: 'OPTIMAL',
        isUserApproach: false,
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N)',
        intuition: 'Mark +1 at interval start and -1 at interval end on a sweep-line timeline, accumulating prefix sums to find continuous non-zero coverage.',
        pros: ['Very powerful for continuous interval coverage queries'],
        cons: ['Requires extra memory for endpoint events and coordinate indexing'],
        pseudoCodeOrGuide: 'events = [(start, +1), (end, -1)]; sort(events); prefix_sum = 0; ...',
        executableCode: `intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]
events = []
for start, end in intervals:
    events.append((start, -1))
    events.append((end, 1))
events.sort()

merged = []
active = 0
start_time = None
for time, typ in events:
    if typ == -1:
        if active == 0:
            start_time = time
        active += 1
    else:
        active -= 1
        if active == 0:
            merged.append([start_time, time])`
      }
    ],
    comparisonMatrix: [
      { approach: 'Brute Force Graph', time: 'O(N^2)', space: 'O(N)', suitability: 'Small constraints (N <= 100)' },
      { approach: 'Sorting + Greedy (Optimal)', time: 'O(N log N)', space: 'O(1)', suitability: 'Industry standard for all general input' },
      { approach: 'Sweep-Line Events', time: 'O(N log N)', space: 'O(N)', suitability: 'When event start/end queries are streamed' }
    ]
  },
  'trapping-rain-water': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force Scanning',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        intuition: 'For each bar, scan left to find the maximum height on the left, and scan right to find the maximum on the right. Trapped water is min(left_max, right_max) - height.',
        pros: ['No auxiliary memory needed'],
        cons: ['O(N^2) quadratic runtime causes TLE on large arrays'],
        pseudoCodeOrGuide: 'for i in range(n): left_max = max(height[:i+1]); right_max = max(height[i:]); water += min(...) - height[i]',
        executableCode: `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
n = len(height)
water = 0
for i in range(1, n - 1):
    left_max = max(height[:i+1])
    right_max = max(height[i:])
    water += min(left_max, right_max) - height[i]`
      },
      {
        approachNumber: 2,
        title: 'Prefix & Suffix Dynamic Programming',
        paradigm: 'DYNAMIC_PROGRAMMING',
        isUserApproach: false,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        intuition: 'Precompute left_max[i] in a forward pass and right_max[i] in a backward pass, then compute trapped water in a final linear scan.',
        pros: ['Linear O(N) runtime', 'Simple and intuitive logic'],
        cons: ['O(N) extra memory required for prefix and suffix arrays'],
        pseudoCodeOrGuide: 'left_max = [...]; right_max = [...]; for i in range(n): water += min(left_max[i], right_max[i]) - height[i]',
        executableCode: `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
n = len(height)
left_max = [0] * n
right_max = [0] * n
left_max[0] = height[0]
for i in range(1, n):
    left_max[i] = max(left_max[i - 1], height[i])
right_max[n - 1] = height[n - 1]
for i in range(n - 2, -1, -1):
    right_max[i] = max(right_max[i + 1], height[i])
water = 0
for i in range(n):
    water += min(left_max[i], right_max[i]) - height[i]`
      },
      {
        approachNumber: 3,
        title: 'Two Pointers (Most Optimal)',
        paradigm: 'TWO_POINTER',
        isUserApproach: true,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        intuition: 'Maintain left and right pointers moving inward. Water capacity is determined by the shorter boundary; process the smaller pointer and increment inward.',
        pros: ['Optimal linear O(N) runtime', 'O(1) constant auxiliary space', 'No precomputation passes'],
        cons: ['Requires careful pointer update invariant handling'],
        pseudoCodeOrGuide: 'while left < right: if height[left] < height[right]: update left_max, left += 1 else: update right_max, right -= 1',
        executableCode: `height = [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]
left = 0
right = len(height) - 1
left_max = 0
right_max = 0
water = 0

while left < right:
    if height[left] < height[right]:
        if height[left] >= left_max:
            left_max = height[left]
        else:
            water += left_max - height[left]
        left += 1
    else:
        if height[right] >= right_max:
            right_max = height[right]
        else:
            water += right_max - height[right]
        right -= 1`
      }
    ],
    comparisonMatrix: [
      { approach: 'Brute Force', time: 'O(N^2)', space: 'O(1)', suitability: 'Small arrays (N <= 500)' },
      { approach: 'Prefix/Suffix DP', time: 'O(N)', space: 'O(N)', suitability: 'Clear interview whiteboard explanation' },
      { approach: 'Two Pointers (Optimal)', time: 'O(N)', space: 'O(1)', suitability: 'Production standard, optimal time & space' }
    ]
  },
  'two-sum-optimal': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force Nested Loops',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        intuition: 'Examine every possible pair of elements with two nested loops to check if their sum equals target.',
        pros: ['Zero additional memory allocated', 'Easy to understand'],
        cons: ['Quadratic time complexity causes TLE on large arrays'],
        pseudoCodeOrGuide: 'for i in range(n): for j in range(i+1, n): if nums[i] + nums[j] == target: return [i, j]',
        executableCode: `nums = [2, 7, 11, 15]
target = 9
result = []
n = len(nums)
for i in range(n):
    for j in range(i + 1, n):
        if nums[i] + nums[j] == target:
            result = [i, j]
            break`
      },
      {
        approachNumber: 2,
        title: 'Sorting with Two Pointers',
        paradigm: 'TWO_POINTER',
        isUserApproach: false,
        timeComplexity: 'O(N log N)',
        spaceComplexity: 'O(N)',
        intuition: 'Store pairs of (val, index), sort by value, and use two pointers from both ends to find target sum.',
        pros: ['Better than brute force, no hash collisions'],
        cons: ['Requires O(N) space to preserve original indices, slower than hash map'],
        pseudoCodeOrGuide: 'pairs.sort(); while left < right: if sum == target: return ...',
        executableCode: `nums = [2, 7, 11, 15]
target = 9
indexed = sorted([(val, idx) for idx, val in enumerate(nums)])
left = 0
right = len(nums) - 1
result = []

while left < right:
    curr_sum = indexed[left][0] + indexed[right][0]
    if curr_sum == target:
        result = [indexed[left][1], indexed[right][1]]
        break
    elif curr_sum < target:
        left += 1
    else:
        right -= 1`
      },
      {
        approachNumber: 3,
        title: 'Single-Pass Hash Map (Optimal)',
        paradigm: 'HASHING',
        isUserApproach: true,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        intuition: 'Iterate through the array once while inserting elements into a hash table. Before inserting, check if (target - num) is already in the table.',
        pros: ['Optimal linear O(N) time', 'Single pass through input'],
        cons: ['O(N) auxiliary space for hash table'],
        pseudoCodeOrGuide: 'seen = {}; for i, x in enumerate(nums): if target - x in seen: return [seen[target - x], i]; seen[x] = i',
        executableCode: `nums = [2, 7, 11, 15]
target = 9
seen = {}
result = []

for i, num in enumerate(nums):
    complement = target - num
    if complement in seen:
        result = [seen[complement], i]
        break
    seen[num] = i`
      }
    ],
    comparisonMatrix: [
      { approach: 'Brute Force', time: 'O(N^2)', space: 'O(1)', suitability: 'Small arrays (N <= 100)' },
      { approach: 'Two Pointers (Sorted)', time: 'O(N log N)', space: 'O(N)', suitability: 'When inputs are pre-sorted' },
      { approach: 'Single-Pass Hash Map', time: 'O(N)', space: 'O(N)', suitability: 'Industry standard, optimal runtime' }
    ]
  },
  'longest-substring-without-repeating': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force Substring Checking',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^3)',
        spaceComplexity: 'O(min(N, M))',
        intuition: 'Check all possible substrings one by one and verify whether all characters in each substring are distinct.',
        pros: ['Straightforward logic'],
        cons: ['Cubic complexity, highly inefficient'],
        pseudoCodeOrGuide: 'for i in range(n): for j in range(i+1, n+1): if all_unique(s[i:j]): ans = max(...)',
        executableCode: `s = "abcabcbb"
n = len(s)
max_len = 0
for i in range(n):
    seen = set()
    for j in range(i, n):
        if s[j] in seen:
            break
        seen.add(s[j])
        max_len = max(max_len, j - i + 1)`
      },
      {
        approachNumber: 2,
        title: 'Sliding Window with Hash Map (Optimal)',
        paradigm: 'OPTIMAL',
        isUserApproach: true,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(min(N, M))',
        intuition: 'Store the last seen index of each character in a map. When duplicate is found, directly jump the left pointer to last_index + 1.',
        pros: ['Guaranteed single pass strictly O(N)', 'Optimal performance'],
        cons: ['Slightly more state tracking with last seen indices'],
        pseudoCodeOrGuide: 'last = {}; left = 0; ans = 0; for right, c in enumerate(s): if c in last and last[c] >= left: left = last[c] + 1; last[c] = right; ans = max(ans, right - left + 1)',
        executableCode: `s = "abcabcbb"
char_index = {}
left = 0
max_len = 0

for right, ch in enumerate(s):
    if ch in char_index and char_index[ch] >= left:
        left = char_index[ch] + 1
    char_index[ch] = right
    max_len = max(max_len, right - left + 1)`
      }
    ],
    comparisonMatrix: [
      { approach: 'Brute Force', time: 'O(N^3)', space: 'O(M)', suitability: 'Small strings (N <= 50)' },
      { approach: 'Sliding Window (Optimal)', time: 'O(N)', space: 'O(M)', suitability: 'High performance production code' }
    ]
  },
  'container-with-most-water': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force Pair Checking',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(1)',
        intuition: 'Evaluate the water area between every possible pair of lines and maintain the maximum area found.',
        pros: ['Simple conceptually'],
        cons: ['O(N^2) quadratic runtime causes TLE on large arrays'],
        pseudoCodeOrGuide: 'for i in range(n): for j in range(i+1, n): area = (j - i) * min(h[i], h[j])',
        executableCode: `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
n = len(height)
max_water = 0
for i in range(n):
    for j in range(i + 1, n):
        w = j - i
        h = min(height[i], height[j])
        max_water = max(max_water, w * h)`
      },
      {
        approachNumber: 2,
        title: 'Two Pointers Greedily Inward (Optimal)',
        paradigm: 'TWO_POINTER',
        isUserApproach: true,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(1)',
        intuition: 'Place pointers at both ends. Area is constrained by the shorter line. Move the shorter line inward because moving the taller line can never produce a larger area.',
        pros: ['Optimal linear O(N) time', 'O(1) constant auxiliary space'],
        cons: ['Requires formal proof of greedy pointer invariant'],
        pseudoCodeOrGuide: 'left = 0, right = n-1; while left < right: max_area = max(max_area, (right-left)*min(h[left], h[right])); if h[left] < h[right]: left += 1 else: right -= 1',
        executableCode: `height = [1, 8, 6, 2, 5, 4, 8, 3, 7]
left = 0
right = len(height) - 1
max_water = 0

while left < right:
    width = right - left
    curr_water = min(height[left], height[right]) * width
    max_water = max(max_water, curr_water)
    if height[left] < height[right]:
        left += 1
    else:
        right -= 1`
      }
    ],
    comparisonMatrix: [
      { approach: 'Brute Force', time: 'O(N^2)', space: 'O(1)', suitability: 'Small arrays (N <= 200)' },
      { approach: 'Two Pointers (Optimal)', time: 'O(N)', space: 'O(1)', suitability: 'Optimal standard for all input sizes' }
    ]
  },
  'valid-parentheses': {
    solutionApproaches: [
      {
        approachNumber: 1,
        title: 'Brute Force String Replacement',
        paradigm: 'BRUTE_FORCE',
        isUserApproach: false,
        timeComplexity: 'O(N^2)',
        spaceComplexity: 'O(N)',
        intuition: 'Repeatedly eliminate adjacent matching pairs "()", "{}", "[]" from the string until no pairs can be removed.',
        pros: ['No complex data structure needed'],
        cons: ['String reallocation and repeated scans cause O(N^2) complexity'],
        pseudoCodeOrGuide: 'while "()" in s or "{}" in s or "[]" in s: s = s.replace(...) return s == ""',
        executableCode: `s = "()[]{}"
while "()" in s or "{}" in s or "[]" in s:
    s = s.replace("()", "").replace("{}", "").replace("[]", "")
is_valid = (s == "")`
      },
      {
        approachNumber: 2,
        title: 'Stack with Hash Map Lookup (Optimal)',
        paradigm: 'OPTIMAL',
        isUserApproach: true,
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        intuition: 'Push opening brackets onto a stack. When a closing bracket is found, pop from the stack and verify it matches the expected opening partner.',
        pros: ['Optimal linear O(N) runtime', 'Single pass', 'Clean error handling'],
        cons: ['O(N) stack auxiliary memory for worst-case all open brackets'],
        pseudoCodeOrGuide: 'stack = []; pair = {")": "(", "}": "{", "]": "["}; for c in s: if c in pair: if not stack or stack.pop() != pair[c]: return False else: stack.append(c); return not stack',
        executableCode: `s = "()[]{}"
stack = []
pairs = {")": "(", "}": "{", "]": "["}
is_valid = True

for ch in s:
    if ch in pairs:
        if not stack or stack[-1] != pairs[ch]:
            is_valid = False
            break
        stack.pop()
    else:
        stack.append(ch)

if stack:
    is_valid = False`
      }
    ],
    comparisonMatrix: [
      { approach: 'String Replacement', time: 'O(N^2)', space: 'O(N)', suitability: 'Toy examples only' },
      { approach: 'LIFO Stack (Optimal)', time: 'O(N)', space: 'O(N)', suitability: 'Industry standard parser' }
    ]
  }
};

/**
 * Returns canonical approaches for a problem by checking its slug or title against known problems.
 */
export function getCanonicalApproaches(identifier: string): ProblemCanonicalData | null {
  const cleanId = (identifier || '').toLowerCase().trim().replace(/\s+/g, '-');
  for (const [key, data] of Object.entries(CANONICAL_PROBLEM_APPROACHES)) {
    if (cleanId.includes(key) || key.includes(cleanId)) {
      return {
        solutionApproaches: JSON.parse(JSON.stringify(data.solutionApproaches)),
        comparisonMatrix: JSON.parse(JSON.stringify(data.comparisonMatrix))
      };
    }
  }
  return null;
}
