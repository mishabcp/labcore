const fs = require('fs');
const path = require('path');

const p = path.join(process.cwd(), '.env.supabase');
if (!fs.existsSync(p)) {
  console.error(
    'Missing .env.supabase in the repo root.\n' +
      'Create it with DATABASE_URL (pooled, ?pgbouncer=true) and DIRECT_URL from Supabase → Project Settings → Database.\n' +
      'See .env.example. Then run: pnpm db:supabase:seed',
  );
  process.exit(1);
}
