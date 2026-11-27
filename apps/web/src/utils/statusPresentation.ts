/**
 * Utility functions for user-facing pipeline and security status presentation.
 * Prevents Information Disclosure (OWASP CWE-200) by shielding raw database ObjectIds,
 * background worker names, and third-party LLM engine details from public UI components.
 */

export interface PipelineStagePresentation {
  label: string;
  description: string;
}

export function formatPipelineStage(status?: string): PipelineStagePresentation {
  switch (status) {
    case 'QUEUED':
      return {
        label: 'In Queue',
        description: 'Waiting for an available test runner'
      };
    case 'COMPILING':
      return {
        label: 'Compiling',
        description: 'Compiling solution into binary executable'
      };
    case 'EXECUTING':
      return {
        label: 'Running Tests',
        description: 'Executing solution against test cases'
      };
    case 'ANALYZING_AI':
      return {
        label: 'Analyzing Quality',
        description: 'Reviewing code structure and quality'
      };
    case 'COMPLETED':
      return {
        label: 'Complete',
        description: 'Evaluation and scoring complete'
      };
    case 'FAILED':
      return {
        label: 'Failed',
        description: 'Execution or evaluation encountered an issue'
      };
    default:
      return {
        label: 'Evaluating',
        description: 'Processing solution'
      };
  }
}
