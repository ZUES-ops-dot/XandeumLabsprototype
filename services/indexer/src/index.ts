import { pool } from './db.js';
import { env, getSources } from './env.js';
import { fetchGossip, type GossipPnode } from './gossip.js';
import { generateSyntheticGossip } from './synthetic.js';
import { validateBatch, summarizeIssues, type ValidationResult } from './validation.js';

const SERVICE_NAME = 'indexer';
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

interface IngestResult {
  sourcesProcessed: number;
  pnodesIngested: number;
  avgQualityScore: number;
  totalIssues: number;
}

async function ingestOnce(): Promise<IngestResult> {
  const sources = getSources();
  const observedAt = new Date();
  let totalPnodes = 0;
  let totalQualityScore = 0;
  let totalIssues = 0;
  let cycleCount = 0;

  if (sources.length === 0) {
    const pnodes = generateSyntheticGossip({ count: 10 });
    const cycleResult = await ingestSource('synthetic', observedAt, pnodes);
    return {
      sourcesProcessed: 1,
      pnodesIngested: cycleResult.pnodesIngested,
      avgQualityScore: cycleResult.qualityScore,
      totalIssues: cycleResult.totalIssues
    };
  }

  let successCount = 0;
  for (const source of sources) {
    try {
      const pnodes = await fetchGossip(source);
      const cycleResult = await ingestSource(source, observedAt, pnodes);
      totalPnodes += cycleResult.pnodesIngested;
      totalQualityScore += cycleResult.qualityScore;
      totalIssues += cycleResult.totalIssues;
      cycleCount++;
      successCount++;
    } catch (err) {
      await recordFailedCycle(source, observedAt, err);
      log('warn', `Source fetch failed: ${source}`, {
        error: err instanceof Error ? err.message : String(err)
      });
    }
  }

  return {
    sourcesProcessed: successCount,
    pnodesIngested: totalPnodes,
    avgQualityScore: cycleCount > 0 ? totalQualityScore / cycleCount : 0,
    totalIssues
  };
}

interface CycleResult {
  pnodesIngested: number;
  qualityScore: number;
  totalIssues: number;
}

async function ingestSource(source: string, observedAt: Date, pnodes: GossipPnode[]): Promise<CycleResult> {
  const startedAt = new Date();
  
  // Validate batch
  const validation = validateBatch(pnodes);
  const issueSummary = summarizeIssues(validation.results);
  
  // Build validation map for quick lookup
  const validationMap = new Map<string, ValidationResult>();
  for (const r of validation.results) {
    validationMap.set(r.pubkey, r);
  }
  
  // Persist snapshots with quality scores
  await persistSnapshot({ source, observedAt, pnodes, validationMap });
  
  const completedAt = new Date();
  const durationMs = completedAt.getTime() - startedAt.getTime();
  
  // Record ingest cycle metrics
  await recordIngestCycle({
    source,
    startedAt,
    completedAt,
    durationMs,
    pnodesFetched: pnodes.length,
    pnodesValid: validation.validCount,
    pnodesInvalid: validation.invalidCount,
    qualityScore: validation.aggregateScore,
    totalIssues: validation.totalIssues,
    issueSummary
  });
  
  log('info', 'Source ingested with quality metrics', {
    source,
    pnodesFetched: pnodes.length,
    validCount: validation.validCount,
    invalidCount: validation.invalidCount,
    qualityScore: validation.aggregateScore.toFixed(3),
    totalIssues: validation.totalIssues,
    durationMs
  });
  
  return {
    pnodesIngested: validation.validCount,
    qualityScore: validation.aggregateScore,
    totalIssues: validation.totalIssues
  };
}

interface IngestCycleRecord {
  source: string;
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
  pnodesFetched: number;
  pnodesValid: number;
  pnodesInvalid: number;
  qualityScore: number;
  totalIssues: number;
  issueSummary: Record<string, number>;
  errorMessage?: string;
}

