/**
 * Replace all public application data on Supabase with data from localhost (.env).
 * Keeps _prisma_migrations on Supabase. Requires --yes. Uses DIRECT_URL when set (longer transactions).
 *
 * Usage: node scripts/sync-local-data-to-supabase.cjs --yes
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const SKIP_TABLE = '_prisma_migrations';

function loadEnvFile(filePath) {
  const abs = path.join(process.cwd(), filePath);
  if (!fs.existsSync(abs)) return null;
  const out = {};
  for (const line of fs.readFileSync(abs, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function useRemoteSsl(databaseUrl) {
  try {
    const normalized = databaseUrl.replace(/^postgresql:/i, 'http:').replace(/^postgres:/i, 'http:');
    const host = new URL(normalized).hostname;
    if (host === 'localhost' || host === '127.0.0.1') return false;
    return true;
  } catch {
    return true;
  }
}

function connectionStringWithoutSslMode(databaseUrl) {
  let s = databaseUrl.replace(/[?&]sslmode=[^&]*/gi, '');
  s = s.replace(/\?&/, '?');
  if (s.endsWith('?')) s = s.slice(0, -1);
  return s;
}

async function connect(databaseUrl) {
  const remote = useRemoteSsl(databaseUrl);
  const client = new Client({
    connectionString: remote ? connectionStringWithoutSslMode(databaseUrl) : databaseUrl,
    connectionTimeoutMillis: 120_000,
    ssl: remote ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();
  return client;
}

async function listPublicTables(client) {
  const { rows } = await client.query(`
    SELECT c.relname AS name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY c.relname
  `);
  return rows.map((r) => r.name);
}

async function getColumns(client, tableName) {
  const { rows } = await client.query(
    `
    SELECT a.attname AS name
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = $1
      AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY a.attnum
  `,
    [tableName],
  );
  return rows.map((r) => r.name);
}

async function loadFkEdges(client) {
  const { rows } = await client.query(`
    SELECT cl.relname AS child, pr.relname AS parent
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace nl ON nl.oid = cl.relnamespace AND nl.nspname = 'public'
    JOIN pg_class pr ON pr.oid = c.confrelid
    JOIN pg_namespace np ON np.oid = pr.relnamespace AND np.nspname = 'public'
    WHERE c.contype = 'f'
  `);
  return rows;
}

/** Insert order: parents before children (FK: child references parent). */
function topoSortTables(tables, edges) {
  const set = new Set(tables);
  const graph = new Map();
  const inDegree = new Map();

  for (const t of tables) {
    graph.set(t, []);
    inDegree.set(t, 0);
  }

  for (const { parent, child } of edges) {
    if (!set.has(parent) || !set.has(child)) continue;
    graph.get(parent).push(child);
    inDegree.set(child, (inDegree.get(child) || 0) + 1);
  }

  const queue = [...tables].filter((t) => inDegree.get(t) === 0);
  const out = [];
  while (queue.length) {
    const n = queue.shift();
    out.push(n);
    for (const m of graph.get(n) || []) {
      inDegree.set(m, inDegree.get(m) - 1);
      if (inDegree.get(m) === 0) queue.push(m);
    }
  }

  if (out.length !== tables.length) {
    throw new Error(
      'Circular foreign keys in public schema; cannot derive copy order. Use pg_dump manually.',
    );
  }
  return out;
}

function rowValue(col, v) {
  if (v === undefined) return null;
  return v;
}

async function copyTable(src, dst, tableName, columns, batchSize = 40) {
  const tq = `public.${quoteIdent(tableName)}`;
  const { rows } = await src.query(`SELECT * FROM ${tq}`);
  if (rows.length === 0) return 0;

  const colList = columns.map((c) => quoteIdent(c)).join(', ');
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const valueRows = [];
    const flat = [];
    let p = 1;
    for (const row of chunk) {
      const ph = columns.map(() => `$${p++}`);
      valueRows.push(`(${ph.join(', ')})`);
      for (const c of columns) {
        flat.push(rowValue(c, row[c]));
      }
    }
    const sql = `INSERT INTO ${tq} (${colList}) VALUES ${valueRows.join(', ')}`;
    await dst.query(sql, flat);
    inserted += chunk.length;
  }
  return inserted;
}

async function main() {
  if (!process.argv.includes('--yes')) {
    console.error(
      'This will DELETE all application data on Supabase public schema (except _prisma_migrations) and replace it from localhost.\n' +
        'Run: node scripts/sync-local-data-to-supabase.cjs --yes',
    );
    process.exit(1);
  }

  const localEnv = loadEnvFile('.env');
  const remoteEnv = loadEnvFile('.env.supabase');
  if (!localEnv?.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }
  if (!remoteEnv?.DATABASE_URL) {
    console.error('Missing .env.supabase or DATABASE_URL.');
    process.exit(1);
  }

  const srcUrl = localEnv.DATABASE_URL;
  const dstUrl = remoteEnv.DIRECT_URL || remoteEnv.DATABASE_URL;

  const src = await connect(srcUrl);
  const dst = await connect(dstUrl);

  try {
    const [srcTables, dstTables] = await Promise.all([listPublicTables(src), listPublicTables(dst)]);

    const srcSet = new Set(srcTables);
    const dstSet = new Set(dstTables);
    const onlyDst = [...dstSet].filter((t) => !srcSet.has(t) && t !== SKIP_TABLE);
    const onlySrc = [...srcSet].filter((t) => !dstSet.has(t));
    if (onlySrc.length) {
      console.error('Supabase is missing tables present on localhost:', onlySrc.join(', '));
      console.error('Run prisma db push against Supabase first.');
      process.exit(1);
    }

    const appTables = srcTables.filter((t) => t !== SKIP_TABLE);
    const missingOnDst = appTables.filter((t) => !dstSet.has(t));
    if (missingOnDst.length) {
      console.error('Supabase missing tables:', missingOnDst.join(', '));
      process.exit(1);
    }

    const edges = await loadFkEdges(src);
    const order = topoSortTables(appTables, edges);

    console.log('Tables to copy (order):', order.join(', '));
    if (onlyDst.length) {
      console.log('(Untouched on Supabase — not on localhost):', onlyDst.join(', ') || 'none');
    }

    await dst.query('BEGIN');
    await dst.query('SET LOCAL statement_timeout = 0');
    await dst.query('SET LOCAL lock_timeout = \'120s\'');

    const truncList = dstTables.filter((t) => t !== SKIP_TABLE);
    if (truncList.length) {
      const truncSql =
        'TRUNCATE TABLE ' +
        truncList.map((t) => `public.${quoteIdent(t)}`).join(', ') +
        ' RESTART IDENTITY CASCADE';
      console.log('Truncating Supabase app tables...');
      await dst.query(truncSql);
    }

    let total = 0;
    for (const table of order) {
      const cols = await getColumns(src, table);
      if (cols.length === 0) continue;
      const n = await copyTable(src, dst, table, cols);
      if (n) console.log(`  ${table}: ${n} rows`);
      total += n;
    }

    await dst.query('COMMIT');
    console.log(`\nDone. Inserted ${total} rows total on Supabase (localhost snapshot).`);
    console.log('Re-run: pnpm db:compare:local-supabase');
  } catch (e) {
    await dst.query('ROLLBACK').catch(() => {});
    console.error(e.message || e);
    process.exit(1);
  } finally {
    await src.end().catch(() => {});
    await dst.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
