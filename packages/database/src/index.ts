import { Pool, PoolConfig, PoolClient, QueryResult, QueryResultRow } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
  maxConnections?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
}

export interface QueryOptions {
  timeout?: number;
}

const DB_NETWORK_ERRORS = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH'
]);

const DB_SCHEMA_ERRORS = new Set(['42P01']);

function getErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

function checkNestedErrors(err: unknown, checker: (code: string) => boolean): boolean {
  const code = getErrorCode(err);
  if (code && checker(code)) return true;

  if (typeof err === 'object' && err !== null) {
    const record = err as Record<string, unknown>;
    const children = Array.isArray(record.errors)
      ? record.errors
      : Array.isArray(record.aggregateErrors)
        ? record.aggregateErrors
        : [];
    for (const child of children) {
      if (checkNestedErrors(child, checker)) return true;
    }
  }
  return false;
}

export function isConnectionError(err: unknown): boolean {
  return checkNestedErrors(err, (code) => DB_NETWORK_ERRORS.has(code));
}

export function isSchemaError(err: unknown): boolean {
  return checkNestedErrors(err, (code) => DB_SCHEMA_ERRORS.has(code));
}

export class Database {
  private pool: Pool;
  private startTime: number;

  constructor(config: DatabaseConfig) {
    const poolConfig: PoolConfig = {
      connectionString: config.connectionString,
      max: config.maxConnections ?? 10,
      idleTimeoutMillis: config.idleTimeoutMs ?? 30_000,
      connectionTimeoutMillis: config.connectionTimeoutMs ?? 5_000
    };

    this.pool = new Pool(poolConfig);
    this.startTime = Date.now();

    this.pool.on('error', (err) => {
      console.error('[database] pool error', err);
    });
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      if (options?.timeout) {
        await client.query(`SET statement_timeout = ${options.timeout}`);
      }
      return await client.query<T>(sql, params);
    } finally {
      client.release();
    }
  }

  async transaction<T>(
    fn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async healthCheck(): Promise<{ connected: boolean; latencyMs: number }> {
    const start = Date.now();
    try {
      await this.pool.query('SELECT 1');
      return { connected: true, latencyMs: Date.now() - start };
    } catch {
      return { connected: false, latencyMs: Date.now() - start };
    }
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  getPool(): Pool {
    return this.pool;
  }
}

let defaultDatabase: Database | null = null;

export function initDatabase(config: DatabaseConfig): Database {
  if (defaultDatabase) {
    console.warn('[database] reinitializing database connection');
  }
  defaultDatabase = new Database(config);
  return defaultDatabase;
}

export function getDatabase(): Database {
  if (!defaultDatabase) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return defaultDatabase;
}

export { Pool, PoolClient, QueryResult, QueryResultRow };
