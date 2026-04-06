# ProofDesk Workspace

## Overview

ProofDesk is an AI-powered contract and document review SaaS. Users upload contracts and get instant AI analysis: risk highlights, plain-English summaries, specific findings with severity levels, and actionable recommendations.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: Replit AI Integrations (OpenAI) — `AI_INTEGRATIONS_OPENAI_BASE_URL` + `AI_INTEGRATIONS_OPENAI_API_KEY`
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Recharts

## Artifacts

- `artifacts/proofdesk` — Main React frontend (ProofDesk web app), served at `/`
- `artifacts/api-server` — Express backend API, served at `/api`

## Key Features

- **AI Document Analysis** — `/api/documents/:id/analyze` uses GPT-5 to analyze contracts
- **Dashboard** — Real-time stats, activity feed, risk breakdown charts
- **Document Library** — Upload, view, delete documents with risk status
- **Findings** — All findings across docs, filterable by severity
- **Landing Page** — Marketing page at `/` with pricing tiers

## Database Tables

- `documents` — Uploaded contracts with status, risk, summary, finding counts
- `findings` — AI-generated findings per document (severity, category, description, recommendation)
- `activity` — Activity log (uploaded, analyzed, finding_added events)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Routes

### Frontend
- `/` — Landing/marketing page
- `/dashboard` — Dashboard with stats and charts
- `/documents` — Document library with upload
- `/documents/:id` — Document review with findings
- `/findings` — All findings, filterable by severity

### API
- `GET /api/dashboard/summary` — Dashboard stats
- `GET /api/dashboard/recent-activity` — Activity feed
- `GET /api/dashboard/risk-breakdown` — Risk breakdown by severity/category/type
- `GET/POST /api/documents` — List / create documents
- `GET/DELETE /api/documents/:id` — Get / delete document
- `POST /api/documents/:id/analyze` — Trigger AI analysis
- `GET /api/documents/:id/review` — Get full review with findings
- `GET /api/findings` — List findings (filterable by severity, documentId)
