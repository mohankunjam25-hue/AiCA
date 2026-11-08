import { Router } from 'express';
import { TracerController } from '../controllers/tracer.controller.js';

const router = Router();

router.post('/trace', TracerController.traceCode);

export default router;
