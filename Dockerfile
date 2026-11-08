# Multi-stage production Dockerfile for AiCA Backend on Render (Bundled API + Worker + Redis)
FROM node:20-bookworm-slim

# Install system dependencies: Redis server, Python3, and G++ for execution sandbox
RUN apt-get update && apt-get install -y --no-install-recommends \
    redis-server \
    python3 \
    g++ \
    ca-certificates \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Enable corepack and activate pnpm matching project
RUN corepack enable && corepack prepare pnpm@12.14.0 --activate

WORKDIR /app

# Copy root and workspace package manifests for dependency layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/ai-engine/package.json ./packages/ai-engine/
COPY apps/api/package.json ./apps/api/
COPY apps/worker/package.json ./apps/worker/
COPY apps/web/package.json ./apps/web/

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy source code for packages and backend apps
COPY packages/shared ./packages/shared
COPY packages/ai-engine ./packages/ai-engine
COPY apps/api ./apps/api
COPY apps/worker ./apps/worker

# Compile shared libraries, API gateway, and worker daemon
RUN pnpm --filter @aica/shared build && \
    pnpm --filter @aica/ai-engine build && \
    pnpm --filter @aica/api build && \
    pnpm --filter @aica/worker build

# Copy and set permissions for entrypoint script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Default environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV REDIS_URL=redis://127.0.0.1:6379

EXPOSE 5000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
