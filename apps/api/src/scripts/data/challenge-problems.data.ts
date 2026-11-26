import { ProblemSeedDefinition, round3LogicProblems } from './round3-logic.data.js';
import { round2DebugProblems } from './round2-debug.data.js';
import { round1PredictProblems } from './round1-predict.data.js';

export type { ProblemSeedDefinition };
export { round3LogicProblems };
export { round2DebugProblems };
export { round1PredictProblems };

export const allChallengeProblems: ProblemSeedDefinition[] = [
  ...round3LogicProblems,
  ...round2DebugProblems,
  ...round1PredictProblems
];
