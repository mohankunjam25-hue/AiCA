import { Router } from 'express';
import {
  getAdminOverview,
  getAdminTelemetry,
  getAdminLiveSubmissions,
  getAdminPendingProposals,
  flushSystemCache
} from '../controllers/admin-dashboard.controller.js';
import { authenticateToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Platform Overview & Operational Telemetry
router.get('/overview', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminOverview);
router.get('/telemetry', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminTelemetry);
router.get('/submissions/live', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminLiveSubmissions);
router.get('/proposals/pending', authenticateToken, requireRole('ADMIN', 'INSTRUCTOR'), getAdminPendingProposals);

// Emergency & Ops Controls
router.post('/system/flush-cache', authenticateToken, requireRole('ADMIN'), flushSystemCache);

export default router;
