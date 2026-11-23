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

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
