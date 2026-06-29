import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '../app/_applet/db/schema';

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require&channel_binding=require';
  console.log('Connecting to Neon database...');
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  const db = drizzle(pool, { schema });

  try {
    console.log('Running migrations programmatically...');
    await migrate(db, { migrationsFolder: './drizzle/migrations' });
    console.log('🎉 Migrations completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed with error:', err);
  } finally {
    await pool.end();
  }
}

main();
