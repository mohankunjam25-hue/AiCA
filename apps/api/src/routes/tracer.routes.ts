import { Router } from 'express';
import { TracerController } from '../controllers/tracer.controller.js';
import { submissionRateLimiter } from '../middleware/rate-limiter.middleware.js';

const router = Router();

router.post('/trace', submissionRateLimiter, TracerController.traceCode);

export default router;
