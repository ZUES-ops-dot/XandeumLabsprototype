# Xandeum pNode Analytics Platform -- MVP Build Plan

## 1) Outcomes (MVP)
- Discover pNodes visible via gossip (continuous snapshots)
- Persist append-only raw snapshots and canonical pNode state
- Compute and serve core network analytics (overview + history) with <200ms cached API reads
- Provide a dark-first dashboard UI:
  - Network Overview
  - pNode Explorer
  - pNode Detail
- Run locally via Docker Compose and be deployable with environment-based config

## 2) Scope / Non-Scope
### In-scope
- Gossip snapshot ingestion (polling)
- Snapshot diffing (new/removed/changed)
- Basic aggregations:
  - total/active pNodes
  - version distribution
  - presence over time (as a proxy for uptime)
  - churn (added/removed within windows)
- REST API + optional SSE for “last update” + overview refresh
- Postgres + TimescaleDB (single DB for relational + time-series)

### Out-of-scope (initial MVP)
- Stake / delegation resolution (chain awareness)
- Reputation scoring and alerting hooks
- ClickHouse (unless needed later)

## 3) Repo Layout (Monorepo)
```
apps/
  web/               # Next.js (App Router)
  api/               # Fastify BFF
services/
  indexer/           # pNode discovery + snapshot ingestion
  analytics/         # rollups / materializations
packages/
  shared/            # shared types, validators, utilities
infra/
  db/                # migrations, seeds
```

## 4) Core Services
### 4.1 Indexer (pNode Indexer Service)
**Goal:** ingest gossip snapshots continuously.

Responsibilities
- Poll configured gossip endpoints on an interval
- Parse/validate payload shape
- Write append-only raw snapshot rows
- Upsert canonical pNode record (idempotent)
- Emit a lightweight “snapshot created” marker (DB row + optional pub/sub later)

Reliability requirements
- Stateless
- Retry-safe; exponential backoff on network failures
- Idempotent writes per `(source, observed_at, pubkey)`

### 4.2 Analytics Engine
**Goal:** turn snapshots into fast queryable rollups.

Jobs (MVP)
- `network_overview_rollup` (every 30–60s)
- `network_history_rollup` (1m buckets for 24h; 1h buckets for 30d)
- `version_distribution_rollup`
- `pnode_presence_rollup` (presence buckets per pNode)

Notes
- All derived tables are rebuildable from append-only raw data.

### 4.3 API / BFF (Fastify)
Endpoints (MVP)
- `GET /health`
- `GET /pnodes?query=&status=&version=&region=&sort=&page=&pageSize=`
- `GET /pnodes/:pubkey`
- `GET /network/overview`
- `GET /network/history?window=24h|7d|30d&bucket=1m|5m|1h|1d`
- `GET /network/versions`
- (Optional) `GET /events` (SSE) emits `overview_updated` + `last_snapshot`

Cross-cutting
- Response caching (ETag/Cache-Control + in-process cache)
- Rate limiting
- Schema versioning via `X-Api-Version`

## 5) Data Layer
### 5.1 Database Choice
Use **TimescaleDB** (Postgres + time-series). This satisfies:
- Relational canonical entities
- Time-series hypertables for snapshots/rollups

### 5.2 Tables (initial)
Canonical
- `pnodes`
  - `pubkey TEXT PRIMARY KEY`
  - `first_seen_at TIMESTAMPTZ NOT NULL`
  - `last_seen_at TIMESTAMPTZ NOT NULL`
  - `current_address TEXT`
  - `current_version TEXT`
  - `current_capabilities JSONB`
  - `current_metadata JSONB`

Append-only raw
- `pnode_gossip_snapshots` (hypertable)
  - `id BIGSERIAL PRIMARY KEY`
  - `source TEXT NOT NULL`
  - `observed_at TIMESTAMPTZ NOT NULL`
  - `pubkey TEXT NOT NULL`
  - `address TEXT`
  - `version TEXT`
  - `capabilities JSONB`
  - `raw JSONB NOT NULL`
  - unique index: `(source, observed_at, pubkey)`

Derived / rollups
- `network_overview` (single row, overwritten)
- `network_history_buckets` (hypertable)
  - `(bucket_start, bucket_size, window)` + metrics
- `version_distribution_buckets` (hypertable)
- `pnode_presence_buckets` (hypertable)

### 5.3 Guarantees
- Append-only raw data
- Derived tables can be truncated & rebuilt
- Full audit trail per pNode via snapshots

