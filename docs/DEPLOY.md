# OneAtlas Deployment & Infrastructure Guide

This guide documents the production deployment configuration, database connection pooling parameters, cold-start mitigation, and observability standards for OneAtlas.

---

## 1. Neon Serverless Postgres Configuration

OneAtlas uses Neon Serverless Postgres. In serverless environments, Neon automatically suspends compute endpoints after ~5 minutes of idle time to conserve resources. When traffic arrives, compute is resumed.

### Environment Variables

Two distinct database connection strings must be configured:

1. **`DATABASE_URL` (Runtime Connection Pooling)**
   - Used by the Next.js App Router runtime for API routes and Server Components.
   - **Must use Neon's pooled endpoint** (host name must contain `-pooler`, routing via PgBouncer).
   - **Required connection parameters**:
     ```env
     DATABASE_URL="postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=20"
     ```
   - **Why these query parameters matter**:
     - `sslmode=require`: Enforces TLS encryption across transit.
     - `connect_timeout=15`: Gives Neon compute up to 15 seconds to wake up from a suspended state without throwing immediate connection timeouts.
     - `pool_timeout=20`: Sets PgBouncer client connection acquisition timeout to 20 seconds, preventing queue saturation during wake-up spikes.

2. **`DIRECT_URL` (Direct Migration Connection)**
   - Used strictly by Prisma CLI for migrations and schema pushes (`prisma migrate deploy`, `prisma db push`).
   - Direct to the primary compute node (host name does **not** contain `-pooler`).
     ```env
     DIRECT_URL="postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/neondb?sslmode=require"
     ```

---

## 2. Database Connection Resilience & Retries

To handle serverless compute wake-up and pooler idle connection closures:

- **Automatic Query Retries (`src/lib/prisma.ts`)**:
  - The Prisma Client is wrapped in an extension (`$extends`, `query.$allOperations`) with `withRetry`.
  - Retries **only** transient connection errors (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`, `PrismaClientInitializationError`, and network resets / connection closed errors).
  - Uses exponential backoff (150ms, 400ms, 900ms + random jitter) with a maximum of 3 attempts.
  - Non-transient errors (e.g. unique constraint `P2002`, not found `P2025`, validation errors) fail immediately without retry.

- **Idle Connection Log Deduplication**:
  - When Neon closes idle connections, Prisma emits `Error in PostgreSQL connection: Error { kind: Closed, cause: None }`.
  - Handled via custom Prisma event emitters to deduplicate idle closure notices (at most one line per 30 seconds: `[db] connection closed by pooler (idle), will reconnect`). Real operational errors still print in full.

---

## 3. Cold-Start Mitigation & Server Warm-up

- **Next.js Server Warm-up (`src/instrumentation.ts`)**:
  - Implements the Next.js `register()` hook for the `nodejs` runtime.
  - Automatically executes a lightweight `SELECT 1` query during server boot to establish the initial connection before user requests arrive.
  - Wrapped in `try/catch` so server initialization never crashes even if the database is temporarily unreachable.

- **Health Check Observability (`/api/health`)**:
  - Pings the database with `SELECT 1` and returns latency in milliseconds.
  - If latency exceeds 1,500ms, the response includes `coldStartSuspected: true` (`"db.coldStartSuspected": true`) to distinguish normal operation from serverless wake-up latency.
