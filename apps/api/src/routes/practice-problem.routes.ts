import { Router } from 'express';
import {
  createPracticeProblem,
  getMyPracticeProblems,
  updatePracticeProblem,
  deletePracticeProblem,
  forkCatalogProblem,
  generateAIPracticeProblem
} from '../controllers/practice-problem.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All student practice problem operations require authentication
router.post('/', authenticateToken, createPracticeProblem);
router.get('/my-practice', authenticateToken, getMyPracticeProblems);
router.post('/ai-generate', authenticateToken, generateAIPracticeProblem);
router.post('/:id/fork', authenticateToken, forkCatalogProblem);
router.put('/:id', authenticateToken, updatePracticeProblem);
router.delete('/:id', authenticateToken, deletePracticeProblem);

export default router;
