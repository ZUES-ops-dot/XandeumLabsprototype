import { Pool } from 'pg';

export interface PnodeFilters {
  query?: string;
  status?: 'online' | 'offline';
  version?: string;
  onlineThreshold: Date;
}

export interface PaginationOptions {
  page: number;
  pageSize: number;
  sort: 'last_seen_at' | 'first_seen_at' | 'pubkey';
  order: 'asc' | 'desc';
}

export interface PnodeRow {
  pubkey: string;
  first_seen_at: Date;
  last_seen_at: Date;
  current_address: string | null;
  current_version: string | null;
  current_capabilities?: unknown;
  current_metadata?: unknown;
}

export interface SnapshotRow {
  observed_at: Date;
  address: string | null;
  version: string | null;
}

export class PnodeRepository {
  constructor(private pool: Pool) {}

  async count(filters: PnodeFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await this.pool.query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM pnodes ${whereClause}`,
      params
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async findMany(
    filters: PnodeFilters,
    pagination: PaginationOptions
  ): Promise<PnodeRow[]> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const offset = (pagination.page - 1) * pagination.pageSize;

    const sortColumn = this.getSortColumn(pagination.sort);
    const order = pagination.order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryParams = [...params, pagination.pageSize, offset];

    const result = await this.pool.query<PnodeRow>(
      `SELECT pubkey, first_seen_at, last_seen_at, current_address, current_version
       FROM pnodes
       ${whereClause}
       ORDER BY ${sortColumn} ${order}
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams
    );

    return result.rows;
  }

  async findByPubkey(pubkey: string): Promise<PnodeRow | null> {
    const result = await this.pool.query<PnodeRow>(
      `SELECT pubkey, first_seen_at, last_seen_at, current_address, current_version, 
              current_capabilities, current_metadata
       FROM pnodes
       WHERE pubkey = $1`,
      [pubkey]
    );
    return result.rows[0] ?? null;
  }

  async findSnapshots(pubkey: string, limit = 500): Promise<SnapshotRow[]> {
    const result = await this.pool.query<SnapshotRow>(
      `SELECT observed_at, address, version
       FROM pnode_gossip_snapshots
       WHERE pubkey = $1
       ORDER BY observed_at DESC
       LIMIT $2`,
      [pubkey, limit]
    );
    return result.rows.reverse();
  }

  private buildWhereClause(filters: PnodeFilters): {
    whereClause: string;
    params: unknown[];
  } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters.query) {
      params.push(`%${filters.query}%`);
      conditions.push(
        `(pubkey ILIKE $${params.length} OR current_address ILIKE $${params.length})`
      );
    }

    if (filters.version) {
      params.push(filters.version);
      conditions.push(`current_version = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.onlineThreshold);
      if (filters.status === 'online') {
        conditions.push(`last_seen_at >= $${params.length}`);
      } else {
        conditions.push(`last_seen_at < $${params.length}`);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
  }

  private getSortColumn(sort: string): string {
    switch (sort) {
      case 'first_seen_at':
        return 'first_seen_at';
      case 'pubkey':
        return 'pubkey';
      default:
        return 'last_seen_at';
    }
  }
}
