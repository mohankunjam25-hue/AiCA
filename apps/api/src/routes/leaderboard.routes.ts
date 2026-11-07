import { Router } from 'express';
import {
  getProblemLeaderboard,
  getGlobalLeaderboard,
  getUserSolvedProblems
} from '../controllers/leaderboard.controller.js';

const router = Router();

// Global platform rankings across all problems
router.get('/global', getGlobalLeaderboard);

// User solved problems dossier & metrics
router.get('/user/:userId/solved', getUserSolvedProblems);

// Problem-specific leaderboard
router.get('/problem/:problemId', getProblemLeaderboard);

export default router;
