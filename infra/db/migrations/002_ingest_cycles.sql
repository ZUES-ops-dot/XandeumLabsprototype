-- Migration: Add ingest_cycles table for tracking ingestion metrics and quality scores

CREATE TABLE IF NOT EXISTS ingest_cycles (
  id BIGSERIAL,
  source TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  duration_ms INTEGER NOT NULL,
  pnodes_fetched INTEGER NOT NULL DEFAULT 0,
  pnodes_valid INTEGER NOT NULL DEFAULT 0,
  pnodes_invalid INTEGER NOT NULL DEFAULT 0,
  quality_score REAL NOT NULL DEFAULT 0,
  total_issues INTEGER NOT NULL DEFAULT 0,
  issue_summary JSONB,
  error_message TEXT,
  PRIMARY KEY (id, started_at)
);

CREATE INDEX IF NOT EXISTS ingest_cycles_source_time
  ON ingest_cycles(source, started_at DESC);

CREATE INDEX IF NOT EXISTS ingest_cycles_time
  ON ingest_cycles(started_at DESC);

CREATE INDEX IF NOT EXISTS ingest_cycles_quality
  ON ingest_cycles(quality_score);

SELECT create_hypertable('ingest_cycles', 'started_at', if_not_exists => TRUE);

-- Add quality_score column to pnode_gossip_snapshots for per-record scoring
ALTER TABLE pnode_gossip_snapshots 
  ADD COLUMN IF NOT EXISTS quality_score REAL,
  ADD COLUMN IF NOT EXISTS issues TEXT[];

-- Add data_quality columns to network_overview for aggregated metrics
ALTER TABLE network_overview
  ADD COLUMN IF NOT EXISTS avg_quality_score REAL,
  ADD COLUMN IF NOT EXISTS total_ingest_cycles INTEGER,
  ADD COLUMN IF NOT EXISTS last_ingest_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issues_last_hour JSONB;
