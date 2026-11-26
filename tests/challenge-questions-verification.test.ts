import { describe, it, expect } from 'vitest';
import { spawnSync } from 'child_process';
import { allChallengeProblems } from '../apps/api/src/scripts/data/challenge-problems.data.js';

describe('Ultimate Programming Challenge: 41 Problems End-to-End Verification Suite', () => {
  it('contains exactly 41 verified problem definitions', () => {
    expect(allChallengeProblems).toHaveLength(41);
  });

  it('guarantees unique slugs and valid metadata schema across all problems', () => {
    const slugs = new Set<string>();
    for (const p of allChallengeProblems) {
      expect(slugs.has(p.slug)).toBe(false);
      slugs.add(p.slug);

      expect(p.title).toBeTruthy();
      expect(['EASY', 'MEDIUM', 'HARD']).toContain(p.difficulty);
      expect(p.tags.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(20);
      expect(p.starterCode.javascript.length).toBeGreaterThan(10);
      expect(p.testCases.length).toBeGreaterThan(0);
      expect(p.testCases.some((tc) => tc.isPublic)).toBe(true);
    }
  });

  describe('Deterministic Reference Solution Test Case Execution', () => {
    for (const problem of allChallengeProblems) {
      describe(`Problem: ${problem.title} (${problem.slug})`, () => {
        for (const tc of problem.testCases) {
          it(`passes test case ${tc.id} (public=${tc.isPublic}, edge=${tc.isEdgeCase})`, () => {
            const runner = spawnSync('node', ['-e', problem.referenceSolution.javascript], {
              input: tc.input,
              encoding: 'utf-8',
              timeout: 4000
            });

            if (runner.error) {
              throw new Error(`Execution error on ${problem.slug} [${tc.id}]: ${runner.error.message}`);
            }

            const stderr = (runner.stderr || '').trim();
            if (runner.status !== 0) {
              throw new Error(
                `Non-zero exit code (${runner.status}) on ${problem.slug} [${tc.id}]. Stderr: ${stderr}`
              );
            }

            const actualOutput = (runner.stdout || '').trim().replace(/\r\n/g, '\n');
            const expectedOutput = tc.expectedOutput.trim().replace(/\r\n/g, '\n');

            expect(actualOutput).toBe(expectedOutput);
          });
        }
      });
    }
  });
});
