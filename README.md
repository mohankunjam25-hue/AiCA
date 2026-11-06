# 🚀 AiCA: AI Code Evolution Lab & Hardware Evaluation Engine

[![Architecture](https://img.shields.io/badge/Architecture-6--Layer%20Microservices-blue.svg)](https://github.com/mohankunjam25-hue/AiCA)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB.svg?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933.svg?logo=nodedotjs)](https://nodejs.org/)
[![Turborepo](https://img.shields.io/badge/Monorepo-Turborepo-EF4444.svg?logo=turborepo)](https://turbo.build/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Cloud-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20DB-4169E1.svg?logo=postgresql)](https://neon.tech/)
[![Redis](https://img.shields.io/badge/Redis-Upstash%20BullMQ-DC382D.svg?logo=redis)](https://redis.io/)
[![Tests](https://img.shields.io/badge/Vitest-153%2F153%20Passed%20(100%25)-success.svg)](https://vitest.dev/)

---

## 📌 Project Purpose & Mission

**AiCA (AI Code Evolution Lab)** is a modern, high-throughput competitive coding and automated code evaluation platform. It bridges the gap between classic algorithmic online judges (like LeetCode, Codeforces, and HackerRank) and modern generative AI diagnostics.

Unlike traditional platforms that run slow single-test container reboots or leak private test data, AiCA implements:
1. **Linux Kernel Hardware Sandbox**: Low-latency code execution using kernel-level `prlimit` syscalls, enforcing strict CPU limits, RAM constraints, process count ceilings (fork-bomb prevention), and SIGKILL trapping for infinite loops.
2. **Single-Compile & Short-Circuiting Suite Runner**: Compiles C++ or Java once and runs entire test suites in 5ms–25ms, instantly halting (short-circuiting) on the first failing test case.
3. **Zero-Leakage Test Isolation**: Strictly hides hidden and edge test cases from network responses and student inspection, while exposing public sample cases.
4. **Decoupled AI Diagnostics**: Asynchronously analyzes accepted and failed attempts using Google Gemini 2.5 Flash, generating AST comparisons and Big-O complexity reports without blocking the core evaluation pipeline or compromising deterministic verdicts.
5. **Executive Problem Authoring Studio**: A 6-tab curriculum authoring environment for manual and AI-assisted challenge creation.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client["Frontend Layer (React + Vite + Monaco)"]
        UI["Student Workspace (/workspace/:id)"]
        Studio["Problem Authoring Studio (/create-problem)"]
        AdminUI["Admin Catalog Manager (/admin/problems)"]
    end

    subgraph Gateway["API Gateway (Express + TypeScript)"]
        Auth["Auth Service (Argon2id + JWT)"]
        ProblemAPI["Problem CRUD + Zod Validator"]
        SubAPI["Submission Controller + SSE Stream"]
        CustomRun["Sandbox Custom Run (Instant Feedback)"]
    end

    subgraph Databases["3-Database Triad"]
        PG[("PostgreSQL (Neon DB)<br/>Users, Profiles, ACID Auth")]
        Mongo[("MongoDB Atlas Cloud<br/>Problems, Submissions, Reports")]
        Redis[("Redis / Upstash<br/>BullMQ Queues & Leaderboard ZSET")]
    end

    subgraph Workers["Asynchronous Execution Workers (BullMQ)"]
        SubWorker["Submission Worker (Queue: submissions)"]
        AIWorker["Proposal Worker (Queue: problem-proposals)"]
    end

    subgraph ExecutionEngine["Core Hardware Execution Engine"]
        Sandbox["Linux Hardware Sandbox (prlimit / signals)"]
        Compiler["Single-Compile Suite Runner (5-25ms)"]
        Tester["Zero-Leakage Diff Evaluator & Short-Circuiting"]
    end

    subgraph AIEngine["Decoupled AI Engine (Gemini 2.5)"]
        Diagnostics["Code Diagnostics & Complexity"]
        Evolution["Evolutionary Solution Comparison"]
    end

    Client -->|REST & SSE| Gateway
    Gateway --> Databases
    Gateway -->|Enqueue Job| Redis
    Redis -->|Dequeue Job| Workers
    Workers --> ExecutionEngine
    Workers --> Databases
    Workers -->|Async AI Analysis| AIEngine
    AIEngine -.->|Deferred Update| Mongo
```

---

## 📦 Monorepo Structure

AiCA is managed via **Turborepo** and **pnpm workspaces**:

```
AiCA/
├── apps/
│   ├── api/             # Express.js REST API gateway, JWT auth, SSE streams (Port 5000)
│   ├── web/             # React 18 SPA with Monaco Editor & Tailwind CSS (Port 5173)
│   ├── worker/          # BullMQ queue runner, Linux prlimit sandbox, compile engine
│   └── ai-engine/       # Google Gemini 2.5 Flash diagnostics & evolutionary comparisons
├── packages/
│   └── shared/          # Single Source of Truth: Zod schemas, TypeScript types, constants
├── tests/               # 13 Vitest test suites (153 end-to-end integration tests)
├── pnpm-workspace.yaml  # Workspace package definitions
├── turbo.json           # Turborepo build task pipeline
└── package.json         # Root scripts & dependencies
```

---

## 🗄️ The 3-Database Triad

| Database | Technology | Primary Role & Responsibilities |
| :--- | :--- | :--- |
| **Relational (Auth)** | **PostgreSQL (Neon DB)** | User accounts, hashed passwords (Argon2id), roles (`STUDENT`, `INSTRUCTOR`, `ADMIN`), user profiles, streaks, and strict ACID transaction safety. |
| **Document (Curriculum)** | **MongoDB Atlas Cloud** | Curriculum problems, multi-language starter codes, test case suites (public + hidden), submissions, evaluation reports, and multi-solution AST comparisons. |
| **In-Memory (Real-Time)** | **Redis / Upstash** | BullMQ task queues (`submissions`, `problem-proposals`), real-time SSE Pub/Sub event broadcasting, and global percentile leaderboard (`leaderboard:global` sorted set). |

---

## ⚙️ 6-Layer Execution & Evaluation Pipeline

When a student submits code in the Monaco editor, the system evaluates it through six discrete layers:

```
[1. Submission Manager] ──► [2. Execution Engine] ──► [3. Test Engine]
                                (Linux prlimit Sandbox)   (Deterministic Diff & Short-Circuit)
                                                                 │
                                                                 ▼
[Final Evaluation Report] ◄── [6. Ranking Engine] ◄── [5. Comparison] ◄── [4. Analysis Engine]
(Unified MongoDB Document)    (Redis ZSET Percentile)  (AST Evolution)   (Decoupled Gemini AI)
```

1. **Submission Manager (`api`)**: Receives payload, validates language and code size (max 64KB), creates a `PENDING` record in MongoDB, and pushes job to BullMQ queue.
2. **Execution Engine (`worker`)**: Isolates code execution in a Linux hardware sandbox with `prlimit` ceilings (`RLIMIT_CPU`, `RLIMIT_AS`, `RLIMIT_NPROC`). Traps `SIGXCPU`/`SIGKILL` to prevent server hanging.
3. **Test Engine (`worker` / `api`)**:
   - Single-Compile Architecture: Compiles once in memory, runs $N$ test cases sequentially.
   - LeetCode-Grade Short-Circuiting: Halts immediately upon the first `WRONG_ANSWER` or `TIME_LIMIT_EXCEEDED` to save CPU resources.
   - Zero-Leakage Masking: Replaces hidden test case inputs and expected outputs with `[HIDDEN]` in the public report.
4. **Analysis Engine (`ai-engine`)**: Asynchronously evaluates Big-O time and space complexity, style, and hints via Gemini. *Invariant:* AI service failure or timeout NEVER modifies an `ACCEPTED` deterministic verdict.
5. **Comparison Engine (`api` / `ai-engine`)**: Computes token and AST differences between the student's previous and current submissions.
6. **Ranking Engine (`api`)**: Calculates composite score ($0-100$) based on correctness, runtime, memory, and code efficiency, updating the global Redis sorted set leaderboard.

---

## 🛠️ Tech Stack & Tooling

* **Runtime:** Node.js v24 LTS
* **Language:** TypeScript 5.8
* **Frontend:** React 18, Vite 6, Tailwind CSS, Monaco Editor (`@monaco-editor/react`), Lucide Icons
* **Backend:** Express.js, Zod, Argon2id, JSON Web Tokens (JWT), Helmet, CORS
* **Queue / Concurrency:** BullMQ, ioredis, Upstash
* **Testing:** Vitest 5.1 (153 unit & integration tests)
* **Sandboxing:** Linux POSIX `prlimit`, child_process spawn, signal trapping (`SIGKILL`, `SIGXCPU`, `SIGSEGV`)

---

## 🚀 Quickstart & Setup Guide

### 1. Prerequisites
* **Operating System:** Linux (Ubuntu 22.04+ recommended) or WSL2 on Windows.
* **Node.js:** v20.x or v24.x (`node -v`)
* **Package Manager:** `pnpm` v9+ (`npm install -g pnpm`)
* **Compilers & Interpreters:**
  - `g++` (GCC 11+)
  - `python3`
  - `javac` / `java` (OpenJDK 17+)

### 2. Clone Repository
```bash
git clone https://github.com/mohankunjam25-hue/AiCA.git
cd AiCA
```

### 3. Install Dependencies
```bash
pnpm install
```

### 4. Configure Environment Variables
Create a root `.env` or inspect `apps/api/.env` and `apps/worker/.env`:
```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Auth & Secrets
JWT_SECRET=super_secret_jwt_access_key_min_32_characters_for_security_2026

# Databases
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/aica_lab?retryWrites=true&w=majority
REDIS_URL=redis://localhost:6379

# AI Diagnostics
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Run the Application
In separate terminals:

```bash
# Terminal 1: Start API Gateway (5000) and Web Frontend (5173)
pnpm dev

# Terminal 2: Start BullMQ Worker Daemon (Sandboxed execution runner)
pnpm --filter @aica/worker dev
```

### 6. Verify Services
* Web Frontend: [http://localhost:5173](http://localhost:5173)
* API Healthcheck: [http://localhost:5000/health](http://localhost:5000/health)
* Problem Catalog: [http://localhost:5173/problems](http://localhost:5173/problems)
* Problem Studio: [http://localhost:5173/create-problem](http://localhost:5173/create-problem)

---

## 🧪 Testing & Verification

AiCA maintains a comprehensive Vitest integration test suite covering the sandbox, diffing engine, AI isolation, ranking, and API routes:

```bash
# Run all 153 integration tests
pnpm test

# Run specific sandbox execution tests
pnpm test tests/rea-sandbox-execution.test.ts

# Production build check across all packages
pnpm build
```

---

## 📋 Core Invariants & Rules for Developers

1. **Strict Branching Strategy**: Never commit directly to `main`. Always work on dedicated feature branches (e.g. `feat/feature-name`) and open a Pull Request.
2. **AI Decoupling Rule**: The deterministic verdict (`ACCEPTED`, `WRONG_ANSWER`, `TLE`, `MLE`) must NEVER depend on the success of Gemini AI calls. If AI fails, the deterministic verdict remains intact.
3. **Zero-Leakage Guarantee**: Never expose hidden test case inputs/outputs to student endpoints.
4. **Single-Compile Requirement**: Any additions to compiled runners (C++, Java, Rust) must compile once per submission and execute test cases sequentially against the compiled binary.

---

## 📄 License
This project is developed under the Team AiCA initiative for collaborative code analysis and evolutionary learning.
All rights reserved © 2026.
