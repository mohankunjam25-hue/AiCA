import { describe, it, expect } from 'vitest';
import { computeAutoLayout } from '../apps/web/src/components/flowchart/utils/flowchart-auto-layout';
import { Node, Edge } from '@xyflow/react';

describe('Flowchart Auto-Layout Engine (DAG Beautifier)', () => {
  it('handles empty or single node gracefully', () => {
    expect(computeAutoLayout([], [])).toEqual([]);

    const singleNode: Node[] = [
      { id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: {} },
    ];
    const layout = computeAutoLayout(singleNode, []);
    expect(layout.length).toBe(1);
    expect(layout[0].position.y).toBe(60);
    expect(layout[0].position.x).toBe(450);
  });

  it('layers a linear pipeline top-to-bottom with increasing Y coordinates', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 99, y: 88 }, data: {} },
      { id: 'input', type: 'input', position: { x: 50, y: 20 }, data: {} },
      { id: 'proc', type: 'process', position: { x: 10, y: 10 }, data: {} },
      { id: 'out', type: 'output', position: { x: 30, y: 40 }, data: {} },
      { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'input' },
      { id: 'e2', source: 'input', target: 'proc' },
      { id: 'e3', source: 'proc', target: 'out' },
      { id: 'e4', source: 'out', target: 'end' },
    ];

    const result = computeAutoLayout(nodes, edges, {
      centerX: 500,
      startY: 50,
      verticalSpacing: 100,
    });

    const nodePos = new Map(result.map((n) => [n.id, n.position]));
    expect(nodePos.get('start')?.y).toBe(50);
    expect(nodePos.get('input')?.y).toBe(150);
    expect(nodePos.get('proc')?.y).toBe(250);
    expect(nodePos.get('out')?.y).toBe(350);
    expect(nodePos.get('end')?.y).toBe(450);

    // All linear nodes centered horizontally at centerX
    for (const n of result) {
      expect(n.position.x).toBe(500);
    }
  });

  it('correctly branches decision paths (FALSE on left, TRUE on right)', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'decision', type: 'decision', position: { x: 0, y: 0 }, data: {} },
      { id: 'left_false', type: 'process', position: { x: 0, y: 0 }, data: {} },
      { id: 'right_true', type: 'process', position: { x: 0, y: 0 }, data: {} },
      { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'decision' },
      { id: 'e_false', source: 'decision', target: 'left_false', label: 'FALSE', sourceHandle: 'false' },
      { id: 'e_true', source: 'decision', target: 'right_true', label: 'TRUE', sourceHandle: 'true' },
      { id: 'e_f_end', source: 'left_false', target: 'end' },
      { id: 'e_t_end', source: 'right_true', target: 'end' },
    ];

    const result = computeAutoLayout(nodes, edges, {
      centerX: 400,
      horizontalSpacing: 200,
      verticalSpacing: 120,
    });

    const nodePos = new Map(result.map((n) => [n.id, n.position]));
    const falseX = nodePos.get('left_false')?.x!;
    const trueX = nodePos.get('right_true')?.x!;

    expect(falseX).toBeLessThan(trueX);
    expect(nodePos.get('end')?.y).toBeGreaterThan(nodePos.get('left_false')?.y!);
    expect(nodePos.get('end')?.y).toBeGreaterThan(nodePos.get('right_true')?.y!);
  });

  it('tolerates loop cycles without recursion errors and preserves loopback structure', () => {
    const nodes: Node[] = [
      { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: {} },
      { id: 'init', type: 'process', position: { x: 0, y: 0 }, data: {} },
      { id: 'loop_check', type: 'decision', position: { x: 0, y: 0 }, data: {} },
      { id: 'body', type: 'process', position: { x: 0, y: 0 }, data: {} },
      { id: 'end', type: 'end', position: { x: 0, y: 0 }, data: {} },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'start', target: 'init' },
      { id: 'e2', source: 'init', target: 'loop_check' },
      { id: 'e_true', source: 'loop_check', target: 'body', label: 'TRUE', sourceHandle: 'true' },
      { id: 'e_back', source: 'body', target: 'loop_check' }, // Cycle back-edge
      { id: 'e_false', source: 'loop_check', target: 'end', label: 'FALSE', sourceHandle: 'false' },
    ];

    expect(() => computeAutoLayout(nodes, edges)).not.toThrow();

    const result = computeAutoLayout(nodes, edges);
    const nodePos = new Map(result.map((n) => [n.id, n.position]));

    expect(nodePos.get('start')?.y).toBeLessThan(nodePos.get('init')?.y!);
    expect(nodePos.get('init')?.y).toBeLessThan(nodePos.get('loop_check')?.y!);
    expect(nodePos.get('end')?.y).toBeGreaterThan(nodePos.get('loop_check')?.y!);
  });
});