## 6) Frontend (Next.js)
### Pages
- `/` Network Overview
- `/pnodes` Explorer
- `/pnodes/[pubkey]` Detail

### UI requirements
- Dark-first, high-contrast, data-dense
- Fast initial load (RSC where appropriate)
- Client charts for history (Recharts or lightweight alternative)

## 7) Observability & Security
Observability
- Structured JSON logs in all services
- Health endpoint for each service
- Basic metrics scaffold (future: Prometheus)

Security
- Read-only network interactions
- Strict input validation on API
- No secrets in repo; `.env` driven config

## 8) Deployment
Local
- `docker-compose.yml` runs TimescaleDB
- Services run with node locally (or docker later)

Staging/Prod (recommended MVP path)
- Web: Vercel
- API + workers: Fly.io or Railway
- DB: managed Postgres/Timescale

## 9) Milestones
- M1: Repo scaffold + DB + migrations + docker compose
- M2: Indexer writes snapshots + canonical `pnodes`
- M3: Analytics rollups + BFF endpoints
- M4: Next.js UI pages consuming API
- M5: Hardening (caching, rate-limit, retries) + deployment docs

## 10) Open Questions / Inputs Needed
- Exact pRPC gossip endpoint(s) and payload schema
- How to determine “online/offline” semantics (presence window thresholds)
- Any official Xandeum branding tokens (hex colors, fonts, logo)

## 11) “Perfect Platform” Roadmap
Extending beyond the MVP, the following initiatives would evolve Xandeum pNode Analytics into a production-grade observability suite. Each item is additive to the current architecture and assumes continued use of the monorepo + Timescale foundation.

### 11.1 Data & Pipeline Enhancements
1. **Unified telemetry bus:** Introduce a broker (NATS/Kafka) between the indexer and downstream services so ingestion can scale horizontally before persistence.
2. **Historical analytics warehouse:** Stream rollups into ClickHouse/BigQuery for multi-week/month cohort and retention analysis.
3. **Realtime push channel:** Add websocket/SSE endpoints in the API to broadcast live node joins/leaves instead of relying solely on polling.
4. **Data quality scoring:** Implement validators that flag stale/inconsistent snapshots and surface confidence scores in API responses/UI.
5. **Synthetic gossip harness:** Create a simulator that replays or fabricates gossip to stress-test ingest and analytics deterministically.

### 11.2 Platform Features
6. **pNode detail deep-dives:** Build `/pnodes/[pubkey]` dashboards with uptime, latency, geo, and version history visualizations powered by richer queries.
7. **Alerting & notifications:** Allow users to subscribe to conditions (node offline, version regression) with delivery via email/Slack/PagerDuty.
8. **Operator metadata & verification:** Support signed metadata submissions so operators can publish contact info, infra details, and verification proofs stored in `current_metadata`.
9. **Advanced Explorer filtering:** Add multi-select filters, saved searches, and cohort comparison tools for power users.
10. **Automated data exports:** Provide scheduled CSV/Parquet dumps and webhooks so partners can ingest analytics downstream.

### 11.3 API & Access
11. **GraphQL + persisted queries:** Layer a public GraphQL API on top of Fastify to support flexible querying with schema validation.
12. **RBAC & API keys:** Gate sensitive endpoints via role-based access and issue scoped keys/tokens for external integrations.
13. **CLI toolkit:** Ship `@xandeum/cli` so operators can inspect nodes, submit metadata, or tail analytics from terminals with the same API primitives.

### 11.4 Frontend & UX
14. **Live telemetry widgets:** Add realtime HUD components (mini-maps, event tickers) driven by the push channel.
15. **Mobile-responsive dashboards:** Optimize layouts and component density for tablet/phone monitoring on-call.
16. **Documentation portal:** Publish a docs site (Nextra/Docusaurus) covering APIs, schema, deployment flows, and branding guidelines.

### 11.5 Reliability & Operations
17. **Full observability stack:** Instrument services with OpenTelemetry, aggregate traces/logs/metrics (Grafana Tempo/Loki/Prometheus) for SLO tracking.
18. **Horizontal scaling strategy:** Containerize API/indexer/analytics, add Kubernetes manifests, and move env management into a centralized config package.
19. **Security hardening:** Implement per-IP rate limits, audit logging, and automated dependency scanning (Dependabot/Snyk) across the monorepo.
20. **Caching/CDN strategy:** Introduce ISR/edge caching for non-live web routes and front the API with a CDN or Fastify-level caching middleware.

Each initiative can be scheduled into future milestones (M6+) and mapped to service owners, ensuring the platform matures responsibly while maintaining the MVP foundation.
