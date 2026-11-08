import algorithmRoutes from './routes/algorithm.routes.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabases } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import problemRoutes from './routes/problem.routes.js';
import submissionRoutes from './routes/submission.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import comparisonRoutes from './routes/comparison.routes.js';
import problemProposalRoutes from './routes/problem-proposal.routes.js';
import practiceProblemRoutes from './routes/practice-problem.routes.js';
import developerRoutes from './routes/developer.routes.js';
import adminRoutes from './routes/admin.routes.js';
import tracerRoutes from './routes/tracer.routes.js';
import flowchartRoutes from './routes/flowchart.routes.js';
import { createSuccessResponse, createErrorResponse } from '@aica/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

// Security & Utility Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
  })
);

// Bulletproof CORS headers middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173'];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive in production for client frontends
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(
  morgan('dev', {
    skip: (req) => req.url === '/health' || req.url === '/api/v1/health'
  })
);
app.use(express.json({ limit: '64kb' })); // Max payload limit to prevent buffer overflow attacks
app.use(cookieParser());

// High-Performance HTTP Response Compression (gzip / deflate)
app.use(
  compression({
    level: 6, // Optimal balance between CPU usage and compression ratio
    threshold: 1024, // Skip compressing tiny micro-responses under 1 KB to save CPU cycles
    filter: (req, res) => {
      // ⚠️ Invariant: Never buffer or compress Server-Sent Events (SSE) streaming progress
      if (req.headers.accept === 'text/event-stream' || req.originalUrl?.includes('/status-stream')) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
);

// Healthcheck Routes (Root & /api/v1/health, supporting GET & HEAD for ultra-fast keep-alive pings)
const healthHandler = (_req: express.Request, res: express.Response) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json(
    createSuccessResponse({
      status: 'HEALTHY',
      service: 'aica-api-gateway',
      version: '2.0.0',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    })
  );
};
app.get('/health', healthHandler);
app.head('/health', healthHandler);
app.get('/api/v1/health', healthHandler);
app.head('/api/v1/health', healthHandler);

// Mount Domain API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/problems/practice', practiceProblemRoutes);
app.use('/api/v1/problems', problemRoutes);
app.use('/api/v1/problem-proposals', problemProposalRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/leaderboards', leaderboardRoutes);
app.use('/api/v1/comparisons', comparisonRoutes);
app.use('/api/v1/algorithms', algorithmRoutes);
app.use('/api/v1/developers', developerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/tracer', tracerRoutes);
app.use('/api/tracer', tracerRoutes);
app.use('/api/v1/flowcharts', flowchartRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json(createErrorResponse('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
});

// Centralized Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[GlobalErrorHandler]', err.stack || err.message);
  res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
});

// Start Server
// 1. Immediately bind to 0.0.0.0:$PORT so Render port scan succeeds instantly
app.listen(PORT, HOST, () => {
  console.log(`[AICA API Gateway] Server listening on http://${HOST}:${PORT}`);
  
  // 2. Initialize databases in background without blocking server port binding
  initializeDatabases().catch((err: any) => {
    console.warn('[AICA API Gateway] Background database initialization deferred:', err.message);
  });
});

