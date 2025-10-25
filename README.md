# Xandeum Labs Prototype

Monorepo for the Xandeum pNode analytics prototype. It includes the API, indexer, analytics workers, shared packages, and infrastructure scaffolding used to ingest pNode gossip, persist canonical state, and serve network insights.

## Structure
- `apps/`
  - `api/` – Fastify BFF for pNode data and network metrics.
  - `web/` – Next.js (App Router) dashboard.
- `services/`
  - `indexer/` – Polls gossip sources, validates payloads, and writes snapshots.
  - `analytics/` – Builds rollups and materialized views.
- `packages/`
  - `shared/` – Types, validation, and utilities.
  - `database/` – Database helpers and migrations.
  - `logger/` – Structured logging utilities.
- `infra/`
  - `db/` – Database migrations and local TimescaleDB Docker setup.

## Prerequisites
- Node.js 20+
- npm 10+
- Docker (for local TimescaleDB via `docker compose`)

## Setup
```bash
npm install
```

### Local services
- Database: `npm run db:up`
- API dev: `npm run dev:api`
- Indexer dev: `npm run dev:indexer`
- Analytics dev: `npm run dev:analytics`
- Web dev: `npm run dev:web`
- All dev services concurrently: `npm run dev`

## Quality
- Type check: `npm run typecheck`
- Clean build artifacts: `npm run clean`

## Notes
- Environment variables are expected via `.env` files (see `.gitignore`); secrets should not be committed.
- Logs are structured JSON by default in production for consistent ingestion.
