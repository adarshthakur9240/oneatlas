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

---

## 4. Vercel Deployment Runbook (Step-by-Step)

### Step 1: Project Setup & Region Configuration
1. Import repository into Vercel.
2. Ensure `vercel.json` is located in the repo root:
   ```json
   {
     "regions": ["sin1"]
   }
   ```
   *Rationale:* Neon's AWS region is `aws-ap-southeast-1` (Singapore). Colocating serverless functions in Vercel's `sin1` region eliminates ~200ms intercontinental round-trip network latency on every database transaction.

### Step 2: Environment Variables
Configure the following in Vercel **Project Settings > Environment Variables**:
- `DATABASE_URL`: The Neon **pooled** connection string with `-pooler` host (`?sslmode=require&connect_timeout=15&pool_timeout=20`).
- `DIRECT_URL`: The Neon **direct** connection string without `-pooler` (required by Prisma CLI).
- `NEXT_PUBLIC_APP_URL`: Production domain URL, e.g. `https://oneatlas.dev` (used for `metadataBase`, OpenGraph URLs, and sitemap generation).
- `OPENROUTER_API_KEY`: *(Optional)* OpenRouter token if running periodic live catalog refreshes.

### Step 3: Build & Migration Command
In Vercel **Project Settings > General > Build & Development Settings**:
- **Build Command**: `npm run build`
  - In `package.json`, this is configured as: `prisma generate && next build`.
- **Database Migrations Strategy**:
  - Run database migrations before promoting a deployment:
    ```bash
    npx prisma migrate deploy
    ```
  - In GitHub Actions CI/CD or Vercel Deploy Hook, run `prisma migrate deploy` against `DIRECT_URL`. Never run data seeds in production deployments.

### Step 4: Health Check & Verification
Post-deployment, assert system integrity:
```bash
curl -i https://oneatlas.dev/api/health
```
Expected output:
```json
{
  "status": "ok",
  "version": "0.1.0",
  "checks": {
    "database": {
      "status": "up",
      "latencyMs": 14,
      "coldStartSuspected": false
    }
  }
}
```

### Step 5: Instant Rollback Strategy
If a deployment exhibits regressions:
1. Navigate to **Vercel Dashboard > Deployments**.
2. Identify the previous stable deployment hash.
3. Click **Instant Rollback**.
4. Since database migrations maintain backward compatibility (no destructive column drops without deprecation phases), the prior build functions without database downtime.

---

## 5. GitHub Actions CI & Dedicated Neon "ci" Branch

### Why CI Requires Database Connectivity
OneAtlas leverages Next.js App Router Incremental Static Regeneration (`export const revalidate = 300`) on read-heavy catalog routes (`/`, `/rankings`, `/benchmarks`, `/labs`, `/providers`). During `next build`, Next.js executes route Server Components to pre-render static HTML snapshots. Using dummy credentials (e.g. `localhost:5432`) causes static prerendering to fail during the build step.

### Neon Branching Architecture
Rather than risking production data or maintaining complex Docker containers in CI:
- Neon supports instantaneous, copy-on-write database branching with isolated compute.
- A dedicated branch named **`ci`** was branched from the parent database.
- GitHub Actions executes Prisma code generation, type checking, and ISR prerendering against this isolated `ci` branch.

### Required GitHub Repository Secrets
Configure the following secrets in **GitHub > Repository Settings > Secrets and variables > Actions**:

| Secret Name | Target Endpoint | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | Neon `ci` Branch Pooler | Pooled PgBouncer connection string (`-pooler` host) with parameters: `?sslmode=require&connect_timeout=15&pool_timeout=20`. |
| `DIRECT_URL` | Neon `ci` Branch Compute | Direct unpooled connection string without `-pooler` host for Prisma CLI schema operations. |

### CI Workflow Safeguards (`.github/workflows/ci.yml`)
1. **Fail-Early Secret Validation**: The workflow includes a validation step that checks for the presence of `DATABASE_URL` and halts immediately with a descriptive error message if missing.
2. **Branch Isolation**: CI builds and runs never read or write against the production database branch, maintaining complete isolation.
