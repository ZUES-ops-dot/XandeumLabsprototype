import { DEFAULT_ONLINE_WINDOW_SECONDS } from '../constants/index.js';

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateBackoff(
  failureCount: number,
  baseMs: number,
  maxMs: number = 60_000
): number {
  const cappedFailures = Math.min(failureCount, 6);
  return Math.min(baseMs * 2 ** cappedFailures, maxMs);
}

export function isOnline(
  lastSeenAt: string | Date,
  windowSeconds: number = DEFAULT_ONLINE_WINDOW_SECONDS
): boolean {
  const t = typeof lastSeenAt === 'string' ? new Date(lastSeenAt).getTime() : lastSeenAt.getTime();
  return t >= Date.now() - windowSeconds * 1000;
}

export function onlineThreshold(windowSeconds: number = DEFAULT_ONLINE_WINDOW_SECONDS): Date {
  return new Date(Date.now() - windowSeconds * 1000);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '--';
  const d = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(d);
}

export function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return '--';
  const d = typeof value === 'string' ? new Date(value) : value;
  const now = Date.now();
  const diff = now - d.getTime();

  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return `${Math.floor(diff / 86400_000)}d ago`;
}

export function shortenMiddle(value: string, left = 10, right = 6): string {
  if (value.length <= left + right + 3) return value;
  return `${value.slice(0, left)}...${value.slice(value.length - right)}`;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function getErrorCode(err: unknown): string | undefined {
  if (!isRecord(err)) return undefined;
  const code = err.code;
  return typeof code === 'string' ? code : undefined;
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Unknown error';
}

export function snakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export function camelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
  }
  return result;
}
