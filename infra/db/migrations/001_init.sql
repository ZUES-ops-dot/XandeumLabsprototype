CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS pnodes (
  pubkey TEXT PRIMARY KEY,
  first_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  current_address TEXT,
  current_version TEXT,
  current_capabilities JSONB,
  current_metadata JSONB
);

CREATE TABLE IF NOT EXISTS pnode_gossip_snapshots (
  id BIGSERIAL,
  source TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  pubkey TEXT NOT NULL,
  address TEXT,
  version TEXT,
  capabilities JSONB,
  raw JSONB NOT NULL,
  PRIMARY KEY (id, observed_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS pnode_gossip_snapshots_uniq
  ON pnode_gossip_snapshots(source, observed_at, pubkey);

CREATE INDEX IF NOT EXISTS pnode_gossip_snapshots_pubkey_time
  ON pnode_gossip_snapshots(pubkey, observed_at DESC);

CREATE INDEX IF NOT EXISTS pnode_gossip_snapshots_time
  ON pnode_gossip_snapshots(observed_at DESC);

SELECT create_hypertable('pnode_gossip_snapshots', 'observed_at', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS network_overview (
  id INTEGER PRIMARY KEY,
  computed_at TIMESTAMPTZ NOT NULL,
  total_pnodes INTEGER NOT NULL,
  online_pnodes INTEGER NOT NULL,
  last_gossip_at TIMESTAMPTZ
);
