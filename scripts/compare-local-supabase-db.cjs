/**
 * Compare row counts in public schema: localhost (.env) vs Supabase (.env.supabase).
 * Usage: node scripts/compare-local-supabase-db.cjs
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

async function countRows(client, tableName) {
  const q = `SELECT COUNT(*)::bigint AS n FROM public.${quoteIdent(tableName)}`;
  const { rows } = await client.query(q);
  return BigInt(rows[0].n);
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

/** Drop sslmode from URI so node-pg does not force verify-full; we set ssl explicitly. */
function connectionStringWithoutSslMode(databaseUrl) {
  let s = databaseUrl.replace(/[?&]sslmode=[^&]*/gi, '');
  s = s.replace(/\?&/, '?');
  if (s.endsWith('?')) s = s.slice(0, -1);
  return s;
}

async function connect(label, databaseUrl) {
  const remote = useRemoteSsl(databaseUrl);
  const client = new Client({
    connectionString: remote ? connectionStringWithoutSslMode(databaseUrl) : databaseUrl,
    connectionTimeoutMillis: 25_000,
    ssl: remote ? { rejectUnauthorized: false } : undefined,
  });
  try {
    await client.connect();
    return client;
  } catch (e) {
    console.error(`[${label}] Connection failed: ${e.message}`);
    throw e;
  }
}

async function main() {
  const localEnv = loadEnvFile('.env');
  const remoteEnv = loadEnvFile('.env.supabase');
  if (!localEnv?.DATABASE_URL) {
    console.error('Missing DATABASE_URL in .env');
    process.exit(1);
  }
  if (!remoteEnv?.DATABASE_URL) {
    console.error('Missing .env.supabase or DATABASE_URL in it.');
    process.exit(1);
  }

  const localUrl = localEnv.DATABASE_URL;
  const remoteUrl = remoteEnv.DATABASE_URL;

  let localClient;
  let remoteClient;
  try {
    localClient = await connect('localhost', localUrl);
    remoteClient = await connect('supabase', remoteUrl);
  } catch {
    process.exit(1);
  }

  try {
    const [localTables, remoteTables] = await Promise.all([
      listPublicTables(localClient),
      listPublicTables(remoteClient),
    ]);

    const all = new Set([...localTables, ...remoteTables]);
    const onlyLocal = localTables.filter((t) => !remoteTables.includes(t));
    const onlyRemote = remoteTables.filter((t) => !localTables.includes(t));

    if (onlyLocal.length) {
      console.log('\nTables only on localhost:', onlyLocal.join(', ') || '(none)');
    }
    if (onlyRemote.length) {
      console.log('Tables only on Supabase:', onlyRemote.join(', ') || '(none)');
    }

    const rows = [];
    let localTotal = 0n;
    let remoteTotal = 0n;

    for (const table of [...all].sort()) {
      let lc = null;
      let rc = null;
      try {
        if (localTables.includes(table)) lc = await countRows(localClient, table);
      } catch (e) {
        lc = `err: ${e.message}`;
      }
      try {
        if (remoteTables.includes(table)) rc = await countRows(remoteClient, table);
      } catch (e) {
        rc = `err: ${e.message}`;
      }
      const lStr = lc === null ? '—' : typeof lc === 'bigint' ? lc.toString() : lc;
      const rStr = rc === null ? '—' : typeof rc === 'bigint' ? rc.toString() : rc;
      const match =
        typeof lc === 'bigint' && typeof rc === 'bigint' ? (lc === rc ? 'same' : 'diff') : 'n/a';
      rows.push({ table, local: lStr, supabase: rStr, match });
      if (typeof lc === 'bigint') localTotal += lc;
      if (typeof rc === 'bigint') remoteTotal += rc;
    }

    console.log('\n--- Row counts (public schema) ---\n');
    const wTable = Math.max(8, ...rows.map((r) => r.table.length));
    console.log(
      `${'table'.padEnd(wTable)}  ${'localhost'.padStart(12)}  ${'supabase'.padStart(12)}  match`,
    );
    console.log('-'.repeat(wTable + 12 + 12 + 10));
    for (const r of rows) {
      console.log(
        `${r.table.padEnd(wTable)}  ${String(r.local).padStart(12)}  ${String(r.supabase).padStart(12)}  ${r.match}`,
      );
    }
    console.log('-'.repeat(wTable + 12 + 12 + 10));
    console.log(
      `${'TOTAL'.padEnd(wTable)}  ${localTotal.toString().padStart(12)}  ${remoteTotal.toString().padStart(12)}`,
    );
    console.log(
      '\nNote: Same counts do not guarantee identical rows—only table sizes. Use pg_dump or checksum queries for deep diff.\n',
    );
  } finally {
    await localClient.end().catch(() => {});
    await remoteClient.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
