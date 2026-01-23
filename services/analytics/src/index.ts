import { pool } from './db.js';
import { env } from './env.js';

const SERVICE_NAME = 'analytics';
const MAX_BACKOFF_MS = 60_000;

function log(level: 'info' | 'warn' | 'error', message: string, context?: Record<string, unknown>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    message,
    ...context
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateBackoff(failureCount: number, baseMs: number): number {
  return Math.min(baseMs * 2 ** Math.min(failureCount, 6), MAX_BACKOFF_MS);
}

function onlineThreshold(): Date {
  return new Date(Date.now() - env.ONLINE_WINDOW_SECONDS * 1000);
}

interface OverviewStats {
  total: number;
  online: number;
  lastGossip: Date | null;
  avgQualityScore: number;
  totalIngestCycles: number;
  lastIngestAt: Date | null;
  issuesLastHour: Record<string, number>;
}

async function computeOverview(): Promise<OverviewStats> {
  const threshold = onlineThreshold();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [totalRes, onlineRes, lastGossipRes, qualityRes, cyclesRes, issuesRes] = await Promise.all([
    pool.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM pnodes'),
    pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM pnodes WHERE last_seen_at >= $1',
      [threshold]
    ),
    pool.query<{ max: Date | null }>('SELECT MAX(observed_at) AS max FROM pnode_gossip_snapshots'),
    // Average quality score from recent ingest cycles
    pool.query<{ avg: string | null; count: string; last: Date | null }>(
      `SELECT 
        AVG(quality_score)::text AS avg,
        COUNT(*)::text AS count,
        MAX(completed_at) AS last
       FROM ingest_cycles
       WHERE started_at >= $1 AND error_message IS NULL`,
      [oneHourAgo]
    ),
    // Total ingest cycles count
    pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM ingest_cycles'
    ),
    // Aggregate issues from last hour
    pool.query<{ issue_summary: Record<string, number> | null }>(
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

  const total = Number(totalRes.rows[0]?.count ?? 0);
  const online = Number(onlineRes.rows[0]?.count ?? 0);
  const lastGossip = lastGossipRes.rows[0]?.max ?? null;
  const avgQualityScore = Number(qualityRes.rows[0]?.avg ?? 0);
  const totalIngestCycles = Number(cyclesRes.rows[0]?.count ?? 0);
  const lastIngestAt = qualityRes.rows[0]?.last ?? null;
  const issuesLastHour = issuesRes.rows[0]?.issue_summary ?? {};

  await pool.query(
    `INSERT INTO network_overview(
      id, computed_at, total_pnodes, online_pnodes, last_gossip_at,
      avg_quality_score, total_ingest_cycles, last_ingest_at, issues_last_hour
    )
     VALUES (1, NOW(), $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       computed_at = EXCLUDED.computed_at,
       total_pnodes = EXCLUDED.total_pnodes,
       online_pnodes = EXCLUDED.online_pnodes,
       last_gossip_at = EXCLUDED.last_gossip_at,
       avg_quality_score = EXCLUDED.avg_quality_score,
       total_ingest_cycles = EXCLUDED.total_ingest_cycles,
       last_ingest_at = EXCLUDED.last_ingest_at,
       issues_last_hour = EXCLUDED.issues_last_hour`,
    [total, online, lastGossip, avgQualityScore, totalIngestCycles, lastIngestAt, JSON.stringify(issuesLastHour)]
  );

  return { total, online, lastGossip, avgQualityScore, totalIngestCycles, lastIngestAt, issuesLastHour };
}

let running = true;
let failureCount = 0;
const startTime = Date.now();

function handleShutdown(signal: string) {
  log('info', `Received ${signal}, shutting down gracefully...`);
  running = false;
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

log('info', 'Analytics service starting', {
  computeIntervalMs: env.COMPUTE_INTERVAL_MS,
  onlineWindowSeconds: env.ONLINE_WINDOW_SECONDS
});

while (running) {
  const cycleStart = Date.now();

  try {
    const stats = await computeOverview();

    if (failureCount > 0) {
      log('info', 'Recovered from failures', { previousFailures: failureCount });
    }
    failureCount = 0;

    log('info', 'Overview computed', {
      totalPnodes: stats.total,
      onlinePnodes: stats.online,
      avgQualityScore: stats.avgQualityScore.toFixed(3),
      totalIngestCycles: stats.totalIngestCycles,
      issueTypes: Object.keys(stats.issuesLastHour).length,
      durationMs: Date.now() - cycleStart
    });

    await sleep(env.COMPUTE_INTERVAL_MS);
  } catch (err) {
    failureCount++;
    const backoffMs = calculateBackoff(failureCount, env.COMPUTE_INTERVAL_MS);

    log('error', 'Compute cycle failed', {
      error: err instanceof Error ? err.message : String(err),
      failureCount,
      backoffMs
    });

    await sleep(backoffMs);
  }
}

log('info', 'Analytics service shutting down', { uptimeMs: Date.now() - startTime });
await pool.end();
log('info', 'Database connection closed');
