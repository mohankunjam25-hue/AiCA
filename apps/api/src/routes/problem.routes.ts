import { Router } from 'express';
import {
  getProblems,
  getCatalogSummary,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getAdminProblems,
  getAdminProblemById
} from '../controllers/problem.controller.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public catalog and student endpoints
router.get('/', optionalAuth, getProblems);
router.get('/summary', optionalAuth, getCatalogSummary);

// Dedicated Admin / Instructor endpoints (must precede /:id)
router.get('/admin/all', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminProblems);
router.get('/admin/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminProblemById);

// Public problem detail (with optional auth so admins can preview unpublished problems)
router.get('/:id', optionalAuth, getProblemById);

// Admin / Instructor problem management
router.post('/', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), createProblem);
router.put('/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), updateProblem);
router.delete('/:id', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), deleteProblem);

export default router;
