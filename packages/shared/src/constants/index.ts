export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;
export const DEFAULT_ONLINE_WINDOW_SECONDS = 120;
export const DEFAULT_POLL_INTERVAL_MS = 30_000;
export const DEFAULT_COMPUTE_INTERVAL_MS = 10_000;
export const MAX_BACKOFF_MS = 60_000;
export const CACHE_TTL_MS = 5_000;

export const API_ERRORS = {
  DB_UNAVAILABLE: 'db_unavailable',
  DB_NOT_INITIALIZED: 'db_not_initialized',
  INTERNAL_ERROR: 'internal_error',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
  RATE_LIMITED: 'rate_limited'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const TIME_WINDOWS: Record<string, string> = {
  '1h': '1 hour',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days'
};

export const TIME_BUCKETS: Record<string, string> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '1d': '1 day'
};

export const DB_ERROR_CODES = {
  CONNECTION_REFUSED: 'ECONNREFUSED',
  NOT_FOUND: 'ENOTFOUND',
  TIMEOUT: 'ETIMEDOUT',
  CONNECTION_RESET: 'ECONNRESET',
  HOST_UNREACHABLE: 'EHOSTUNREACH',
  UNDEFINED_TABLE: '42P01'
} as const;
