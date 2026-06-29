import pg from 'pg';
const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ Error: DATABASE_URL is required to inspect database.');
    process.exit(1);
  }
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();
    console.log('Querying articles details...');
    
    // Check total articles count
    const countRes = await client.query('SELECT COUNT(*) as count FROM articles');
    console.log(`Total articles in DB: ${countRes.rows[0].count}`);

    // Check articles with duplicate IDs or titles
    const dupTitleRes = await client.query(`
      SELECT title, COUNT(*) as count 
      FROM articles 
      GROUP BY title 
      HAVING COUNT(*) > 1
    `);
    console.log('\nArticles with duplicate titles:');
    if (dupTitleRes.rows.length === 0) {
      console.log('None');
    } else {
      for (const row of dupTitleRes.rows) {
        console.log(`- "${row.title}" appeared ${row.count} times`);
      }
    }

    const listRes = await client.query('SELECT id, title, category, status FROM articles ORDER BY id');
    console.log('\nAll Articles in DB:');
    for (const row of listRes.rows) {
      console.log(`- ID: ${row.id} | Title: ${row.title} | Category: ${row.category} | Status: ${row.status}`);
    }

    client.release();
  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

main();
