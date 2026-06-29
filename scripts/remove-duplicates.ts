import pg from 'pg';
const { Pool } = pg;
import { Redis } from '@upstash/redis';

// Set up connection strings (pulls from system environment)
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is required to run the cleanup script.');
  process.exit(1);
}

// Set up Upstash Redis credentials
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

async function main() {
  console.log('🔄 Init: Removing duplicate articles from Neon PostgreSQL...');
  
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    
    // Fetch all articles
    console.log('Fetching articles...');
    const result = await client.query('SELECT id, title, status, created_at FROM articles');
    const rows = result.rows;
    console.log(`Total rows fetched: ${rows.length}`);

    // Map rows and group them by standardized title
    const groups: { [titleLower: string]: typeof rows } = {};
    for (const r of rows) {
      const cleanTitle = String(r.title).trim().toLowerCase();
      if (!groups[cleanTitle]) {
        groups[cleanTitle] = [];
      }
      groups[cleanTitle].push(r);
    }

    const deleteIds: string[] = [];
    let keptCount = 0;

    for (const title in groups) {
      const group = groups[title];
      if (group.length > 1) {
        // Sort items so we have a predictable, stable choice of the representative.
        // Let's sort alphabetically by ID.
        group.sort((a: any, b: any) => String(a.id).localeCompare(String(b.id)));
        
        const representative = group[0];
        console.log(`⚠️ Duplicates found for "${group[0].title}":`);
        console.log(`  -> KEEPING representative ID: ${representative.id}`);
        
        for (let i = 1; i < group.length; i++) {
          console.log(`  -> DELETING duplicate ID: ${group[i].id}`);
          deleteIds.push(group[i].id);
        }
      }
      keptCount++;
    }

    if (deleteIds.length > 0) {
      console.log(`\nExecuting deletion of ${deleteIds.length} duplicate articles...`);
      // Delete in batches or using ANY operator
      await client.query('DELETE FROM articles WHERE id = ANY($1::text[])', [deleteIds]);
      console.log('🎉 Duplicate articles deleted successfully from Neon PostgreSQL!');
    } else {
      console.log('✅ No duplicate articles detected in Neon PostgreSQL!');
    }

    client.release();

    // Now, let's purge references to deleted articles from bookmarks, comments, and article_likes
    if (deleteIds.length > 0) {
      const client2 = await pool.connect();
      console.log('Purging deleted article references from auxiliary tables...');
      const d1 = await client2.query('DELETE FROM bookmarks WHERE article_id = ANY($1::text[])', [deleteIds]);
      const d2 = await client2.query('DELETE FROM comments WHERE article_id = ANY($1::text[])', [deleteIds]);
      const d3 = await client2.query('DELETE FROM article_likes WHERE article_id = ANY($1::text[])', [deleteIds]);
      console.log(`Cleaned up references: Bookmarks deleted: ${d1.rowCount}, Comments deleted: ${d2.rowCount}, Likes deleted: ${d3.rowCount}`);
      client2.release();
    }

    // Now, if Redis credentials are set, notify and flush/clear the cache keys
    if (redisUrl && redisToken) {
      console.log('\nConnecting to Upstash Redis to clear cached lists...');
      try {
        const redis = new Redis({ url: redisUrl, token: redisToken });
        
        // Let's scan or directly delete common cached patterns
        const keysToDel = [
          'articles_list:role_Reader:none',
          'articles_list:role_Admin:none',
          'articles_list:role_Writer:none',
          'slider_articles_all'
        ];

        // Also add the deleted article detail keys
        for (const id of deleteIds) {
          keysToDel.push(`article_detail:${id}`);
        }

        // Run deletion
        for (const key of keysToDel) {
          await redis.del(key);
          console.log(`  - Cleared Redis key: ${key}`);
        }
        
        console.log('🎉 Upstash Redis cache successfully synchronized!');
      } catch (redisErr: any) {
        console.error('⚠️ Could not fully clear Upstash Redis cache keys:', redisErr.message);
      }
    } else {
      console.log('\n⚠️ Upstash Redis configuration env variables not found locally. Skipping cache clearing.');
    }

  } catch (err: any) {
    console.error('❌ Error during cleanup process:', err.message);
  } finally {
    await pool.end();
  }
}

main();
