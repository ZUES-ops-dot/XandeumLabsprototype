export interface Pnode {
  pubkey: string;
  firstSeenAt: string;
  lastSeenAt: string;
  currentAddress: string | null;
  currentVersion: string | null;
  currentCapabilities: unknown | null;
  currentMetadata: unknown | null;
}

export interface PnodeRow {
  pubkey: string;
  first_seen_at: string;
  last_seen_at: string;
  current_address: string | null;
  current_version: string | null;
  current_capabilities?: unknown | null;
  current_metadata?: unknown | null;
}

export interface GossipSnapshot {
  source: string;
  observedAt: string;
  pubkey: string;
  address: string | null;
  version: string | null;
  capabilities: unknown | null;
  raw: unknown;
}

export interface NetworkOverview {
  computedAt: string;
  totalPnodes: number;
  onlinePnodes: number;
  lastGossipAt: string | null;
}

export interface HistoryPoint {
  bucketStart: string;
  activePnodes: number;
}

export interface VersionBucket {
  version: string;
  count: number;
}

export interface PaginatedResponse<T> {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
}

export interface ApiError {
  error: string;
  message?: string;
  details?: unknown;
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: ApiError | null };

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  database?: 'connected' | 'disconnected';
  uptime?: number;
  version?: string;
}

export type TimeWindow = '1h' | '24h' | '7d' | '30d';
export type TimeBucket = '1m' | '5m' | '15m' | '1h' | '1d';
export type PnodeStatus = 'online' | 'offline';
export type SortField = 'last_seen_at' | 'first_seen_at' | 'pubkey';
export type SortOrder = 'asc' | 'desc';
