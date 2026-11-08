import { Request, Response } from 'express';
import { CodeTracerService } from '../services/code-tracer.service.js';
import { SupportedLanguage } from '@aica/shared';

export class TracerController {
  static async traceCode(req: Request, res: Response) {
    try {
      const { code, language = 'python', stdin = '' } = req.body;

      if (!code || typeof code !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Code string is required for tracer execution.'
        });
      }

      const result = await CodeTracerService.traceExecution(
        code,
        language as SupportedLanguage,
        stdin
      );

      if (!result.success && result.steps.length === 0) {
        return res.status(400).json({
          success: false,
          message: result.error || 'Failed to capture execution trace.',
          executionTimeMs: result.executionTimeMs
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          steps: result.steps,
          executionTimeMs: result.executionTimeMs,
          totalSteps: result.steps.length
        }
      });
    } catch (err: any) {
      console.error('[TracerController] Error executing trace:', err);
      return res.status(500).json({
        success: false,
        message: err.message || 'Internal error in execution tracer.'
      });
    }
  }
}
