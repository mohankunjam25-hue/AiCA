import { Router } from 'express';
import { FlowchartController } from '../controllers/flowchart.controller.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:problemId', optionalAuth, FlowchartController.getFlowchart);
router.put('/:problemId', authenticateToken, FlowchartController.saveFlowchart);
router.post('/validate', FlowchartController.validateGraph);
router.post('/execute', optionalAuth, FlowchartController.executeGraph);

export default router;
