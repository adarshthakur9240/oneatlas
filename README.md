<div align="center">

<img src="docs/assets/banner.svg" alt="OneAtlas — Every AI model, compared." width="100%">

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-16.4.6-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.3-06b6d4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169e1?logo=postgresql&logoColor=white)](https://neon.tech)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2d3748?logo=prisma&logoColor=white)](https://www.prisma.io)
[![Vercel](https://img.shields.io/badge/Vercel-sin1-000?logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/adarshthakur9240/oneatlas/ci.yml?branch=main&label=CI&logo=github)](https://github.com/adarshthakur9240/oneatlas/actions)

**[Live Application](https://oneatlas-lovat.vercel.app) · [Walkthrough Video](https://www.loom.com/share/c26d9ec5de514948b982c1fa8c09addd) · [API Health](https://oneatlas-lovat.vercel.app/api/health) · [Repository](https://github.com/adarshthakur9240/oneatlas)**

</div>

> **OneAtlas** is an AI model intelligence & discovery platform. It continuously ingests the global model catalog from OpenRouter, enriches each model with verified benchmark scores from vendor publications and the [Artificial Analysis](https://artificialanalysis.ai) independent evaluation suite, and surfaces the intelligence through a low-latency, strictly type-safe REST API and a warm-dark discovery UI.
>
> Built on a foundational principle of data integrity: **score bases are never blended**.

<br/>

<div align="center">
  <img src="docs/screens/demo-command-palette.gif" alt="Command Palette instant search across models, labs and providers" width="100%">
</div>

---

## Table of Contents

- [1. Why This Project Is Different](#1-why-this-project-is-different)
- [2. Product Tour](#2-product-tour)
- [3. Assignment Requirements Traceability](#3-assignment-requirements-traceability)
- [4. System Architecture](#4-system-architecture)
- [5. Data Layer](#5-data-layer)
- [6. Data Pipeline & Benchmark Honesty](#6-data-pipeline--benchmark-honesty)
- [7. API Reference](#7-api-reference)
- [8. Frontend Architecture](#8-frontend-architecture)
- [9. Performance & Caching](#9-performance--caching)
- [10. Reliability, Security & Quality](#10-reliability-security--quality)
- [11. CI/CD & Deployment Pipeline](#11-cicd--deployment-pipeline)
- [12. Architecture Decision Records (ADRs)](#12-architecture-decision-records-adrs)
- [13. Engineering Challenges & Incidents](#13-engineering-challenges--incidents)
- [14. AI-Assisted Development Transparency](#14-ai-assisted-development-transparency)
- [15. Engineering Roadmap](#15-engineering-roadmap)
- [16. Local Setup & Reproduction](#16-local-setup--reproduction)
- [17. Walkthrough Video](#17-walkthrough-video)
- [18. Frequently Asked Questions (FAQ)](#18-frequently-asked-questions-faq)
- [19. Acknowledgements & Attribution](#19-acknowledgements--attribution)

---

## 1. Why This Project Is Different

Most model aggregators rely on mock data, scraped tables, or ungrounded synthetic benchmarks. OneAtlas is engineered as a production-grade intelligence layer backed by verifiable facts:

| Core Claim | Empirical Evidence & Architectural Guarantee |
|:---|:---|
| **448 Real Models, Zero Fabrications** | Ingested directly from OpenRouter’s live catalog (`448` total models, `344` active listable models, `1,358` provider pricing listings). Unknown values remain `null`; prices and tokens are never guessed. |
| **Strict Dual-Score Isolation** | Independent evaluation indices (Artificial Analysis) and raw vendor-reported percentages (MMLU-Pro, GPQA, SWE-bench) exist on distinct scales. Model records explicitly track `Model.scoreBasis = "aa" \| "vendor"`. Bases are **never averaged or blended**. |
| **Real-Time Multi-Provider Arbitrage** | Up to 15 host providers compete on identical model weights. Prices are normalized to USD per 1M tokens with denormalized `blendedPrice = (3 * input + output) / 4` stored on `Model` for $O(1)$ indexed sorting without expensive runtime joins. |
| **Edge-to-Database Region Alignment** | Vercel Edge compute deployed in Singapore (`sin1`) directly co-located with Neon Serverless Postgres in AWS Singapore (`ap-southeast-1`), cutting cross-region network overhead to under 2 ms. |
| **Resilient Serverless Pool Handling** | Custom Prisma extension implements exponential backoff and jitter for transient connection dropouts (`P1001`, `P1002`, `P1008`, `P1017`, `P2024`, and idle closed sockets). Server boot warm-up executes `SELECT 1` during instrumentation. |
| **37/37 API Smoke & 15/15 E2E Tests** | Endpoints are covered by automated test suites validating JSON envelopes, sorting stability, CORS, Edge CDN cache-control, and tie-breaking logic. CI builds directly against a dedicated Neon `ci` database branch. |

---

## 2. Product Tour

### Primary Interface Surfaces

<table>
<tr>
<td width="50%" valign="top">

**Home — Hero & Discovery Cards Grid**
Live catalog browsing with real-time statistics bento, capability badges, and faceted filtering across 344 listable models.

<img src="docs/screens/01-home-hero-cards.png" alt="Home hero with stats bento, card grid and filter toolbar" width="100%">

</td>
<td width="50%" valign="top">

**Global Command Palette (`⌘K`)**
Keyboard-driven fuzzy search across 448 models, 66 research labs, and 80 inference providers powered by `cmdk`.

<img src="docs/screens/03-command-palette.png" alt="cmdk command palette with live search across all models" width="100%">

</td>
</tr>
<tr>
<td width="50%" valign="top">

**Model Deep Dive (`/models/[slug]`)**
Comprehensive model specifications, input/output/cache pricing, evaluated benchmark scores with citations, and active provider endpoints.

<img src="docs/screens/04-model-detail.png" alt="Model detail page with pricing, provider listing, benchmark scores and capabilities" width="100%">

</td>
<td width="50%" valign="top">

**Comparison Matrix (`/compare?models=...`)**
Side-by-side comparison matrix for up to 4 models with attribute diffing and intelligent tie-aware `BEST` value chips.

<img src="docs/screens/06-compare.png" alt="Side-by-side comparison matrix with best-value badges" width="100%">

</td>
</tr>
<tr>
<td width="50%" valign="top">

**Rankings Leaderboard (`/rankings`)**
Calibrated intelligence leaderboard sorting by Artificial Analysis Index with horizontal descending Top 10 bar chart.

<img src="docs/screens/07-rankings-aa-index.png" alt="Rankings leaderboard by Artificial Analysis intelligence index" width="100%">

</td>
<td width="50%" valign="top">

**Mobile Viewport Experience (390px)**
Fully responsive layout tested against iPhone 16 Pro viewports, featuring adaptive bottom navigation, touch targets, and mobile trays.

<img src="docs/screens/12-mobile-home.png" alt="Mobile home view at 390px viewport" width="100%">

</td>
</tr>
</table>

<details>
<summary><strong>Expand Additional Product Views (Table, Pareto Scatter, Methodology, Labs, Providers, CI)</strong></summary>
<br/>

<table>
<tr>
<td width="50%" valign="top">

**High-Density Sortable Table View (`/?view=table`)**
Sortable tabular view with fixed monospace formatting for token pricing, context lengths, and composite rankings.

<img src="docs/screens/02-home-table.png" alt="Home — table view with sortable columns" width="100%">

</td>
<td width="50%" valign="top">

**Interactive Monthly Cost Calculator**
Dynamic token volume sliders allowing engineering teams to project monthly API expenditures across candidate models.

<img src="docs/screens/05-cost-calculator.png" alt="Interactive token cost calculator" width="100%">

</td>
</tr>
<tr>
<td width="50%" valign="top">

**Intelligence vs. Price Pareto Frontier**
Logarithmic scatter plot mapping Artificial Analysis Intelligence Index against blended token cost per 1M tokens.

<img src="docs/screens/08-rankings-pareto.png" alt="Rankings — Intelligence vs Price scatter on log scale" width="100%">

</td>
<td width="50%" valign="top">

**Benchmark Methodology & Source Citations**
Complete transparency catalog documenting benchmark methodologies, scoring scales, and authoritative source URLs.

<img src="docs/screens/09-benchmarks-methodology.png" alt="Benchmarks catalog with methodology notes" width="100%">

</td>
</tr>
<tr>
<td width="50%" valign="top">

**AI Research Labs Directory (`/labs`)**
Index of 66 frontier labs, institutions, and open-weights consortiums with founding dates, headquarters, and model portfolios.

<img src="docs/screens/10-labs.png" alt="Labs directory with open-weight flag" width="100%">

</td>
<td width="50%" valign="top">

**Inference Providers Directory (`/providers`)**
Index of 80 inference providers tracking average P50 latency, throughput tokens/sec, and observed historical uptime.

<img src="docs/screens/11-providers.png" alt="Providers directory with latency/uptime" width="100%">

</td>
</tr>
<tr>
<td width="50%" valign="top">

**Mobile Model Deep Dive (`/models/[slug]`)**
Touch-optimized model specification inspection, capability pills, and provider listing matrix on mobile viewports.

<img src="docs/screens/13-mobile-model.png" alt="Model detail on mobile" width="100%">

</td>
<td width="50%" valign="top">

**Automated CI Pipeline Passing**
GitHub Actions verification executing strict TypeScript check, ESLint 9, and Next.js production build against a dedicated Neon DB.

<img src="docs/screens/14-ci-green.png" alt="GitHub Actions CI — all checks green" width="100%">

</td>
</tr>
<tr>
<td colspan="2" width="100%" valign="top">

**Prisma Studio Relational Database Explorer**
Direct inspection of the normalized PostgreSQL schema with 6 relational tables and foreign key integrity.

<img src="docs/screens/15-prisma-studio.png" alt="Prisma Studio data explorer" width="100%">

</td>
</tr>
</table>

</details>

---

## 3. Assignment Requirements Traceability

Every capability required in the project blueprint is implemented and verifiable:

| Requirement Group | Concrete Capabilities Implemented | Route | API Endpoint | Primary Source Implementation | Status |
|:---|:---|:---|:---|:---|:---:|
| **1. Discovery & Search** | Full-text query, instant `cmdk` palette, facet filters (reasoning, tools, vision, license), sort by price/context/score/release, dual view (cards & table), pagination | `/` | `/api/models`<br/>`/api/search`<br/>`/api/filters` | `src/app/page.tsx`<br/>`src/components/home/DiscoveryToolbar.tsx`<br/>`src/components/models/ModelTable.tsx`<br/>`src/components/layout/CommandPalette.tsx` | ✅ |
| **2. Detail Pages** | Spec overview, price tiers (input, output, cache read/write), active provider endpoints table with latency & TPS, benchmark score cards with source URLs, interactive cost estimator | `/models/[slug]` | `/api/models/[slug]` | `src/app/models/[slug]/page.tsx`<br/>`src/components/models/ModelDetailClient.tsx`<br/>`src/components/models/CostCalculator.tsx` | ✅ |
| **3. Comparison** | 4-model side-by-side matrix, attribute diffing, tie-aware `BEST` badges, score comparison respecting `scoreBasis`, persistent URL sync (`/compare?models=a,b`), global compare tray, 4 curated presets | `/compare` | `/api/compare`<br/>`/api/compare/presets` | `src/app/compare/page.tsx`<br/>`src/components/compare/CompareClient.tsx`<br/>`src/components/layout/CompareTray.tsx`<br/>`src/server/services/compare.ts` | ✅ |
| **4. Rankings & Benchmarks** | AA Intelligence Index leaderboard (default), vendor-reported benchmark tabs (MMLU-Pro, GPQA, SWE-bench, LiveCodeBench, Arena Elo), descending Top-10 chart, log-scale Pareto scatter, methodology catalog | `/rankings`<br/>`/benchmarks` | `/api/rankings`<br/>`/api/benchmarks` | `src/app/rankings/page.tsx`<br/>`src/components/rankings/RankingsClient.tsx`<br/>`src/components/charts/Top10BarChart.tsx`<br/>`src/components/charts/ParetoScatterChart.tsx` | ✅ |
| **5. Labs & Providers** | 66 labs catalog with open-weights indicators, lab profile pages with model portfolios, 80 host providers catalog with latency & uptime metrics, provider profile pages with hosted endpoints | `/labs`<br/>`/labs/[slug]`<br/>`/providers`<br/>`/providers/[slug]` | `/api/labs`<br/>`/api/labs/[slug]`<br/>`/api/providers`<br/>`/api/providers/[slug]` | `src/app/labs/page.tsx`<br/>`src/app/labs/[slug]/page.tsx`<br/>`src/app/providers/page.tsx`<br/>`src/app/providers/[slug]/page.tsx` | ✅ |
| **6. Product Experience** | Zero-layout-shift skeletons (`loading.tsx`), nested error boundaries with retry (`error.tsx`, `global-error.tsx`), branded `not-found.tsx`, dynamic SEO metadata, `sitemap.ts`, `robots.ts`, responsive 390px mobile QA, ISR 300s, DB retry layer | All Routes | `/api/health`<br/>`/api/stats` | `src/app/layout.tsx`<br/>`src/app/loading.tsx`<br/>`src/app/error.tsx`<br/>`src/lib/prisma.ts`<br/>`src/instrumentation.ts` | ✅ |

---

## 4. System Architecture

### High-Level Architecture Overview

```mermaid
flowchart TD
    Browser["Browser / Client"]
    CDN["Vercel Edge CDN<br/>(Region: sin1)"]
    NS["Next.js App Router Server<br/>(RSC + Route Handlers)"]
    DB[("Neon PostgreSQL<br/>(Region: ap-southeast-1)")]
    OR["OpenRouter Catalog API"]
    AA["Artificial Analysis API"]

    Browser -->|"HTTPS / User Requests"| CDN
    CDN -->|"Cache Miss / Dynamic SSR"| NS
    NS -->|"Prisma 6 Connection Pool<br/>(connect_timeout=15s)"| DB
    OR -->|"Idempotent Seed Pipeline<br/>(Zod Validated & Cached)"| DB
    AA -->|"Benchmark Ingest Pipeline<br/>(Strict Token Matching)"| DB
    NS -->|"CDN-Cache-Control:<br/>s-maxage=60, swr=300"| CDN
```

### End-to-End Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant CDN as Vercel Edge (sin1)
    participant Route as Route Handler (/api/models)
    participant Service as Models Service
    participant Prisma as Prisma Client (Pool)
    participant DB as Neon Postgres (ap-southeast-1)

    User->>CDN: GET /api/models?sort=blendedPrice
    alt Edge Cache Hit (age < 60s)
        CDN-->>User: 200 OK (x-vercel-cache: HIT)
    else Edge Cache Miss or Stale
        CDN->>Route: Forward Request
        Route->>Service: getModels(validatedQueryParams)
        Service->>Prisma: db.model.findMany({ where, orderBy })
        Prisma->>DB: SQL query via PgBouncer Pool
        DB-->>Prisma: Result set (rows)
        Prisma-->>Service: Model records
        Service-->>Route: ModelSummaryDto[] + PaginationMeta
        Route-->>CDN: 200 OK + CDN-Cache-Control: s-maxage=60, swr=300
        CDN-->>User: 200 OK (x-vercel-cache: MISS)
    end
```

### Comparison Matrix Computation Flow

```mermaid
flowchart TD
    Start["User selects 2-4 model slugs"] --> Fetch["Compare Service fetches ModelDetailDto records"]
    Fetch --> Align["Align specifications, pricing, & benchmark scores"]
    Align --> EvalMetric{"Evaluate attribute (Price, Context, Intelligence)"}
    EvalMetric --> CheckTie{"Are all compared values identical?"}
    CheckTie -->|"Yes (All models tie)"| SuppressBadge["Omit BEST badge (return empty winners list)"]
    CheckTie -->|"No (Difference exists)"| CheckBasis{"Is metric an Intelligence Score?"}
    CheckBasis -->|"Yes"| MatchBasis{"Do models share the same scoreBasis?"}
    MatchBasis -->|"Yes (Both aa or both vendor)"| AwardWinner["Award BEST badge to top scorer"]
    MatchBasis -->|"No (Mixed aa & vendor)"| SuppressScoreWinner["Suppress score winner (Never compare across bases)"]
    CheckBasis -->|"No (Price / Context)"| StandardWinner["Award BEST badge to minimum price / max context"]
    SuppressBadge --> AssembleMatrix["Assemble ComparisonMatrixDto"]
    AwardWinner --> AssembleMatrix
    SuppressScoreWinner --> AssembleMatrix
    StandardWinner --> AssembleMatrix
    AssembleMatrix --> Return["Return JSON response to CompareClient"]
```

### Deployment Topology

> For comprehensive infrastructure parameters, PgBouncer pool acquisition timeouts, and cold-start mitigations, see **[docs/DEPLOY.md](docs/DEPLOY.md)**.

```mermaid
flowchart LR
    subgraph DeveloperWorkstation["Developer Environment"]
        Dev["Git Commit & Push<br/>main branch"]
    end
    subgraph GitHubActions["GitHub Actions CI"]
        CI["CI Runner (ubuntu-latest)<br/>npm ci -> prisma generate<br/>tsc -> eslint -> next build"]
        NeonCI[("Neon 'ci' Branch DB<br/>(Dedicated Pooler)")]
        CI -->|"Prerender validation"| NeonCI
    end
    subgraph ProductionDeployment["Production (Vercel sin1)"]
        VercelEdge["Vercel Edge Network<br/>Singapore (sin1)"]
        VercelCompute["Next.js Node.js Server<br/>Serverless Functions (sin1)"]
        NeonProd[("Neon Production DB<br/>ap-southeast-1")]
        VercelEdge --> VercelCompute
        VercelCompute -->|"Pooled DATABASE_URL"| NeonProd
    end

    Dev -->|"Push"| GitHubActions
    GitHubActions -->|"Pass All Gates"| ProductionDeployment
```

---

## 5. Data Layer

### Entity-Relationship Diagram

```mermaid
erDiagram
    LAB ||--o{ MODEL : "releases"
    MODEL ||--o{ MODEL_PROVIDER : "available through"
    PROVIDER ||--o{ MODEL_PROVIDER : "hosts"
    MODEL ||--o{ BENCHMARK_SCORE : "evaluates"
    BENCHMARK_DEFINITION ||--o{ BENCHMARK_SCORE : "defines"

    LAB {
        string id PK
        string slug UK
        string name
        string country
        boolean isOpenFirst
    }
    MODEL {
        string id PK
        string sourceId UK
        string slug UK
        string labId FK
        string name
        string modelType
        boolean isOpenWeights
        boolean isDeprecated
        int contextWindow
        float minInputPrice
        float minOutputPrice
        float blendedPrice
        string cheapestProviderSlug
        int providerCount
        float compositeScore
        float intelligenceScore
        float codingScore
        string scoreBasis
        string[] capabilities
    }
    PROVIDER {
        string id PK
        string slug UK
        string name
        int avgLatencyMs
        float avgThroughputTps
        float uptimePct
    }
    MODEL_PROVIDER {
        string id PK
        string modelId FK
        string providerId FK
        float inputPrice
        float outputPrice
        float cacheReadPrice
        int contextWindow
        int latencyP50Ms
        float throughputP50Tps
    }
    BENCHMARK_DEFINITION {
        string id PK
        string slug UK
        string name
        string category
        string higherIsBetter
    }
    BENCHMARK_SCORE {
        string id PK
        string modelId FK
        string benchmarkId FK
        float score
        string sourceUrl
    }
```

### Relational Schema & Pricing Denormalization

The database architecture balances relational normalization with read performance:

1. **Normalized Provider Endpoints (`ModelProvider`):**  
   Pricing, quantization (`int4`, `fp8`, `fp16`), P50 latency, and throughput TPS reside on the join table `ModelProvider`. This enables accurate tracking when a single model (e.g. `meta-llama/llama-3.3-70b-instruct`) is hosted by 12 different providers at varying price points.
2. **Denormalized Summaries (`Model`):**  
   To prevent expensive SQL aggregates and joins on the high-traffic `/api/models` catalog route, the seed pipeline computes and denormalizes summary columns onto the `Model` table:
   - `minInputPrice` & `minOutputPrice` (minimum token cost across all active endpoints)
   - `blendedPrice = (3 * minInputPrice + minOutputPrice) / 4` (standardized 3:1 read/write token ratio)
   - `cheapestProviderSlug` & `providerCount`
3. **Indexing Strategy:**  
   - B-tree indexes on `blendedPrice`, `contextWindow`, `compositeScore`, `modelType`, and `scoreBasis`.
   - Composite B-tree index on `[isDeprecated, releaseDate(sort: Desc)]` for active-first temporal ordering.
   - PostgreSQL **GIN index** on `capabilities text[]` supporting fast array containment queries (`capabilities @> ARRAY['reasoning']`).
   - PostgreSQL `pg_trgm` extension support for fuzzy full-text matching across names and slugs.

### Real Catalog Distributions

```mermaid
xychart-beta
    title "Model Releases Per Month (Dec 2025 - Nov 2026)"
    x-axis ["25-12", "26-01", "26-02", "26-03", "26-04", "26-05", "26-06", "26-07", "26-08", "26-09", "26-10", "26-11"]
    y-axis "Releases" 0 --> 60
    bar [19, 6, 20, 20, 27, 12, 15, 32, 28, 53, 34, 37]
```

```mermaid
pie title Catalog Listable Models by License Architecture (2026-11-23)
    "Proprietary / Closed Weights" : 184
    "Open Weights / Open Source" : 160
```

---

## 6. Data Pipeline & Benchmark Honesty

### OpenRouter Catalog Ingestion Flow

```mermaid
flowchart TD
    Trigger["npm run db:seed"] --> CheckCache{"Cached in .cache/or/models.json?"}
    CheckCache -->|"No (--refresh or missing)"| FetchOR["Fetch OpenRouter /api/v1/models"]
    CheckCache -->|"Yes"| ReadCache["Read cached payload from disk"]
    FetchOR --> WriteORCache["Write payload to .cache/or/models.json"]
    WriteORCache --> ParseZod["Zod schema.passthrough() validation"]
    ReadCache --> ParseZod
    ParseZod --> UpsertLabs["Upsert 66 unique Lab records"]
    UpsertLabs --> UpsertProviders["Upsert 80 unique Provider records"]
    UpsertProviders --> ProcessModels["Process Model rows & compute denormalized values"]
    ProcessModels --> DenormPrice["blendedPrice = (3 * input + output) / 4"]
    DenormPrice --> UpsertModels["Upsert 448 Model records (344 listable)"]
    UpsertModels --> UpsertMP["Upsert 1,358 ModelProvider listing records"]
    UpsertMP --> IngestDone["OpenRouter Catalog Ingestion Complete"]
```

### Benchmark Ingestion & Entity Matching

```mermaid
flowchart TD
    Start["Seed Benchmarks Pipeline"] --> SeedCurated["Seed 13 Benchmark Definitions & Vendor Scores"]
    SeedCurated --> CheckAACache{"Cached in .cache/aa/models.json?"}
    CheckAACache -->|"No"| FetchAA["Fetch Artificial Analysis API (Authenticated)"]
    CheckAACache -->|"Yes"| ReadAACache["Read cached AA JSON payload"]
    FetchAA --> CacheAAFile["Save to .cache/aa/models.json"]
    CacheAAFile --> ValidateAA["Validate payload with Zod schema"]
    ReadAACache --> ValidateAA
    ValidateAA --> MatchLoop["For each AA evaluated model:"]
    MatchLoop --> ExactMatch{"Exact normalized token match with Model table?"}
    ExactMatch -->|"Match Found"| LinkRecord["Link AA evaluations to Model row"]
    ExactMatch -->|"No"| ManualMap{"Found in aa-manual-map.json reviewed overrides?"}
    ManualMap -->|"Yes"| LinkRecord
    ManualMap -->|"Ambiguous or Unmatched"| SkipModel["Log and skip (Never guess or fabricate)"]
    LinkRecord --> UpsertAAScores["Upsert BenchmarkScore rows with citation sourceUrl"]
    SkipModel --> NextModel["Next model"]
    UpsertAAScores --> RecomputeDerived["Call recomputeDerivedScores()"]
    RecomputeDerived --> Done["Benchmark Pipeline Complete"]
```

### Strict Score-Basis Isolation

```mermaid
flowchart TD
    EvalModel["Evaluate Model for Derived Scores"] --> HasAA{"Has Artificial Analysis Intelligence Index score?"}
    HasAA -->|"Yes"| AssignAA["scoreBasis = 'aa'<br/>intelligenceScore = AA Intelligence Index (0-100)<br/>codingScore = AA Coding Index (or null)<br/>compositeScore = AA Intelligence Index"]
    HasAA -->|"No"| HasVendor{"Has cited vendor-reported benchmark scores?"}
    HasVendor -->|"Yes"| AssignVendor["scoreBasis = 'vendor'<br/>intelligenceScore = mean(MMLU-Pro, GPQA, etc.)<br/>codingScore = mean(SWE-bench, LiveCodeBench)<br/>compositeScore = weighted mean of vendor scores"]
    HasVendor -->|"No"| AssignNull["scoreBasis = null<br/>intelligenceScore = null<br/>codingScore = null<br/>compositeScore = null"]
    AssignAA --> Persist["Persist to PostgreSQL Model record"]
    AssignVendor --> Persist
    AssignNull --> Persist
```

> **Why never blend?**  
> Artificial Analysis computes a calibrated, normalized Intelligence Index where state-of-the-art frontier models (Claude 3.5 Sonnet, GPT-4o) score between **60 and 65**. Conversely, vendor-reported MMLU-Pro and GPQA are raw accuracy percentages where models score **80 to 90%**.  
> If an aggregator averages these numbers together, an older model with self-reported 85% vendor scores mathematically outranks a top-tier frontier model scoring 63 on the calibrated index. OneAtlas explicitly enforces `Model.scoreBasis = "aa" | "vendor"` and disallows cross-basis aggregation.

### Model Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Ingested: Seed pipeline discovers model on OpenRouter
    Ingested --> Listed: Active providers exist & isDeprecated=false
    Listed --> Scored: Matched with AA or vendor benchmark scores
    Listed --> Deprecated: Vendor deprecates or all providers withdraw
    Scored --> Deprecated: Vendor marks deprecated
    Deprecated --> Listed: Provider re-lists model with active endpoint
    Deprecated --> [*]: Archive
```

---

## 7. API Reference

All API routes follow a consistent envelope structure:

```typescript
// Success Envelope (HTTP 200)
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

// Error Envelope (HTTP 4xx / 5xx)
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### Complete Endpoints Table

| Method | Endpoint | Query Parameters | Description |
|:---|:---|:---|:---|
| `GET` | `/api/models` | `page`, `limit`, `sort`, `order`, `modelType`, `lab`, `openWeights`, `minScore`, `maxPrice`, `capabilities` | Paginated catalog list with sorting and filtering. |
| `GET` | `/api/models/[slug]` | — | Full model profile with spec, provider table, and benchmark scores. |
| `GET` | `/api/compare` | `models` (comma-separated slugs) | Multi-model comparison matrix with tie-aware winner detection. |
| `GET` | `/api/compare/presets` | — | Curated 4-model comparison presets. |
| `GET` | `/api/rankings` | `benchmark` (default: `intelligence-index`), `limit`, `order` | Leaderboard ranked by calibrated index or vendor benchmark. |
| `GET` | `/api/benchmarks` | — | Catalog of 13 benchmark definitions with methodologies and URLs. |
| `GET` | `/api/labs` | `page`, `limit` | AI research labs directory with model counts. |
| `GET` | `/api/labs/[slug]` | — | Lab profile with metadata and hosted model catalog. |
| `GET` | `/api/providers` | `page`, `limit` | Inference providers directory with latency and uptime metrics. |
| `GET` | `/api/providers/[slug]` | — | Provider profile with hosted model listings and pricing. |
| `GET` | `/api/search` | `q`, `limit` | Cross-entity fuzzy search across models, labs, and providers. |
| `GET` | `/api/filters` | — | Available filter facets, capabilities, and dynamic min/max ranges. |
| `GET` | `/api/stats` | — | Platform metrics: total models, labs, providers, and 12-mo release histogram. |
| `GET` | `/api/health` | — | Database connectivity check returning latency in milliseconds. |

### Example CLI Requests

```bash
# 1. Fetch top 5 models ranked by Artificial Analysis Intelligence Index
curl -s "https://oneatlas-lovat.vercel.app/api/rankings?benchmark=intelligence-index&limit=5" | jq .

# 2. Compare 3 models with tie-aware winner calculation
curl -s "https://oneatlas-lovat.vercel.app/api/compare?models=anthropic/claude-3.5-sonnet,openai/gpt-4o,deepseek/deepseek-chat" | jq .

# 3. Filter open-weights models with reasoning capabilities under $1.00/1M tokens
curl -s "https://oneatlas-lovat.vercel.app/api/models?openWeights=true&capabilities=reasoning&maxPrice=1.0&sort=blendedPrice&order=asc" | jq .

# 4. Global search across models, labs, and providers
curl -s "https://oneatlas-lovat.vercel.app/api/search?q=llama" | jq .

# 5. Database connectivity and ping check
curl -s "https://oneatlas-lovat.vercel.app/api/health" | jq .
```

---

## 8. Frontend Architecture

### Client State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Loading: Initial page render or URL query change
    Loading --> Success: Data received from API / SWR cache
    Loading --> Empty: API returns 200 with data count = 0
    Loading --> Error: Fetch fails or API returns 5xx / 4xx
    Empty --> Loading: User clears or resets filters
    Error --> Loading: User clicks 'Retry' button
    Success --> Loading: User updates sort, filter, or pagination
```

### Component Hierarchy

```mermaid
classDiagram
    class LayoutShell {
        +Navbar
        +CommandPalette
        +CompareTray
        +Footer
    }
    class ModelCard {
        +ModelSummaryDto model
        +render()
        +onAddToCompare()
    }
    class ModelTable {
        +ModelSummaryDto[] models
        +sortColumn: string
        +sortOrder: asc|desc
        +onSortChange()
    }
    class CompareClient {
        +ModelDetailDto[] models
        +WinnerMap winners
        +onRemoveModel()
    }
    class RankingsClient {
        +string activeBenchmark
        +Top10BarChart barChart
        +ParetoScatterChart scatterChart
    }
    class ScoreDisplay {
        +number score
        +string scoreBasis
        +renderBadge()
    }
    class LabAvatar {
        +string name
        +string slug
        +renderSvg()
    }
    LayoutShell --> ModelCard
    LayoutShell --> ModelTable
    LayoutShell --> CompareClient
    LayoutShell --> RankingsClient
    ModelCard --> ScoreDisplay
    ModelCard --> LabAvatar
    ModelTable --> ScoreDisplay
    CompareClient --> ScoreDisplay
```

### Query Parameter Synchronization

```mermaid
flowchart LR
    URL["Browser URL:<br/>?sort=blendedPrice&order=asc&openWeights=true"] --> Parse["parseQueryParams()<br/>extract raw query strings"]
    Parse --> Zod["Zod ModelQuerySchema<br/>Coerce numbers & parse enums"]
    Zod --> Service["src/server/services/models.ts<br/>getModels(validatedQuery)"]
    Service --> Prisma["Prisma db.model.findMany()<br/>WHERE isOpenWeights=true<br/>ORDER BY blendedPrice ASC"]
    Prisma --> Envelope["Construct ApiSuccessResponse<br/>{ success: true, data, meta: PaginationMeta }"]
    Envelope --> Client["Client UI / SWR Hook<br/>Re-render table & card grid"]
```

### Feature Mindmap

```mermaid
mindmap
  root((OneAtlas))
    Model Discovery
      Full Text Search (cmdk)
      Dense Table & Cards Grid
      Facet Filtering (Modalities, Reasoning, Tools)
      Pagination & SWR
    Model Comparison
      Side-by-Side Matrix
      Tie-Aware Best Badges
      Context & Price Diffing
      Shareable URL State
    Rankings & Metrics
      Artificial Analysis Intel Index
      Vendor Benchmarks (MMLU-Pro, GPQA)
      Descending Top-10 Bar Chart
      Pareto Frontier Scatter Plot
    Platform Intelligence
      66 AI Research Labs
      80 Host Providers
      Live Latency & Throughput
      Interactive Token Cost Calculator
    Infrastructure
      Neon Serverless Postgres
      Vercel Edge CDN (sin1)
      GitHub Actions CI
      Zod Type-Safe Boundary
```

### User Evaluation Journey

```mermaid
journey
    title Engineering Lead Evaluates Models on OneAtlas
    section 1. Discover
      Lands on Home Page: 5: Developer
      Inspects Hero Stats & Releases: 4: Developer
      Filters by Reasoning & Open Weights: 5: Developer
      Searches 'DeepSeek' via Command Palette: 5: Developer
    section 2. Compare
      Adds DeepSeek V3 and Claude 3.5 Sonnet to Tray: 5: Developer
      Opens Side-by-Side Comparison Matrix: 5: Developer
      Reviews Blended Pricing & Token Windows: 5: Developer
      Checks Tie-Breakers & Best Badges: 4: Developer
    section 3. Validate
      Navigates to Rankings Leaderboard: 5: Developer
      Inspects Intelligence vs Price Scatter: 5: Developer
      Reviews Provider Latency & Throughput: 4: Developer
      Simulates Monthly Cost via Calculator: 5: Developer
```

### Page Anatomy

```mermaid
flowchart TD
    subgraph RootLayout["src/app/layout.tsx"]
        Nav["Global Navbar<br/>(Logo, Nav Links, Search Trigger, Compare Counter)"]
        Palette["Command Palette Modal<br/>(cmdk global search)"]
        Tray["Sticky Compare Tray<br/>(Selected models floating pill bar)"]
        Footer["Global Footer<br/>(Attribution, Links, Legal)"]
    end
    subgraph HomePage["src/app/page.tsx (RSC)"]
        Hero["Hero Section<br/>(Platform Pitch & Tagline)"]
        Bento["Stats Bento Grid<br/>(Total Models, Labs, Providers, 12-Mo Trend)"]
        Toolbar["Discovery Toolbar<br/>(Search Input, Modality Filters, Sort Dropdown, View Toggle)"]
        ContentArea{"Active View"}
        TableView["ModelTable (Dense tabular view)"]
        CardsView["ModelCards (Visual card grid)"]
        Paging["Pagination Controls<br/>(Page size selector, page buttons)"]
    end

    Nav --> Hero
    Hero --> Bento
    Bento --> Toolbar
    Toolbar --> ContentArea
    ContentArea -->|"Table View"| TableView
    ContentArea -->|"Cards View"| CardsView
    TableView --> Paging
    CardsView --> Paging
    Paging --> Tray
    Tray --> Footer
```

---

## 9. Performance & Caching

### Multi-Tier Caching Architecture

```mermaid
flowchart TD
    subgraph Layer1["1. Browser Cache"]
        BC["SWR In-Memory Cache<br/>revalidateOnFocus: false<br/>dedupingInterval: 5000ms"]
    end
    subgraph Layer2["2. Edge CDN (Vercel sin1)"]
        CDN["Vercel Edge Cache<br/>Cache-Control: public, max-age=60<br/>s-maxage=60, stale-while-revalidate=300"]
    end
    subgraph Layer3["3. Next.js Server (sin1)"]
        ISR["Static / ISR Prerendered HTML<br/>export const revalidate = 300<br/>(Models, Labs, Providers, Rankings)"]
    end
    subgraph Layer4["4. Database Tier (Neon ap-southeast-1)"]
        PG["Neon Serverless Postgres<br/>PgBouncer Pooler + Prisma Query Cache"]
    end

    BC -->|"HTTP Request"| CDN
    CDN -->|"Cache Miss / Stale"| ISR
    ISR -->|"Read Dynamic Rows"| PG
```

### Production Lighthouse Audit (Measured 2026-11-23)

Audited against `https://oneatlas-lovat.vercel.app` using Chrome Lighthouse CLI with Mobile Emulation (Moto G Power, 4G Slow, simulated throttling):

<div align="center">
  <img src="docs/screens/16-lighthouse.png" alt="Lighthouse Mobile Scoreboard: 93 Performance, 96 Accessibility, 100 Best Practices, 100 SEO" width="85%">
</div>

| Lighthouse Metric | Score / Value | Status | Target Threshold |
|:---|:---:|:---:|:---|
| **Performance** | **93** | ✅ Passing | $\ge 90$ |
| **Accessibility** | **96** | ✅ Passing | $\ge 95$ |
| **Best Practices** | **100** | ✅ Perfect | $100$ |
| **SEO** | **100** | ✅ Perfect | $100$ |
| **First Contentful Paint (FCP)** | **1.0 s** | ✅ Fast | $< 1.8\text{ s}$ |
| **Largest Contentful Paint (LCP)** | **3.0 s** | ⚠️ Needs Improvement | $< 2.5\text{ s}$ |
| **Total Blocking Time (TBT)** | **130 ms** | ✅ Fast | $< 200\text{ ms}$ |
| **Cumulative Layout Shift (CLS)** | **0.000** | ✅ Perfect | $< 0.1$ |
| **Speed Index** | **2.9 s** | ✅ Fast | $< 3.4\text{ s}$ |

#### Honest LCP Analysis & Improvement Plan

While overall performance scores **93/100**, the Largest Contentful Paint registered at **3.0 s**, rated *Needs Improvement* by Google Core Web Vitals.  
- **Root Cause:** The LCP element is the hero heading and stats bento block. In the current architecture, `src/app/page.tsx` executes an asynchronous database count query during server component rendering before streaming HTML, delaying initial paint on slow mobile connections.
- **Planned Concrete Mitigation:**
  1. Wrap the stats bento in a React `<Suspense fallback={<StatsBentoSkeleton />}>` boundary so the initial hero shell paints immediately ($< 1.2\text{ s}$).
  2. Implement `fetchpriority="high"` and preconnect headers on font subsets.
  3. Pre-render platform totals into an ISR cache key refreshed on background timer.

### API Latency Benchmarks (Measured 2026-11-23)

Five sequential round-trip requests to `GET /api/models?limit=18` executed from an end-user client in India to production Vercel (`sin1`):

| Sequence | Elapsed Time | Edge Cache Status | Note |
|:---:|:---:|:---:|:---|
| Request 1 (Cold / Stale) | **1.06 s** | `MISS` | Serverless container resume + PgBouncer query execution |
| Request 2 | **0.50 s** | `MISS` / Warm | Warm connection pool query execution |
| Request 3 | **0.34 s** | `HIT` | Served directly from Vercel Edge CDN memory |
| Request 4 | **0.32 s** | `HIT` | Served directly from Vercel Edge CDN memory |
| Request 5 | **0.35 s** | `HIT` | Served directly from Vercel Edge CDN memory |
| Request 6 | **0.35 s** | `HIT` | Stable downstream cache response |

---

## 10. Reliability, Security & Quality

### Transient Database Error Retry Policy

```mermaid
flowchart TD
    Exec["Execute Prisma Database Query"] --> Catch{"Operation threw error?"}
    Catch -->|"No Error"| ReturnSuccess["Return query results"]
    Catch -->|"Error Thrown"| CheckTransient{"Is error code transient?<br/>P1001 (Cannot reach DB)<br/>P1002 (Connection timed out)<br/>P1008 (Operations timed out)<br/>P1017 (Server closed connection)<br/>P2024 (Pool timeout)<br/>PrismaClientInitializationError<br/>Network reset / Closed"}
    CheckTransient -->|"No (e.g. P2002 Unique, P2025 Not Found)"| ThrowImmediate["Fail fast: throw operational error (Return 400/404/500)"]
    CheckTransient -->|"Yes"| CheckAttempts{"Attempt count < 3?"}
    CheckAttempts -->|"No (Max retries exhausted)"| ThrowServiceUnavailable["Throw DatabaseConnectionError (Return 503)"]
    CheckAttempts -->|"Yes"| CalcBackoff["Compute backoff: 150ms -> 400ms -> 900ms + random jitter"]
    CalcBackoff --> Sleep["Async sleep delay"]
    Sleep --> Exec
```

### Security Controls & Boundary Validation

1. **Strict Zod Boundary:** All query string parameters, path parameters, and request payloads are validated via Zod schemas before hitting the service layer. Unknown fields are stripped; type coercion is explicit.
2. **Parameterized Query Execution:** Prisma Client generates parameterized SQL queries for all reads and writes. No string concatenation is used in query building, neutralizing SQL injection vectors.
3. **Secrets Handling:** Secrets (`DATABASE_URL`, `DIRECT_URL`, `OPENROUTER_API_KEY`, `ARTIFICIAL_ANALYSIS_API_KEY`) reside strictly in `.env` and GitHub Actions encrypted secrets. No credentials exist in the client bundle.
4. **Content Security Safe Avatars:** `LabAvatar` generates deterministic, inline SVG data URIs based on lab name hashes. No external third-party image domains are contacted, preventing CSRF image exfiltration.
5. **No `any` Policy:** TypeScript `strict: true` is enforced across the entire repository. Dynamic payloads use `unknown` and require Zod narrowing before attribute access.

### Automated Test Suites

- **API Smoke Suite (`scripts/api-smoke.ts`):**  
  **37 assertions** validating HTTP 200 statuses, JSON envelopes (`success: true`), pagination metadata, model sorting stability, compare matrix calculations, tie-break suppression, default AA benchmark rankings, CORS headers, and Edge CDN `Cache-Control` handling.
- **Pages & E2E Smoke Suite (`scripts/e2e-smoke.ts`):**  
  **15 assertions** executing headless HTTP verification across all application routes (`/`, `/models/[slug]`, `/compare`, `/rankings`, `/benchmarks`, `/labs`, `/providers`, `/sitemap.xml`, `/robots.txt`), confirming zero 500 crashes and proper status codes.
- **Database Integrity Suite (`scripts/verify-data.ts`):**  
  Asserts relational invariants: verifies listable model counts, ensures every model has at least one active provider, checks that `blendedPrice` is correctly computed, and enforces that `scoreBasis` is either `"aa"` or `"vendor"`.

---

## 11. CI/CD & Deployment Pipeline

### Automated CI Workflow

```mermaid
flowchart TD
    Trigger["git push / PR to main"] --> Step1["Validate Secrets<br/>(Assert DATABASE_URL is configured)"]
    Step1 -->|"Missing"| FailEarly["Fail fast with descriptive error message"]
    Step1 -->|"Present"| Step2["npm ci<br/>(Clean deterministic dependency install)"]
    Step2 --> Step3["npx prisma generate<br/>(Generate typed Prisma client)"]
    Step3 --> Step4["npm run typecheck<br/>(tsc --noEmit strict checks)"]
    Step4 --> Step5["npm run lint<br/>(ESLint 9 Next.js rules)"]
    Step5 --> Step6["npm run build<br/>(Prerender ISR pages against Neon CI branch)"]
    Step6 --> Step7["Vercel Production Auto-Deploy<br/>(Deploy to sin1 edge)"]
```

### Git Branch & Commit History

```mermaid
gitGraph
    commit id: "Initial commit"
    commit id: "feat(db): schema & migrations"
    commit id: "feat(seed): OpenRouter ingest"
    commit id: "feat(api): services & routes"
    commit id: "feat(ui): design tokens & shell"
    commit id: "feat(home): SSR hero & bento"
    commit id: "feat(web): compare, rankings, labs"
    commit id: "chore: production hardening"
    commit id: "ci: build on neon ci branch"
    commit id: "feat(seed): AA benchmark ingestion"
    commit id: "feat(scoring): separate score bases"
    commit id: "fix(formatters): clean displayName"
    commit id: "fix(compare): tie-aware best badge"
    commit id: "test: api & e2e smoke verification"
    commit id: "docs: comprehensive README"
```

### Engineering Timeline (Nov 2026)

```mermaid
gantt
    title OneAtlas Engineering Execution Timeline (Nov 2026)
    dateFormat YYYY-MM-DD
    axisFormat %b %d
    section Phase 1 Data & Core
    Schema, Prisma & Migrations :done, p1, 2026-11-22, 2026-11-22
    OpenRouter Catalog Ingestion :done, p2, 2026-11-22, 2026-11-22
    Thin Route Handlers & DTOs   :done, p3, 2026-11-22, 2026-11-22
    section Phase 2 Frontend Surface
    Design Tokens & Shell Layout :done, p4, 2026-11-22, 2026-11-22
    Discovery Table & Bento Grid :done, p5, 2026-11-22, 2026-11-22
    Compare Matrix & Rankings    :done, p6, 2026-11-22, 2026-11-22
    section Phase 3 Production Hardening
    Neon Pooler Retries & ISR    :done, p7, 2026-11-22, 2026-11-23
    CI Workflow & Dedicated DB   :done, p8, 2026-11-22, 2026-11-23
    AA Integration & Score Basis :done, p9, 2026-11-23, 2026-11-23
    Visual QA & Docs Verification:done, p10, 2026-11-23, 2026-11-23
```

---

## 12. Architecture Decision Records (ADRs)

| # | Topic | Decision Made | Alternatives Considered | Trade-off / Justification |
|:---:|:---|:---|:---|:---|
| **01** | **ORM & Schema** | **Prisma 6 (`prisma-client-js`)** | Drizzle ORM, Kysely, Raw pg | Prisma provides strictly typed DTO generation and automated migration files. Slightly higher client bundle weight traded for compile-time safety across all relations. |
| **02** | **Database Engine** | **Neon Serverless PostgreSQL** | AWS RDS Aurora, PlanetScale, Supabase | Neon’s scale-to-zero compute matches cost constraints; instant branch creation enables isolated CI database pipelines with zero schema contamination. |
| **03** | **Boundary Validation** | **Zod 4 with `passthrough()`** | Yup, Valibot, manual guards | Zod offers first-class TypeScript inference. `schema.passthrough()` during API ingestion allows forward-compatible ingestion of new OpenRouter attributes without crashes. |
| **04** | **Pricing Computation** | **Denormalized summary on `Model`** | Runtime SQL `MIN(inputPrice)` joins | Computing `minInputPrice` and `blendedPrice` at seed time enables indexed $O(1)$ sorting in `/api/models`, eliminating multi-table joins on high-traffic listing routes. |
| **05** | **Score Isolation** | **Dual `scoreBasis` ("aa" vs "vendor")** | Normalizing percentage to 100-index | Artificially scaling vendor MMLU-Pro percentages into an Artificial Analysis index creates false mathematical equivalence. Strict isolation maintains truth in data. |
| **06** | **Search Strategy** | **Client `cmdk` + SQL Trigram (`pg_trgm`)** | Meilisearch, Algolia, Elasticsearch | Avoids standing up external search infrastructure. Trigram indexes provide instant sub-5ms fuzzy matching directly in PostgreSQL for catalog sizes under 100k rows. |
| **07** | **Client Data Fetching** | **SWR with URL SearchParams State** | TanStack Query, Redux, Zustand Server | Keeps the browser URL as the single source of truth for all filters and sorting. Enables instant link sharing and bookmarking with zero client-side state divergence. |
| **08** | **Edge CDN Invalidation** | **`s-maxage=60, swr=300` Headers** | On-demand Webhooks, Redis Cache | Vercel Edge CDN caches read routes for 60 seconds with 5-minute background revalidation. Eliminates 95% of database reads while tolerating minor catalog latency. |
| **09** | **Data Visualization** | **Recharts with ResponsiveContainers** | D3.js, Chart.js, Visx | Declarative React SVG rendering matches design tokens and maintains clean accessibility without heavy custom canvas wrappers. |
| **10** | **Regional Alignment** | **Vercel `sin1` + Neon `ap-southeast-1`** | Vercel `iad1` (US East) | Eliminates 180ms cross-Pacific latency between Vercel Serverless compute and Neon database poolers by co-locating both in Singapore. |
| **11** | **Avatar Rendering** | **Deterministic SVG Data URIs** | Gravatar, Clearbit API, Cloudinary | Eliminates external image requests, CORS issues, and image tracking cookies by generating lightweight vector avatars on the fly from lab name hashes. |
| **12** | **CI Prerendering** | **Dedicated Neon "ci" DB Branch** | Mocking database during build | Next.js App Router ISR pages execute database queries during `npm run build`. Prerendering against a dedicated Neon branch guarantees build validity without touching production. |

---

## 13. Engineering Challenges & Incidents

```mermaid
flowchart TD
    subgraph Incidents["10 Production Incidents Encountered & Resolved"]
        I1["1. Neon pooler idle connection dropouts ('kind: Closed')"]
        I2["2. ISR prerendering failure in CI due to missing DB"]
        I3["3. Artificial Analysis index averaged with raw vendor percentages"]
        I4["4. Vercel Edge CDN stripping downstream s-maxage header"]
        I5["5. Compare matrix displaying false positive BEST badges on ties"]
        I6["6. Model table displaying raw vendor prefixes ('SpaceXSI: Grok')"]
        I7["7. Rankings horizontal bar chart rendering in ascending order"]
        I8["8. Pareto scatter plot x-axis rendering single tick '$0.104'"]
        I9["9. Remote smoke tests encountering transient socket reset"]
        I10["10. useSyncExternalStore comparison tray re-render recursion"]
    end
    subgraph Resolutions["Engineered Production Fixes"]
        R1["withRetry Prisma extension + connection warm-up SELECT 1"]
        R2["Dedicated Neon 'ci' branch and GitHub Actions secrets"]
        R3["Model.scoreBasis column + strict split in derived scores"]
        R4["CDN-Cache-Control header + Vercel cache detection logic"]
        R5["Array equality tie-break suppression in findMin/findMaxWinners"]
        R6["Comprehensive displayName() regex stripping with aria preservation"]
        R7["Descending data sort with score values at bar tips"]
        R8["Explicit log-scale ticks ($0.1, $1, $10, $100)"]
        R9["Fetch retry utility with exponential backoff in smoke suite"]
        R10["Cached snapshot reference in useSyncExternalStore"]
    end

    I1 --> R1
    I2 --> R2
    I3 --> R3
    I4 --> R4
    I5 --> R5
    I6 --> R6
    I7 --> R7
    I8 --> R8
    I9 --> R9
    I10 --> R10
```

### Detailed Incident Post-Mortems

#### Incident 1: Neon Serverless Connection Dropout (`kind: Closed`)
- **Symptom:** Server logs spammed with `Error in PostgreSQL connection: Error { kind: Closed, cause: None }` and transient HTTP 500 errors during traffic spikes after idle periods.
- **Root Cause:** Neon serverless compute suspends after 5 minutes of inactivity. When compute wakes up, intermediate PgBouncer pooler sockets terminate abruptly, causing Prisma to throw connection drop errors.
- **Fix:** Implemented a custom Prisma extension (`src/lib/prisma.ts`) wrapping all queries with `withRetry` (retrying only transient error codes `P1001`, `P1002`, `P1008`, `P1017`, `P2024` with exponential backoff). Added `connect_timeout=15&pool_timeout=20` to connection strings and a lightweight `SELECT 1` warm-up query in `src/instrumentation.ts`.
- **Lesson:** Serverless databases require defensive client-side pooling configurations and active warm-up hooks.

#### Incident 2: CI Prerendering Failures Due to Database-Backed ISR
- **Symptom:** GitHub Actions CI failed during `npm run build` with `PrismaClientInitializationError: Can't reach database server at localhost:5432`.
- **Root Cause:** Next.js App Router prerenders static pages with `export const revalidate = 300` during build time. CI had dummy `localhost:5432` credentials, causing prerender workers to crash.
- **Fix:** Created an isolated, dedicated Neon database branch named `ci`. Configured encrypted GitHub repository secrets (`DATABASE_URL`, `DIRECT_URL`) and updated `.github/workflows/ci.yml` to fail fast with a descriptive warning if secrets are absent.
- **Lesson:** In modern Next.js App Router applications, build time is query time. CI pipelines must have access to a real, isolated database branch.

#### Incident 3: Skewed Leaderboard from Blended Benchmark Scales
- **Symptom:** Claude 3.5 Sonnet and GPT-4o ranked below legacy models on the leaderboard.
- **Root Cause:** Artificial Analysis evaluates models on a calibrated 0–100 index where frontier models score ~60–65. Vendor publications self-report raw MMLU-Pro accuracy percentages where models score ~80–90%. Derivation logic averaged these together, penalizing models with rigorous independent benchmarks.
- **Fix:** Added additive migration `20261123060000_add_score_basis` introducing `Model.scoreBasis`. Enforced strict derivation rules: if AA evaluations exist, `scoreBasis = "aa"`; otherwise `scoreBasis = "vendor"`. Disallowed mixed-basis averaging in ranking algorithms and compare winner calculations.
- **Lesson:** Never combine metrics with different statistical methodologies into a single synthetic number.

#### Incident 4: Vercel Edge CDN Stripping Downstream `s-maxage`
- **Symptom:** API smoke tests against production Vercel failed assertion: `Expected s-maxage=60, got public`.
- **Root Cause:** Vercel Edge CDN caches upstream responses matching `s-maxage=60`, but strips the `s-maxage` directive before returning the response to downstream browser clients, leaving only `Cache-Control: public`.
- **Fix:** Added `CDN-Cache-Control: s-maxage=60, stale-while-revalidate=300` (which Vercel Edge preserves) and updated `scripts/api-smoke.ts` to detect the CDN layer via `x-vercel-id` / `x-vercel-cache` headers, verifying `public` downstream while logging cache status.
- **Lesson:** CDN edge proxies actively rewrite standard cache headers; test assertions must differentiate origin responses from edge-cached responses.

#### Incident 5: Compare Matrix False-Positive "BEST" Badges on All-Way Ties
- **Symptom:** In `/compare`, when comparing three models with identical context windows (e.g. 128K), all three columns displayed a green `BEST` badge.
- **Root Cause:** Winner calculation logic looked for `value === max`, which evaluated to true for all items when values were equal.
- **Fix:** Refactored `findMaxWinners` and `findMinWinners` in `src/server/services/compare.ts` to verify if all valid entries are identical; if so, an empty array is returned, suppressing the badge entirely.
- **Lesson:** Comparison UX must differentiate a shared victory from a meaningless universal tie.

#### Incident 6: Provider Prefix Pollution in Model Display Names
- **Symptom:** UI cards and bar charts displayed noisy strings like `SpaceXSI: Grok 4.7` and `OpenAI: o3-mini`.
- **Root Cause:** OpenRouter prefixes certain model names with internal vendor or host tags separated by colons.
- **Fix:** Enhanced `displayName()` in `src/lib/formatters.ts` with regex `^[^:]+:\s*` to strip any leading prefix for UI presentation, while preserving the full unmodified name in `title` and `aria-label` for accessibility.
- **Lesson:** Always decouple cleaned visual display strings from underlying accessible identifiers.

#### Incident 7: Rankings Horizontal Bar Chart Inverted Order
- **Symptom:** The Top 10 rankings horizontal bar chart displayed the #1 ranked model at the very bottom of the chart.
- **Root Cause:** Recharts `BarChart` with `layout="vertical"` plots data arrays from bottom to top by default along the Y-axis.
- **Fix:** Inverted the data array slice in `src/components/charts/Top10BarChart.tsx` and configured explicit SVG text tags displaying numerical scores directly at the tip of each bar.
- **Lesson:** Chart layout libraries often have non-intuitive coordinate systems; visual QA against real data is essential.

#### Incident 8: Log-Scale Scatter Plot Single Tick Anomaly
- **Symptom:** The Intelligence vs. Price scatter plot displayed an unreadable single X-axis tick: `$0.104`.
- **Root Cause:** Recharts automatic tick generation struggled with logarithmic scaling over small non-zero price domains.
- **Fix:** Configured explicit logarithmic ticks in `src/components/charts/ParetoScatterChart.tsx` at `[0.1, 1.0, 10.0, 100.0]`, filtering to those within the dataset’s domain and adding explicit currency formatting.
- **Lesson:** Logarithmic axes require manual tick specification to remain intuitive for end users.

#### Incident 9: Transient Remote Smoke Test Socket Hangup
- **Symptom:** Running `npm run test:api` against remote Vercel production occasionally threw `fetch failed: ECONNRESET` on test 24 of 37.
- **Root Cause:** High-concurrency sequential fetch loops from an international client triggered transient TCP socket resets at intermediate network gateways.
- **Fix:** Wrapped the smoke test HTTP request client in `scripts/api-smoke.ts` with a 3-attempt exponential backoff retry for transient network and socket errors (`ECONNRESET`, `ETIMEDOUT`).
- **Lesson:** Test harnesses executing against live remote endpoints must be as resilient as the production code they test.

#### Incident 10: `useSyncExternalStore` Re-render Loop in Compare Tray
- **Symptom:** Adding models to the compare tray caused intermittent browser warnings regarding nested state updates.
- **Root Cause:** The compare store subscription returned a new array reference on every tick instead of a cached snapshot.
- **Fix:** Implemented shallow array equality caching in `src/lib/compare-store.ts` so `getSnapshot()` returns a stable reference unless items are added or removed.
- **Lesson:** External store subscriptions in React 19 must guarantee referential stability on unchanged snapshots.

---

## 14. AI-Assisted Development Transparency

OneAtlas was designed, implemented, and hardened using autonomous agentic workflows powered by **Antigravity** (Google DeepMind).

- **Role of the Agent:**  
  The agent served as Staff Full-Stack Engineer, authoring database schemas, implementing thin REST route handlers, constructing fat server services, building React 19 UI components with Tailwind 4, writing end-to-end smoke tests, diagnosing Neon connection dropouts, and auditing accessibility.
- **Verification & Guardrails:**  
  1. *Zero Fabrications:* Every benchmark score and model specification was verified by `curl`ing live APIs (OpenRouter and Artificial Analysis) before authoring seed code.
  2. *Compile-Time Enforcement:* Every implementation step was verified with `npx tsc --noEmit && npm run lint`.
  3. *Deterministic Matching:* Fuzzy matching between Artificial Analysis models and OpenRouter catalog models was constrained by token-set algorithms and reviewed overrides in `aa-manual-map.json`.
  4. *Human-Explainable Code:* Code was kept deliberately explicit, avoiding overly clever metaprogramming so that the repository owner can defend every architectural choice in technical interviews.

---

## 15. Engineering Roadmap

```mermaid
quadrantChart
    title OneAtlas Engineering Roadmap: Impact vs Effort
    x-axis Low Effort --> High Effort
    y-axis Low Impact --> High Impact
    quadrant-1 High Priority / Strategic
    quadrant-2 Major Capital Projects
    quadrant-3 Low Value / Defer
    quadrant-4 Quick Wins / Immediate
    Streaming RSC for Stats Bento: [0.25, 0.85]
    LCP Font & Asset Preload: [0.18, 0.75]
    Automated Nightly Seed Cron: [0.22, 0.80]
    Shareable Compare OG Card Image: [0.35, 0.65]
    Edge Rate Limiting: [0.30, 0.70]
    Real-Time Provider Uptime Probing: [0.65, 0.85]
    User Saved Model Collections: [0.75, 0.60]
    Multi-Currency Token Conversion: [0.55, 0.40]
```

### Prioritized Milestones

| Target | Milestone | Scope & Deliverables |
|:---:|:---|:---|
| **P0** | **LCP Optimization (< 2.0s)** | Wrap hero statistics bento in React `Suspense`; stream catalog totals asynchronously; add preload links for Geist Sans font subsets to eliminate LCP delay. |
| **P0** | **Automated Ingestion Cron** | Implement a scheduled GitHub Actions cron or Vercel Cron invoking an authenticated endpoint (`/api/cron/sync`) to refresh OpenRouter pricing nightly. |
| **P1** | **Dynamic OG Card Generation** | Implement `@vercel/og` to dynamically generate OpenGraph comparison cards (`/api/og/compare?models=a,b`) for social link sharing. |
| **P1** | **Edge Rate Limiting** | Integrate `@upstash/ratelimit` on `/api/models` and `/api/search` routes to protect the serverless pool from DDoS spikes. |
| **P2** | **Live Provider Probing** | Deploy lightweight global edge workers executing live synthetic token completions every 15 minutes to measure actual provider TTFT (time-to-first-token). |
| **P3** | **User Workspaces & Collections** | Authenticated user accounts via Clerk or Auth0 allowing engineering teams to save custom model evaluation tiers and export CSV budgets. |

---

## 16. Local Setup & Reproduction

### Prerequisites

- **Node.js:** `v20.x` or higher
- **Package Manager:** `npm v10.x` or higher
- **Database:** PostgreSQL database instance (local PostgreSQL or [Neon](https://neon.tech))
- **API Keys (Optional for re-seeding):** OpenRouter API key, Artificial Analysis API key

### Environment Configuration

Create a `.env` file in the repository root by copying the template:

```bash
cp .env.example .env
```

| Variable | Required | Description | Example Format |
|:---|:---:|:---|:---|
| `DATABASE_URL` | **Yes** | Pooled PostgreSQL connection string (PgBouncer) | `postgresql://user:pass@host-pooler.neon.tech/neondb?sslmode=require&connect_timeout=15&pool_timeout=20` |
| `DIRECT_URL` | **Yes** | Direct unpooled PostgreSQL connection string for migrations | `postgresql://user:pass@host.neon.tech/neondb?sslmode=require` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical web application URL | `http://localhost:3000` or `https://oneatlas-lovat.vercel.app` |
| `OPENROUTER_API_KEY` | Optional | Ingestion key for refreshing OpenRouter catalog | `sk-or-v1-...` |
| `ARTIFICIAL_ANALYSIS_API_KEY` | Optional | Ingestion key for refreshing Artificial Analysis benchmarks | `aa_api_key_...` |

### Step-by-Step Installation

```bash
# 1. Clone repository
git clone https://github.com/adarshthakur9240/oneatlas.git
cd oneatlas

# 2. Install dependencies
npm ci

# 3. Apply database migrations
npm run db:migrate

# 4. Ingest and seed real catalog data
npm run db:seed

# 5. Verify database integrity
npm run db:verify

# 6. Start local development server
npm run dev
# Server listening at http://localhost:3000
```

### Complete NPM Scripts Reference

| Command | Action |
|:---|:---|
| `npm run dev` | Starts Next.js development server with Turbopack. |
| `npm run build` | Generates Prisma client, checks types, and compiles production build. |
| `npm run start` | Boots the compiled production server. |
| `npm run typecheck` | Executes `tsc --noEmit` across all TypeScript files. |
| `npm run lint` | Runs ESLint 9 checks. |
| `npm run db:migrate` | Deploys pending Prisma schema migrations via `DIRECT_URL`. |
| `npm run db:seed` | Runs cached OpenRouter & Artificial Analysis ingestion pipeline. |
| `npm run db:seed:refresh` | Bypasses local `.cache/` and fetches fresh payloads from external APIs. |
| `npm run db:verify` | Asserts data integrity, relational counts, and scoreBasis invariants. |
| `npm run db:studio` | Opens Prisma Studio visual GUI at `http://localhost:5555`. |
| `npm run test:api` | Runs 37-assertion end-to-end API smoke test suite. |
| `npm run test:pages` | Runs 15-assertion headless HTTP route verification suite. |
| `npm run docs:check` | Verifies that all local images and assets referenced in `README.md` exist. |

### Repository Structure (Depth 3)

```
oneatlas/
├── docs/
│   ├── assets/
│   │   └── banner.svg                # Vector banner with brand palette
│   ├── screens/                      # 16 verified application screenshots + demo GIF
│   ├── DEPLOY.md                     # Production deployment & pooling parameters
│   ├── runbook.md                    # Operational incident recovery runbook
│   ├── model-selection-playbook.md   # Model selection guide by engineering phase
│   └── token-optimization-guide.md   # Token consumption efficiency strategies
├── prisma/
│   ├── migrations/                   # Tracked PostgreSQL migration files
│   ├── schema.prisma                 # Relational database schema definition
│   └── seed/
│       ├── index.ts                  # Main seed orchestration runner
│       ├── openrouter.ts             # OpenRouter catalog ingestion & pricing denorm
│       ├── benchmarks.ts             # Curated benchmarks & AA ingestion logic
│       └── data/                     # Reviewed override maps (aa-manual-map.json)
├── public/                           # Static assets, favicon, and app icons
├── scripts/
│   ├── api-smoke.ts                  # 37-assertion API smoke test suite
│   ├── e2e-smoke.ts                  # 15-assertion page verification test suite
│   ├── verify-data.ts                # PostgreSQL relational invariant assertion script
│   ├── dry-run-seed.ts               # Preview seed processing without writing to DB
│   └── check-readme-assets.ts        # README local asset link validation script
├── src/
│   ├── app/                          # Next.js App Router surface
│   │   ├── api/                      # 14 typed Route Handlers
│   │   ├── models/[slug]/            # Model specification deep dive
│   │   ├── compare/                  # Multi-model comparison matrix
│   │   ├── rankings/                 # Intelligence leaderboard & charts
│   │   ├── benchmarks/               # Methodology reference catalog
│   │   ├── labs/                     # AI research labs directory & profiles
│   │   ├── providers/                # Host providers directory & profiles
│   │   ├── layout.tsx                # Root layout, Navbar, Palette, CompareTray
│   │   ├── page.tsx                  # Home page RSC
│   │   ├── loading.tsx               # Zero layout-shift skeleton fallback
│   │   ├── error.tsx                 # Client error boundary with retry
│   │   ├── sitemap.ts                # Dynamic XML sitemap generation
│   │   └── robots.ts                 # Robots.txt configuration
│   ├── components/
│   │   ├── charts/                   # Recharts Top10BarChart & ParetoScatterChart
│   │   ├── compare/                  # CompareClient, Presets, AttributeRows
│   │   ├── home/                     # StatsBento, DiscoveryToolbar, HeroSection
│   │   ├── layout/                   # Navbar, Footer, CommandPalette, CompareTray
│   │   ├── models/                   # ModelCard, ModelTable, CostCalculator
│   │   ├── rankings/                 # RankingsClient, LeaderboardTable
│   │   └── ui/                       # Accessible design primitives (Badge, Chip, Kbd, etc.)
│   ├── lib/
│   │   ├── compare-store.ts          # Zustand compare tray selection state
│   │   ├── formatters.ts             # formatPrice, formatContext, displayName
│   │   ├── prisma.ts                 # Prisma Client singleton with withRetry extension
│   │   ├── url.ts                    # Dynamic canonical base URL resolution
│   │   └── validators.ts             # Zod schemas for query parameters
│   ├── server/services/              # Fat business logic layer (8 domain services)
│   ├── types/api.ts                  # Shared DTOs, response envelopes, pagination types
│   └── instrumentation.ts            # Server boot hook for database warm-up
├── .github/workflows/
│   └── ci.yml                        # GitHub Actions CI workflow definition
├── LICENSE                           # MIT License
├── package.json                      # Pinned dependencies and scripts
└── tsconfig.json                     # Strict TypeScript configuration
```

---

## 17. Walkthrough Video

A comprehensive technical walkthrough and live product demonstration covering the platform architecture, multi-model comparison matrix with tie suppression, Artificial Analysis rankings isolation, and production deployment is available at:

<div align="center">

[![Watch Walkthrough](https://img.shields.io/badge/Loom_Walkthrough-Watch_Video-625df5?style=for-the-badge&logo=loom&logoColor=white)](https://www.loom.com/share/c26d9ec5de514948b982c1fa8c09addd)

### **[Watch the OneAtlas Technical Walkthrough on Loom (5 min)](https://www.loom.com/share/c26d9ec5de514948b982c1fa8c09addd)**

*(Walkthrough covers: Catalog Discovery · Command Palette · Comparison Matrix with Tie Suppression · Artificial Analysis Rankings · Neon Serverless Pooling · CI Architecture)*

</div>

---

## 18. Frequently Asked Questions (FAQ)

#### Q1: Why does OneAtlas maintain two distinct score bases instead of normalizing them?
**A:** Artificial Analysis calculates a calibrated, empirical Intelligence Index where top frontier models score between 60 and 65. Vendor publications self-report MMLU-Pro or GPQA accuracy percentages where models score between 80% and 90%. Mathematically normalizing or averaging these distinct metrics creates false equivalence—an older model with self-reported 85% vendor scores would outrank a frontier model with an AA score of 63. OneAtlas isolates these via `Model.scoreBasis = "aa" | "vendor"`.

#### Q2: What formula is used to calculate `blendedPrice`?
**A:** `blendedPrice = (3 * minInputPrice + minOutputPrice) / 4`. This represents a standard 3:1 token consumption pattern (reading three prompt tokens for every generated completion token), offering engineering teams an accurate heuristic for expected workload costs per 1M tokens.

#### Q3: How does the compare matrix prevent misleading winner badges on ties?
**A:** When comparing multiple models across attributes like Context Window or Price, if all compared models share identical values (e.g. all have 128K context), `findMaxWinners()` detects universal equality and returns an empty list, completely suppressing the green `BEST` badge.

#### Q4: Why are prices stored as USD per 1M tokens instead of per 1k tokens?
**A:** Frontier LLM inference pricing has dropped significantly over the past 24 months, with several fast models (e.g. Gemini 1.5 Flash, Llama 3.2 1B) charging under $0.0001 per 1k tokens. Storing prices per 1M tokens eliminates floating-point rounding errors and aligns with modern industry standards.

#### Q5: How does the platform handle serverless database compute suspension?
**A:** Neon serverless compute auto-suspends during idle periods. OneAtlas handles this through two mechanisms: (1) Next.js `src/instrumentation.ts` runs a `SELECT 1` warm-up query during server initialization, and (2) `src/lib/prisma.ts` wraps all database operations in a custom `withRetry` extension that retries transient disconnects up to 3 times with exponential backoff and random jitter.

#### Q6: Why did CI require a dedicated Neon database branch?
**A:** Next.js App Router pre-renders static and ISR pages (`revalidate = 300`) during `npm run build`. This requires active database queries during compilation. Providing a dedicated Neon `ci` branch allows CI runners to execute production builds against real schema data without risk of mutating production records.

#### Q7: Why are only 42 models displaying derived intelligence scores?
**A:** Out of 448 models in the OpenRouter catalog, only 42 models have been rigorously evaluated by Artificial Analysis or have verified, cited vendor publications for standardized benchmarks (MMLU-Pro, GPQA, SWE-bench). In adherence to our strict data integrity rules, unknown values remain `null` and are never synthesized.

#### Q8: What does `displayName()` do and why is it necessary?
**A:** OpenRouter model names often include internal host or lab prefixes (e.g. `SpaceXSI: Grok 4.7`, `OpenAI: o3-mini`). `displayName()` strips leading colon prefixes for clean UI cards and chart axis labels, while preserving the full unmodified name in HTML `title` and `aria-label` tags for screen readers.

#### Q9: How is full-text search implemented without external services?
**A:** Search utilizes PostgreSQL `ILIKE` queries accelerated by the `pg_trgm` trigram indexing extension on model names and descriptions. For catalog sizes under 100,000 rows, this returns results in under 5 ms, avoiding the cost and complexity of standing up Elasticsearch or Algolia.

#### Q10: How can I run the automated API smoke test suite against production?
**A:** Execute:
```bash
API_BASE_URL="https://oneatlas-lovat.vercel.app" npm run test:api
```
This runs all 37 assertions directly against the production edge CDN deployment.

---

## 19. Acknowledgements & Attribution

### Author

Built and engineered by **Adarsh Thakur** ([@adarshthakur9240](https://github.com/adarshthakur9240)).

### Primary Data Sources & Attributions

- **[OpenRouter](https://openrouter.ai):** Model catalog, active endpoint listings, token pricing, and context limits ingested via the OpenRouter API.
- **[Artificial Analysis](https://artificialanalysis.ai):** Independent evaluation indices, latency metrics, and throughput measurements.  
  *Benchmark data: Artificial Analysis. Independent evaluation indices, latency, and throughput metrics are ingested under attribution terms.*
- **Vendor Publications:** Evaluated scores for MMLU-Pro, GPQA, SWE-bench, LiveCodeBench, and Chatbot Arena Elo cited from technical reports by OpenAI, Anthropic, Google DeepMind, Meta AI, DeepSeek, Mistral AI, and LMSYS.

### Core Open Source Technologies

- [Next.js](https://nextjs.org) (App Router, Turbopack, Route Handlers)
- [React 19](https://react.dev) (Server Components, Actions, Suspense)
- [TypeScript](https://www.typescriptlang.org) (Strict compile-time validation)
- [Tailwind CSS 4](https://tailwindcss.com) (Modern CSS token framework)
- [Prisma 6](https://www.prisma.io) (Type-safe PostgreSQL ORM)
- [Neon](https://neon.tech) (Serverless PostgreSQL with instant branching)
- [Zod 4](https://zod.dev) (Declarative schema parsing and coercion)
- [Recharts](https://recharts.org) (Declarative SVG data visualizations)
- [cmdk](https://cmdk.paco.me) (Fast accessible command palette primitives)
- [SWR](https://swr.vercel.app) (Stale-while-revalidate client fetching)
- [Vercel](https://vercel.com) (Edge network hosting and deployment)

---

<div align="center">

### License

Released under the **[MIT License](LICENSE)**.

Copyright &copy; 2026 Adarsh Thakur. All rights reserved.

</div>
