import { NetworkRepository } from '../repositories/network.repository.js';

const TIME_WINDOWS: Record<string, string> = {
  '1h': '1 hour',
  '24h': '24 hours',
  '7d': '7 days',
  '30d': '30 days'
};

const TIME_BUCKETS: Record<string, string> = {
  '1m': '1 minute',
  '5m': '5 minutes',
  '15m': '15 minutes',
  '1h': '1 hour',
  '1d': '1 day'
};

export interface NetworkOverviewResult {
  computedAt: string;
  totalPnodes: number;
  onlinePnodes: number;
  lastGossipAt: string | null;
  dataQuality: {
    avgQualityScore: number;
    totalIngestCycles: number;
    lastIngestAt: string | null;
    issuesLastHour: Record<string, number>;
  };
}

export interface IngestCycleResult {
  id: number;
  source: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  pnodesFetched: number;
  pnodesValid: number;
  pnodesInvalid: number;
  qualityScore: number;
  totalIssues: number;
  issueSummary: Record<string, number> | null;
  errorMessage: string | null;
}

export interface IngestHealthResult {
  cyclesLastHour: number;
  avgQualityLastHour: number;
  errorCountLastHour: number;
  issueBreakdown: Record<string, number>;
}

export interface HistoryPointResult {
  bucketStart: string;
  activePnodes: number;
}

export interface VersionBucketResult {
  version: string;
  count: number;
}

export class NetworkService {
  constructor(
    private repository: NetworkRepository,
    private onlineWindowSeconds: number
  ) {}

  async getOverview(): Promise<NetworkOverviewResult> {
    const cached = await this.repository.getOverview();

    if (cached) {
      return {
        computedAt: new Date(cached.computed_at).toISOString(),
        totalPnodes: cached.total_pnodes,
        onlinePnodes: cached.online_pnodes,
        lastGossipAt: cached.last_gossip_at
          ? new Date(cached.last_gossip_at).toISOString()
          : null,
        dataQuality: {
          avgQualityScore: cached.avg_quality_score ?? 0,
          totalIngestCycles: cached.total_ingest_cycles ?? 0,
          lastIngestAt: cached.last_ingest_at
            ? new Date(cached.last_ingest_at).toISOString()
            : null,
          issuesLastHour: cached.issues_last_hour ?? {}
        }
      };
    }

    const onlineThreshold = new Date(Date.now() - this.onlineWindowSeconds * 1000);
    const stats = await this.repository.computeOverviewStats(onlineThreshold);

    return {
      computedAt: new Date().toISOString(),
      totalPnodes: stats.total,
      onlinePnodes: stats.online,
      lastGossipAt: stats.lastGossip ? new Date(stats.lastGossip).toISOString() : null,
      dataQuality: {
        avgQualityScore: 0,
        totalIngestCycles: 0,
        lastIngestAt: null,
        issuesLastHour: {}
      }
    };
  }

  async getHistory(
    window: string = '24h',
    bucket: string = '5m'
  ): Promise<HistoryPointResult[]> {
    const windowInterval = TIME_WINDOWS[window] ?? '24 hours';
    const bucketInterval = TIME_BUCKETS[bucket] ?? '5 minutes';

    const history = await this.repository.getHistory(bucketInterval, windowInterval);

    return history.map((h) => ({
      bucketStart: new Date(h.bucket_start).toISOString(),
      activePnodes: h.active_pnodes
    }));
  }

  async getVersionDistribution(): Promise<VersionBucketResult[]> {
    return this.repository.getVersionDistribution();
  }

  async getRecentIngestCycles(limit = 20): Promise<IngestCycleResult[]> {
    const cycles = await this.repository.getRecentIngestCycles(limit);
    return cycles.map((c) => ({
      id: c.id,
      source: c.source,
      startedAt: new Date(c.started_at).toISOString(),
      completedAt: new Date(c.completed_at).toISOString(),
      durationMs: c.duration_ms,
      pnodesFetched: c.pnodes_fetched,
      pnodesValid: c.pnodes_valid,
      pnodesInvalid: c.pnodes_invalid,
      qualityScore: c.quality_score,
      totalIssues: c.total_issues,
      issueSummary: c.issue_summary,
      errorMessage: c.error_message
    }));
  }

  async getIngestHealth(): Promise<IngestHealthResult> {
    return this.repository.getIngestHealth();
  }
}
