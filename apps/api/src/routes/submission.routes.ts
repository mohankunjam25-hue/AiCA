import { Router } from 'express';
import {
  createSubmission,
  getSubmissionById,
  getEvaluationReport,
  getSubmissionAiAnalysis,
  retryAiAnalysis,
  getMySubmissions,
  getActivityHeatmap,
  runCustomCode,
  getProblemSolutions
} from '../controllers/submission.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';
import { submissionRateLimiter } from '../middleware/rate-limiter.middleware.js';
import { handleSubmissionStatusSSE } from '../middleware/sse.middleware.js';

const router = Router();

router.get('/problem/:problemId/solutions', optionalAuth, getProblemSolutions);
router.post('/run-custom', authenticateToken, submissionRateLimiter, runCustomCode);
router.post('/', optionalAuth, submissionRateLimiter, createSubmission);
router.get('/my', authenticateToken, getMySubmissions);
router.get('/activity-heatmap', authenticateToken, getActivityHeatmap);
router.get('/:id', optionalAuth, getSubmissionById);
router.get('/:id/status-stream', optionalAuth, handleSubmissionStatusSSE);
router.get('/:submissionId/report', optionalAuth, getEvaluationReport);
router.get('/:submissionId/ai-analysis', optionalAuth, getSubmissionAiAnalysis);
router.post('/:submissionId/retry-ai', authenticateToken, retryAiAnalysis);

export default router;
