export interface AdminOverviewData {
  totalStudents: number;
  totalPublishedProblems: number;
  totalPracticeProblems: number;
  pendingProposals: number;
  submissions24h: number;
  acceptanceRate24h: number;
  activeUsers24h: number;
}

export interface AdminTelemetryData {
  kernelSandboxStatus: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  cgroupMemoryLimitMb: number;
  avgKernelExecutionMs: number;
  queueBacklog: number;
  activeWorkers: number;
  redisPingMs: number;
  memoryUsageMb: number;
  systemUptimeSeconds: number;
  timestamp: string;
}

export interface AdminLiveSubmissionItem {
  id: string;
  problemId: string;
  problemTitle: string;
  username: string;
  language: string;
  verdict: string;
  executionTimeMs?: number;
  memoryUsedKb?: number;
  createdAt: string;
}
