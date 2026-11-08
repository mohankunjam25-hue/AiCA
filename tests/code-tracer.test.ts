import { describe, it, expect } from 'vitest';
import { CodeTracerService } from '../apps/api/src/services/code-tracer.service.js';
import { DataStructureClassifier } from '../packages/shared/src/utils/data-structure-classifier.js';

describe('Zero-AI Code Tracer & Data Structure Classifier', () => {
  it('should deterministically trace Python execution without any AI', async () => {
    const pythonCode = `
adj = {"A": ["B", "C"], "B": ["D"], "C": ["D"], "D": []}
queue = ["A"]
visited = {"A"}
order = []

while queue:
    curr = queue.pop(0)
    order.append(curr)
    for neighbor in adj[curr]:
        if neighbor not in visited:
            visited.add(neighbor)
            queue.append(neighbor)
`;

    const result = await CodeTracerService.traceExecution(pythonCode, 'python');
    expect(result.success).toBe(true);
    expect(result.steps.length).toBeGreaterThan(10);

    // Verify first step captures initial variables
    const stepWithQueue = result.steps.find((s) => s.locals.queue !== undefined);
    expect(stepWithQueue).toBeDefined();

    // Test DataStructureClassifier
    const detection = DataStructureClassifier.detectPrimaryStructure(result.steps);
    expect(detection.structureType).toBe('GRAPH');
    expect(detection.primaryVarName).toBe('adj');

    // Test Normalized Frames
    const normalized = DataStructureClassifier.normalizeTrace(result.steps, 'python');
    expect(normalized.length).toBe(result.steps.length);
    expect(normalized[0].visualPayload.kind).toBe('GRAPH');
  });

  it('should deterministically trace Linear Array and detect pointers', async () => {
    const pythonCode = `
arr = [2, 5, 8, 12, 16, 23, 38]
target = 23
left = 0
right = len(arr) - 1
found = -1

while left <= right:
    mid = (left + right) // 2
    if arr[mid] == target:
        found = mid
        break
    elif arr[mid] < target:
        left = mid + 1
    else:
        right = mid - 1
`;

    const result = await CodeTracerService.traceExecution(pythonCode, 'python');
    expect(result.success).toBe(true);
    expect(result.steps.length).toBeGreaterThan(5);

    const detection = DataStructureClassifier.detectPrimaryStructure(result.steps);
    expect(detection.structureType).toBe('ARRAY');
    expect(detection.primaryVarName).toBe('arr');

    const normalized = DataStructureClassifier.normalizeTrace(result.steps, 'python');
    expect(normalized[0].visualPayload.kind).toBe('ARRAY');

    // Check that pointers (L, R, MID) are detected
    const stepWithMid = normalized.find((s) => s.visualPayload.pointers?.MID !== undefined);
    expect(stepWithMid).toBeDefined();
  });

  it('should auto-invoke student function when defined without top-level driver call', async () => {
    const pythonCode = `
def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for i in range(1, len(intervals)):
        curr = intervals[i]
        prev = merged[-1]
        if curr[0] <= prev[1]:
            prev[1] = max(prev[1], curr[1])
        else:
            merged.append(curr)
    return merged
`;

    const result = await CodeTracerService.traceExecution(pythonCode, 'python', '[[1, 3], [2, 6], [8, 10], [15, 18]]');
    expect(result.success).toBe(true);
    expect(result.steps.length).toBeGreaterThan(10);

    const stepWithMerged = result.steps.find((s) => s.locals.merged !== undefined);
    expect(stepWithMerged).toBeDefined();

    const normalized = DataStructureClassifier.normalizeTrace(result.steps, 'python');
    expect(normalized.length).toBe(result.steps.length);
    expect(normalized[normalized.length - 1].visualPayload.kind).toBe('ARRAY');
  });
});
