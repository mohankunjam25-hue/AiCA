import { Node, Edge } from '@xyflow/react';

export interface AutoLayoutOptions {
  horizontalSpacing?: number;
  verticalSpacing?: number;
  centerX?: number;
  startY?: number;
}

/**
 * Deterministic Hierarchical Topological DAG Layout for Flowchart diagrams.
 *
 * Automatically organizes scattered nodes into a presentation-grade tree:
 * 1. Identifies Start node and detects cycle / loopback edges via DFS.
 * 2. Computes topological depth ranks along forward execution paths.
 * 3. Sorts branches horizontally (FALSE to the left, TRUE to the right).
 * 4. Centers layers around centerX for symmetrical aesthetic balance.
 */
export function computeAutoLayout(
  nodes: Node[],
  edges: Edge[],
  options: AutoLayoutOptions = {}
): Node[] {
  if (!nodes || nodes.length === 0) return nodes;

  const {
    horizontalSpacing = 240,
    verticalSpacing = 135,
    centerX = 450,
    startY = 60,
  } = options;

  const nodeMap = new Map<string, Node>(nodes.map((n) => [n.id, n]));
  const startNode = nodes.find((n) => n.type === 'start') || nodes[0];

  // 1. Detect loopback / back-edges using DFS from startNode
  const backEdges = new Set<string>();
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function detectCycles(u: string) {
    visited.add(u);
    recStack.add(u);

    const outEdges = edges.filter(
      (e) => e.source === u && nodeMap.has(e.target)
    );
    for (const e of outEdges) {
      const key = e.id || `${e.source}->${e.target}`;
      if (recStack.has(e.target)) {
        backEdges.add(key);
      } else if (!visited.has(e.target)) {
        detectCycles(e.target);
      }
    }
    recStack.delete(u);
  }

  detectCycles(startNode.id);

  // 2. Build DAG with forward edges only
  const forwardEdges = edges.filter((e) => {
    const key = e.id || `${e.source}->${e.target}`;
    return !backEdges.has(key);
  });

  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, Edge[]>(nodes.map((n) => [n.id, []]));

  for (const e of forwardEdges) {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      adj.get(e.source)!.push(e);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  }

  // 3. Compute topological ranks (longest path layering)
  const ranks = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const queue: string[] = [startNode.id];
  ranks.set(startNode.id, 0);

  // Add any other nodes with inDegree 0 that are not start
  for (const n of nodes) {
    if (n.id !== startNode.id && (inDegree.get(n.id) || 0) === 0) {
      queue.push(n.id);
    }
  }

  while (queue.length > 0) {
    const u = queue.shift()!;
    const uRank = ranks.get(u) || 0;

    for (const e of adj.get(u) || []) {
      const v = e.target;
      ranks.set(v, Math.max(ranks.get(v) || 0, uRank + 1));
      inDegree.set(v, inDegree.get(v)! - 1);
      if (inDegree.get(v)! <= 0) {
        queue.push(v);
      }
    }
  }

  // If End blocks are reachable, ensure they sit at or below the max rank
  const endNodes = nodes.filter((n) => n.type === 'end');
  const maxContentRank = Math.max(
    ...nodes.filter((n) => n.type !== 'end').map((n) => ranks.get(n.id) || 0),
    0
  );
  for (const endNode of endNodes) {
    const currRank = ranks.get(endNode.id) || 0;
    ranks.set(endNode.id, Math.max(currRank, maxContentRank + 1));
  }

  // 4. Group by rank layer
  const rankGroups = new Map<number, string[]>();
  for (const n of nodes) {
    const r = ranks.get(n.id) || 0;
    if (!rankGroups.has(r)) rankGroups.set(r, []);
    rankGroups.get(r)!.push(n.id);
  }

  // 5. Sort nodes in each rank layer horizontally:
  // - FALSE targets biased towards the left
  // - TRUE targets biased towards the right
  for (const [, group] of rankGroups.entries()) {
    group.sort((a, b) => {
      const edgeA = edges.find(
        (e) =>
          e.target === a && !backEdges.has(e.id || `${e.source}->${e.target}`)
      );
      const edgeB = edges.find(
        (e) =>
          e.target === b && !backEdges.has(e.id || `${e.source}->${e.target}`)
      );

      const scoreA =
        edgeA?.label === 'TRUE' || edgeA?.sourceHandle === 'true'
          ? 1
          : edgeA?.label === 'FALSE' || edgeA?.sourceHandle === 'false'
          ? -1
          : 0;

      const scoreB =
        edgeB?.label === 'TRUE' || edgeB?.sourceHandle === 'true'
          ? 1
          : edgeB?.label === 'FALSE' || edgeB?.sourceHandle === 'false'
          ? -1
          : 0;

      return scoreA - scoreB;
    });
  }

  // 6. Assign final (x, y) coordinates
  const positions = new Map<string, { x: number; y: number }>();
  for (const [r, group] of rankGroups.entries()) {
    const totalWidth = (group.length - 1) * horizontalSpacing;
    const startXOffset = centerX - totalWidth / 2;

    group.forEach((id, index) => {
      positions.set(id, {
        x: Math.round(startXOffset + index * horizontalSpacing),
        y: Math.round(startY + r * verticalSpacing),
      });
    });
  }

  return nodes.map((n) => ({
    ...n,
    position: positions.get(n.id) || n.position,
  }));
}
