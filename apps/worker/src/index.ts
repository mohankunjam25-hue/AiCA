import 'dotenv/config';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sanitizeMongoUri } from '@aica/shared';
import { startSubmissionWorker } from './queue/submission.worker.js';
import { startAiAnalysisWorker } from './queue/ai-analysis.worker.js';
import { startProblemGenerationWorker } from './queue/problem-generation.worker.js';
import { startProblemValidationWorker } from './queue/problem-validation.worker.js';
import { startAuditReconcilerWorker } from './queue/audit-reconciler.worker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

async function main() {
  console.log('[Worker Daemon] Initializing AI Code Evolution Lab Execution Worker...');

  const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI);
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('[Worker Daemon] Connected to MongoDB document store.');
  } catch (err: any) {
    console.warn('[Worker Daemon] MongoDB deferred/warning:', err.message);
  }

  const worker = startSubmissionWorker();
  const aiWorker = startAiAnalysisWorker();
  const problemGenWorker = startProblemGenerationWorker();
  const problemValWorker = startProblemValidationWorker();
  const auditWorker = startAuditReconcilerWorker();

  console.log('[Worker Daemon] All BullMQ workers (submissions, ai-analysis, problem-generation, differential-validation, audit-reconciler) are active.');

  process.on('SIGTERM', async () => {
    console.log('[Worker Daemon] Shutting down gracefully...');
    await Promise.all([
      worker.close(),
      aiWorker.close(),
      problemGenWorker.close(),
      problemValWorker.close(),
      auditWorker.close()
    ]);
    await mongoose.disconnect();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('[Worker Daemon] Fatal startup error:', err);
  process.exit(1);
});
