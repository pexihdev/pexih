import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './database/schema';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require&channel_binding=require';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

export const db = drizzle(pool, { schema });
console.log('🔌 Connected to Neon PostgreSQL database securely using connection pool (Express version)');
