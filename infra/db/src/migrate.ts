import 'dotenv/config';

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { Client } from 'pg';

const env = z
  .object({
    DATABASE_URL: z
      .string()
      .default('postgres://postgres:postgres@localhost:5432/xandeum')
  })
  .parse(process.env);

const migrationsDir = fileURLToPath(new URL('../migrations', import.meta.url));

const client = new Client({ connectionString: env.DATABASE_URL });
try {
  await client.connect();
} catch (err) {
  const message =
    err instanceof Error ? err.message : 'Failed to connect to database.';
  throw new Error(
    `Database connection failed. Ensure Postgres/Timescale is running and DATABASE_URL is correct.\n${message}`
  );
}

try {
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
  );

  const files = (await readdir(migrationsDir))
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const filename of files) {
    const already = await client.query(
      'SELECT 1 FROM schema_migrations WHERE filename = $1',
      [filename]
    );

    if (already.rowCount && already.rowCount > 0) continue;

    const sql = await readFile(`${migrationsDir}/${filename}`, 'utf8');

    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(filename) VALUES ($1)', [
        filename
      ]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
} finally {
  await client.end();
}
