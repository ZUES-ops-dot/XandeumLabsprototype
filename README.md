# Xandeum pNode Analytics

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)
![Fastify](https://img.shields.io/badge/Fastify-API-000000?logo=fastify&logoColor=white)
![TimescaleDB](https://img.shields.io/badge/TimescaleDB-time--series-FDB515)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

> Time-series analytics platform for the Xandeum pNode network. Ingests gossip from peer nodes, validates payloads, persists canonical state in TimescaleDB, and serves real-time network insights through a Next.js dashboard.

**[Architecture](#architecture)** · **[Quick Start](#quick-start)** · **[Monorepo layout](#monorepo-layout)**

---

## What problem this solves

The Xandeum pNode network needs operator-grade visibility: which nodes are up, who's missing gossip rounds, where rollups are bottlenecking, and how stake is distributed over time. This monorepo builds the full stack -- ingestion, indexing, storage, BFF API, and a dashboard -- with each concern split into its own service for independent scaling.

## Highlights

- **TimescaleDB-first persistence** -- pNode events are append-only and time-series-shaped; using a hypertable from day one avoids retro-fitting later
- **Service split, not service-mesh** -- three Node services (`api`, `indexer`, `analytics`) and a Next.js dashboard, all in one monorepo for shared types
- **Validated ingestion** -- `services/indexer` validates every gossip payload via shared Zod schemas before write
- **Materialized rollups** -- `services/analytics` builds continuous aggregates so the dashboard never scans raw rows
- **Shared kernel** -- `packages/shared` exposes types, Zod validators, and result helpers; `packages/database` wraps TimescaleDB connection + migrations; `packages/logger` wraps pino
- **Local-first DX** -- `npm run db:up` brings up TimescaleDB via Docker; everything else runs with `npm run dev`

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│  pNode network (gossip protocol)                               │
└──────────────────────────┬────────────────────────────────────┘
                           ▼
                ┌──────────────────────┐
                │  services/indexer    │
                │  • polls gossip      │
                │  • validates schema  │
                │  • writes raw events │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  TimescaleDB         │
                │  hypertable          │
                │  (raw + rollups)     │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  services/analytics  │
                │  • continuous        │
                │    aggregates        │
                │  • materialized      │
                │    rollups           │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  apps/api (Fastify)  │
                │  BFF for dashboard   │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │  apps/web (Next.js)  │
                │  pNode dashboard     │
                └──────────────────────┘
```

## Tech stack

| Layer | Tech |
|-------|------|
| API | Fastify (BFF for dashboard) |
| Indexer | Node 20, custom gossip poller, Zod validation |
| Analytics | Continuous-aggregate jobs against TimescaleDB |
| Storage | TimescaleDB (Postgres extension), `node-postgres` |
| Frontend | Next.js 14 App Router, Tailwind |
| Shared | Zod, pino, type-only packages |
| Infra | Docker Compose for local TimescaleDB |
| Build | npm workspaces |

## Quick Start

```bash
git clone https://github.com/ZUES-ops-dot/XandeumLabsprototype.git
cd XandeumLabsprototype
npm install

# Start TimescaleDB locally
npm run db:up

# Apply migrations
npm run db:migrate

# Run all services in dev mode (parallel)
npm run dev
```

The dashboard runs on <http://localhost:3000>, the API on <http://localhost:4000>.

### Production build

```bash
npm run build
npm run start
```

## Monorepo layout

```
apps/
  api/                Fastify BFF -- pNode data and network metrics
  web/                Next.js App Router dashboard
services/
  indexer/            Polls gossip sources, validates payloads, writes snapshots
  analytics/          Builds rollups and materialized views
packages/
  shared/             Types, Zod validators, utilities
  database/           Database helpers and migrations
  logger/             Structured logging utilities (pino)
infra/
  db/                 SQL migrations and TimescaleDB Docker compose
```

## Configuration

Each service reads from its own `.env`. Common variables:

| Variable | Where | Purpose |
|----------|-------|---------|
| `DATABASE_URL` | indexer / analytics / api | TimescaleDB connection |
| `GOSSIP_ENDPOINTS` | indexer | Comma-separated peer URLs |
| `INDEXER_POLL_MS` | indexer | Poll interval |
| `LOG_LEVEL` | all | pino level |
| `API_PORT` | api | Default 4000 |
| `NEXT_PUBLIC_API_URL` | web | BFF URL |

## Roadmap

See [Issues](https://github.com/ZUES-ops-dot/XandeumLabsprototype/issues) -- pNode performance heatmap, timezone offsets on dashboard charts, consolidated DB client wrappers, peer-discovery resilience.

## License

MIT -- see [LICENSE](LICENSE).
