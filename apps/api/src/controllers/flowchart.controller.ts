import { Request, Response } from 'express';
import {
  validateFlowchart,
  executeFlowchart,
  FlowchartGraph,
  createErrorResponse,
  createSuccessResponse,
} from '@aica/shared';
import { FlowchartModel } from '../models/mongodb/flowchart.model.js';
import { ProblemModel } from '../models/mongodb/problem.model.js';

export class FlowchartController {
  /**
   * GET /api/v1/flowcharts/:problemId
   * Retrieve saved user flowchart for a problem.
   */
  static async getFlowchart(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const userId = req.user?.id || 'anonymous';

      const flowchart = await FlowchartModel.findOne({ problemId, userId });
      return res.status(200).json(
        createSuccessResponse(flowchart ? flowchart.toJSON() : null)
      );
    } catch (err: any) {
      console.error('[FlowchartController] getFlowchart error:', err);
      return res
        .status(500)
        .json(createErrorResponse('INTERNAL_ERROR', err.message));
    }
  }

  /**
   * PUT /api/v1/flowcharts/:problemId
   * Save or update flowchart graph data for a problem.
   */
  static async saveFlowchart(req: Request, res: Response) {
    try {
      const { problemId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json(createErrorResponse('UNAUTHORIZED', 'Authentication required to save flowchart'));
      }

      const { nodes, edges, viewport, version = 1 } = req.body;

      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return res
          .status(400)
          .json(
            createErrorResponse(
              'INVALID_REQUEST',
              'Nodes and edges arrays are required.'
            )
          );
      }

      const updated = await FlowchartModel.findOneAndUpdate(
        { problemId, userId },
        {
          problemId,
          userId,
          nodes,
          edges,
          viewport: viewport || { x: 0, y: 0, zoom: 1 },
          version,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return res.status(200).json(createSuccessResponse(updated.toJSON()));
    } catch (err: any) {
      console.error('[FlowchartController] saveFlowchart error:', err);
      return res
        .status(500)
        .json(createErrorResponse('INTERNAL_ERROR', err.message));
    }
  }

  /**
   * POST /api/v1/flowcharts/validate
   * Validate flowchart topology, connections, and expression syntax.
   */
  static async validateGraph(req: Request, res: Response) {
    try {
      const { graph } = req.body as { graph: FlowchartGraph };
      if (!graph) {
        return res
          .status(400)
          .json(createErrorResponse('INVALID_REQUEST', 'Graph payload is required'));
      }

      const result = validateFlowchart(graph);
      return res.status(200).json(createSuccessResponse(result));
    } catch (err: any) {
      console.error('[FlowchartController] validateGraph error:', err);
      return res
        .status(500)
        .json(createErrorResponse('INTERNAL_ERROR', err.message));
    }
  }

  /**
   * POST /api/v1/flowcharts/execute
   * Execute flowchart graph either with custom input or against problem test cases.
   */
  static async executeGraph(req: Request, res: Response) {
    try {
      const { graph, input = '', problemId, mode = 'custom' } = req.body as {
        graph: FlowchartGraph;
        input?: string;
        problemId?: string;
        mode?: 'custom' | 'testcases';
      };

      if (!graph) {
        return res
          .status(400)
          .json(createErrorResponse('INVALID_REQUEST', 'Graph payload is required'));
      }

      // If mode is testcases and problemId is provided, evaluate against problem testcases
      if (mode === 'testcases' && problemId) {
        const problem = await ProblemModel.findOne({
          $or: [{ slug: problemId }, { _id: problemId }],
        });

        if (!problem) {
          return res
            .status(404)
            .json(createErrorResponse('NOT_FOUND', `Problem "${problemId}" not found`));
        }

        const testCases = problem.testCases || [];
        const results = [];
        let allPassed = true;

        for (let i = 0; i < testCases.length; i++) {
          const tc = testCases[i];
          const startTime = Date.now();
          const execRes = executeFlowchart(graph, tc.input);
          const duration = Date.now() - startTime;

          const isMatch =
            execRes.success &&
            execRes.output.trim() === tc.expectedOutput.trim();

          if (!isMatch) {
            allPassed = false;
          }

          if (tc.isPublic) {
            results.push({
              index: i + 1,
              isPublic: true,
              passed: isMatch,
              status: execRes.status,
              input: tc.input,
              expectedOutput: tc.expectedOutput,
              actualOutput: execRes.output,
              executionTimeMs: duration,
              error: execRes.error?.message,
              stepsCount: execRes.totalSteps,
            });
          } else {
            // NEVER reveal hidden testcase input or expected output to frontend
            results.push({
              index: i + 1,
              isPublic: false,
              passed: isMatch,
              status: execRes.status,
              executionTimeMs: duration,
              error: execRes.error?.message ? 'Execution error on hidden test case' : undefined,
              stepsCount: execRes.totalSteps,
            });
          }
        }

        return res.status(200).json(
          createSuccessResponse({
            allPassed,
            totalTestCases: testCases.length,
            passedTestCases: results.filter((r) => r.passed).length,
            testCaseResults: results,
          })
        );
      }

      // Custom input execution mode
      const result = executeFlowchart(graph, input);
      return res.status(200).json(createSuccessResponse(result));
    } catch (err: any) {
      console.error('[FlowchartController] executeGraph error:', err);
      return res
        .status(500)
        .json(createErrorResponse('INTERNAL_ERROR', err.message));
    }
  }
}
