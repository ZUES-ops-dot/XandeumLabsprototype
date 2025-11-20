import { PnodeRepository, PnodeFilters, PaginationOptions } from '../repositories/pnode.repository.js';

export interface PnodeListParams {
  query?: string;
  status?: 'online' | 'offline';
  version?: string;
  page: number;
  pageSize: number;
  sort: 'last_seen_at' | 'first_seen_at' | 'pubkey';
  order: 'asc' | 'desc';
  onlineWindowSeconds: number;
}

export interface PnodeListResult {
  page: number;
  pageSize: number;
  total: number;
  items: {
    pubkey: string;
    firstSeenAt: string;
    lastSeenAt: string;
    currentAddress: string | null;
    currentVersion: string | null;
  }[];
}

export interface PnodeDetailResult {
  pnode: {
    pubkey: string;
    firstSeenAt: string;
    lastSeenAt: string;
    currentAddress: string | null;
    currentVersion: string | null;
    currentCapabilities: unknown | null;
    currentMetadata: unknown | null;
  };
  snapshots: {
    observedAt: string;
    address: string | null;
    version: string | null;
  }[];
}

export class PnodeService {
  constructor(private repository: PnodeRepository) {}

  async list(params: PnodeListParams): Promise<PnodeListResult> {
    const onlineThreshold = new Date(Date.now() - params.onlineWindowSeconds * 1000);

    const filters: PnodeFilters = {
      query: params.query,
      status: params.status,
      version: params.version,
      onlineThreshold
    };

    const pagination: PaginationOptions = {
      page: params.page,
      pageSize: params.pageSize,
      sort: params.sort,
      order: params.order
    };

    const [total, items] = await Promise.all([
      this.repository.count(filters),
      this.repository.findMany(filters, pagination)
    ]);

    return {
      page: params.page,
      pageSize: params.pageSize,
      total,
      items: items.map((row) => ({
        pubkey: row.pubkey,
        firstSeenAt: new Date(row.first_seen_at).toISOString(),
        lastSeenAt: new Date(row.last_seen_at).toISOString(),
        currentAddress: row.current_address,
        currentVersion: row.current_version
      }))
    };
  }

  async getByPubkey(pubkey: string): Promise<PnodeDetailResult | null> {
    const pnode = await this.repository.findByPubkey(pubkey);
    if (!pnode) return null;

    const snapshots = await this.repository.findSnapshots(pubkey);

    return {
      pnode: {
        pubkey: pnode.pubkey,
        firstSeenAt: new Date(pnode.first_seen_at).toISOString(),
        lastSeenAt: new Date(pnode.last_seen_at).toISOString(),
        currentAddress: pnode.current_address,
        currentVersion: pnode.current_version,
        currentCapabilities: pnode.current_capabilities ?? null,
        currentMetadata: pnode.current_metadata ?? null
      },
      snapshots: snapshots.map((s) => ({
        observedAt: new Date(s.observed_at).toISOString(),
        address: s.address,
        version: s.version
      }))
    };
  }
}