async function recordIngestCycle(record: IngestCycleRecord): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO ingest_cycles(
        source, started_at, completed_at, duration_ms,
        pnodes_fetched, pnodes_valid, pnodes_invalid,
        quality_score, total_issues, issue_summary, error_message
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        record.source,
        record.startedAt,
        record.completedAt,
        record.durationMs,
        record.pnodesFetched,
        record.pnodesValid,
        record.pnodesInvalid,
        record.qualityScore,
        record.totalIssues,
        JSON.stringify(record.issueSummary),
        record.errorMessage ?? null
      ]
    );
  } catch (err) {
    log('warn', 'Failed to record ingest cycle', {
      error: err instanceof Error ? err.message : String(err)
    });
  }
}

async function recordFailedCycle(source: string, startedAt: Date, err: unknown): Promise<void> {
  const completedAt = new Date();
  await recordIngestCycle({
    source,
    startedAt,
    completedAt,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    pnodesFetched: 0,
    pnodesValid: 0,
    pnodesInvalid: 0,
    qualityScore: 0,
    totalIssues: 0,
    issueSummary: {},
    errorMessage: err instanceof Error ? err.message : String(err)
  });
}

async function persistSnapshot(input: {
  source: string;
  observedAt: Date;
  pnodes: GossipPnode[];
  validationMap: Map<string, ValidationResult>;
}): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const p of input.pnodes) {
      const validation = input.validationMap.get(p.pubkey);
      const qualityScore = validation?.qualityScore ?? 0;
      const issues = validation?.issues ?? [];
      
      // Skip invalid records (empty pubkey)
      if (!validation?.isValid) continue;

      await client.query(
        `INSERT INTO pnode_gossip_snapshots(source, observed_at, pubkey, address, version, capabilities, raw, quality_score, issues)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (source, observed_at, pubkey) DO NOTHING`,
        [input.source, input.observedAt, p.pubkey, p.address, p.version, p.capabilities, p.raw, qualityScore, issues]
      );

      await client.query(
        `INSERT INTO pnodes(pubkey, first_seen_at, last_seen_at, current_address, current_version, current_capabilities, current_metadata)
         VALUES ($1, $2, $2, $3, $4, $5, $6)
         ON CONFLICT (pubkey) DO UPDATE SET
           last_seen_at = EXCLUDED.last_seen_at,
           current_address = EXCLUDED.current_address,
           current_version = EXCLUDED.current_version,
           current_capabilities = EXCLUDED.current_capabilities,
           current_metadata = EXCLUDED.current_metadata`,
        [p.pubkey, input.observedAt, p.address, p.version, p.capabilities, p.metadata]
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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

log('info', 'Indexer starting', { pollIntervalMs: env.POLL_INTERVAL_MS });

while (running) {
  const cycleStart = Date.now();
  
  try {
    const result = await ingestOnce();
    
    if (failureCount > 0) {
      log('info', 'Recovered from failures', { previousFailures: failureCount });
    }
    failureCount = 0;
    
    log('info', 'Ingest cycle complete', {
      sourcesProcessed: result.sourcesProcessed,
      pnodesIngested: result.pnodesIngested,
      avgQualityScore: result.avgQualityScore.toFixed(3),
      totalIssues: result.totalIssues,
      durationMs: Date.now() - cycleStart
    });
    
    await sleep(env.POLL_INTERVAL_MS);
  } catch (err) {
    failureCount++;
    const backoffMs = calculateBackoff(failureCount, env.POLL_INTERVAL_MS);
    
    log('error', 'Ingest cycle failed', {
      error: err instanceof Error ? err.message : String(err),
      failureCount,
      backoffMs
    });
    
    await sleep(backoffMs);
  }
}

log('info', 'Indexer shutting down', { uptimeMs: Date.now() - startTime });
await pool.end();
log('info', 'Database connection closed');
