import { env } from './env.js';

export type GossipPnode = {
  pubkey: string;
  address: string | null;
  version: string | null;
  capabilities: unknown | null;
  metadata: unknown | null;
  raw: unknown;
};

function coerceString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  return null;
}

function pickArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const rec = asRecord(payload);
  if (!rec) return [];

  const candidates = [rec.pnodes, rec.nodes, rec.data, rec.result];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export async function fetchGossip(source: string): Promise<GossipPnode[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(source, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        accept: 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${source}`);
    }

    const payload = (await res.json()) as unknown;
    const items = pickArray(payload);

    const normalized: GossipPnode[] = [];

    for (const item of items) {
      const rec = asRecord(item);
      if (!rec) continue;

      const pubkey =
        coerceString(rec.pubkey) ??
        coerceString(rec.publicKey) ??
        coerceString(rec.identity) ??
        coerceString(rec.id);

      if (!pubkey) continue;

      const address =
        coerceString(rec.address) ??
        coerceString(rec.gossipAddress) ??
        coerceString(rec.ip) ??
        coerceString(rec.netAddress);

      const version = coerceString(rec.version) ?? coerceString(rec.protocolVersion);

      const capabilities = (rec.capabilities ?? null) as unknown;
      const metadata = (rec.metadata ?? null) as unknown;

      normalized.push({
        pubkey,
        address,
        version,
        capabilities,
        metadata,
        raw: item
      });
    }

    return normalized;
  } finally {
    clearTimeout(timeout);
  }
}

export function mockGossip(seed = 5): GossipPnode[] {
  const out: GossipPnode[] = [];
  for (let i = 0; i < seed; i++) {
    out.push({
      pubkey: `mock-pnode-${i}`,
      address: `192.168.1.${10 + i}:9000`,
      version: i % 2 === 0 ? '1.0.0' : '1.1.0',
      capabilities: { storage: true },
      metadata: { region: i % 2 === 0 ? 'eu' : 'us' },
      raw: { mock: true, i }
    });
  }
  return out;
}
