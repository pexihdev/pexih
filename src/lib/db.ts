import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../../backend/src/database/schema';

// Use the database URL from the environment
const connectionString = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require';

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
