import { Pool } from 'pg';

export interface NetworkOverviewRow {
  computed_at: Date;
  total_pnodes: number;
  online_pnodes: number;
  last_gossip_at: Date | null;
  avg_quality_score: number | null;
  total_ingest_cycles: number | null;
  last_ingest_at: Date | null;
  issues_last_hour: Record<string, number> | null;
}

export interface IngestCycleRow {
  id: number;
  source: string;
  started_at: Date;
  completed_at: Date;
  duration_ms: number;
  pnodes_fetched: number;
  pnodes_valid: number;
  pnodes_invalid: number;
  quality_score: number;
  total_issues: number;
  issue_summary: Record<string, number> | null;
  error_message: string | null;
}

export interface HistoryBucket {
  bucket_start: Date;
  active_pnodes: number;
}

export interface VersionCount {
  version: string;
  count: number;
}

export class NetworkRepository {
  constructor(private pool: Pool) {}

  async getOverview(): Promise<NetworkOverviewRow | null> {
    const result = await this.pool.query<NetworkOverviewRow>(
      `SELECT computed_at, total_pnodes, online_pnodes, last_gossip_at,
              avg_quality_score, total_ingest_cycles, last_ingest_at, issues_last_hour
       FROM network_overview WHERE id = 1`
    );
    return result.rows[0] ?? null;
  }

  async getRecentIngestCycles(limit = 20): Promise<IngestCycleRow[]> {
    const result = await this.pool.query<IngestCycleRow>(
      `SELECT id, source, started_at, completed_at, duration_ms,
              pnodes_fetched, pnodes_valid, pnodes_invalid,
              quality_score, total_issues, issue_summary, error_message
       FROM ingest_cycles
       ORDER BY started_at DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getIngestHealth(): Promise<{
    cyclesLastHour: number;
    avgQualityLastHour: number;
    errorCountLastHour: number;
    issueBreakdown: Record<string, number>;
  }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const [statsRes, issuesRes] = await Promise.all([
      this.pool.query<{ cycles: string; avg_quality: string | null; errors: string }>(
        `SELECT 
          COUNT(*)::text AS cycles,
          AVG(CASE WHEN error_message IS NULL THEN quality_score END)::text AS avg_quality,
          COUNT(CASE WHEN error_message IS NOT NULL THEN 1 END)::text AS errors
         FROM ingest_cycles
         WHERE started_at >= $1`,
        [oneHourAgo]
      ),
      this.pool.query<{ issue_summary: Record<string, number> | null }>(
        `SELECT jsonb_object_agg(key, value::int) AS issue_summary
         FROM (
           SELECT key, SUM(value::int) AS value
           FROM ingest_cycles,
                jsonb_each_text(COALESCE(issue_summary, '{}'::jsonb))
           WHERE started_at >= $1 AND error_message IS NULL
           GROUP BY key
         ) AS aggregated`,
        [oneHourAgo]
      )
    ]);

    return {
      cyclesLastHour: Number(statsRes.rows[0]?.cycles ?? 0),
      avgQualityLastHour: Number(statsRes.rows[0]?.avg_quality ?? 0),
      errorCountLastHour: Number(statsRes.rows[0]?.errors ?? 0),
      issueBreakdown: issuesRes.rows[0]?.issue_summary ?? {}
    };
  }

  async computeOverviewStats(onlineThreshold: Date): Promise<{
    total: number;
    online: number;
    lastGossip: Date | null;
  }> {
    const [totalRes, onlineRes, lastGossipRes] = await Promise.all([
      this.pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM pnodes'),
      this.pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM pnodes WHERE last_seen_at >= $1',
        [onlineThreshold]
      ),
      this.pool.query<{ max: Date | null }>(
        'SELECT MAX(observed_at) AS max FROM pnode_gossip_snapshots'
      )
    ]);

    return {
      total: Number(totalRes.rows[0]?.count ?? 0),
      online: Number(onlineRes.rows[0]?.count ?? 0),
      lastGossip: lastGossipRes.rows[0]?.max ?? null
    };
  }

  async getHistory(
    bucketInterval: string,
    windowInterval: string
  ): Promise<HistoryBucket[]> {
    const result = await this.pool.query<HistoryBucket>(
      `SELECT time_bucket($1::interval, observed_at) AS bucket_start,
              COUNT(DISTINCT pubkey)::int AS active_pnodes
       FROM pnode_gossip_snapshots
       WHERE observed_at >= NOW() - $2::interval
       GROUP BY bucket_start
       ORDER BY bucket_start ASC`,
      [bucketInterval, windowInterval]
    );
    return result.rows;
  }

  async getVersionDistribution(): Promise<VersionCount[]> {
    const result = await this.pool.query<{ version: string; count: string }>(
      `SELECT COALESCE(current_version, 'unknown') AS version,
              COUNT(*)::int AS count
       FROM pnodes
       GROUP BY version
       ORDER BY count DESC`
    );
    return result.rows.map((r) => ({
      version: String(r.version),
      count: Number(r.count)
    }));
  }
}
