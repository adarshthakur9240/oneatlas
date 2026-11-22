# OneAtlas — Agent Rules

Product: AI model discovery & intelligence platform (reference: oneatlas.dev, OpenRouter).
Source of truth for scope: docs/blueprint.md. Assignment: docs/assignment.pdf.

## Stack (mandatory, do not substitute)
Next.js App Router + React + TypeScript (strict) + TailwindCSS · Node route handlers under src/app/api
PostgreSQL (Neon) + Prisma 6 (classic prisma-client-js) · Zod for ALL external input.

## Hard rules
- NEVER hardcode model/lab/provider/benchmark data in the frontend. Everything comes from Postgres via typed API routes.
- NEVER fabricate data. Unknown => null. Benchmarks need a sourceUrl.
- No TODOs, no dead code, no unused files, no `any` (use `unknown` + Zod).
- Prices are stored as USD per 1M tokens. Use tabular-nums + mono font for numbers in UI.
- Secrets only in .env (gitignored). Keep .env.example current.
- Conventional commits (feat:, fix:, chore:, docs:, refactor:). Small atomic commits. Do not push; the owner pushes.
- Before finishing any task run: npx tsc --noEmit && npm run lint (and npm run build when UI changes).
- After each task, end with an "Interview Defense Brief": what was built, why this design vs alternatives, 2 tough questions + 30s answers.

## Owner context
Owner (Adarsh) must be able to explain every line in a Loom + interview. Prefer simple, explicit code over clever abstractions.
