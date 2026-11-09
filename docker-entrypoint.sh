#!/bin/bash
set -e

echo "=========================================================="
echo "🚀 Booting AiCA All-in-One Engine on Render..."
echo "=========================================================="

# 1. Start internal Redis server in daemonized mode
echo "[1/3] Starting internal Redis server on 127.0.0.1:6379..."
redis-server --daemonize yes --bind 127.0.0.1 --port 6379 --dir /tmp --pidfile /tmp/redis-server.pid --maxmemory 128mb --maxmemory-policy allkeys-lru --save ""

# Verify Redis is up and answering
for i in {1..10}; do
  if redis-cli -h 127.0.0.1 -p 6379 ping | grep -q "PONG"; then
    echo "✅ Internal Redis is healthy and ready (PONG)."
    break
  fi
  echo "Waiting for Redis to become available... ($i/10)"
  sleep 0.5
done

# 2. Start BullMQ background worker in the background
echo "[2/3] Starting BullMQ Worker Daemon..."
node apps/worker/dist/index.js &
WORKER_PID=$!
echo "✅ BullMQ Worker started with PID: $WORKER_PID"

# Trap SIGTERM and SIGINT to shut down gracefully when Render recycles container
cleanup() {
  echo "🛑 Received shutdown signal. Cleaning up processes..."
  kill -TERM "$WORKER_PID" 2>/dev/null || true
  redis-cli -h 127.0.0.1 -p 6379 shutdown nosave 2>/dev/null || true
  exit 0
}
trap cleanup SIGTERM SIGINT

# 3. Start Express REST API Gateway in the foreground (binds to $PORT for Render health checks)
echo "[3/3] Starting Express REST API Gateway on port ${PORT:-5000}..."
exec node apps/api/dist/index.js
