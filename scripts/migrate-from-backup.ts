import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../app/_applet/db/schema';

function camelCase(str: string): string {
  if (str === 'iconName') return 'iconName';
  if (str === 'authorId') return 'authorId';
  if (str === 'createdAt') return 'createdAt';
  if (str === 'readTime') return 'readTime';
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

function parseSqlInsert(line: string) {
  let splitIdx = line.indexOf(') VALUES(');
  if (splitIdx === -1) {
    splitIdx = line.indexOf(') values(');
  }
  if (splitIdx === -1) return null;

  const prefix = line.substring(0, splitIdx + 1).trim(); 
  let suffix = line.substring(splitIdx + 9).trim(); 

  if (!suffix.endsWith(');')) return null;
  suffix = suffix.substring(0, suffix.length - 2); 

  const tableNameMatch = prefix.match(/^INSERT INTO "([^"]+)" \(([^)]+)\)$/i);
  if (!tableNameMatch) return null;
  const tableName = tableNameMatch[1];
  const columnsStr = tableNameMatch[2];
  const columns = columnsStr.split(',').map(c => c.replace(/"/g, '').trim());

  const values: any[] = [];
  let i = 0;
  while (i < suffix.length) {
    if (suffix[i] === "'") {
      let str = '';
      i++; 
      while (i < suffix.length) {
        if (suffix[i] === "'" && suffix[i + 1] === "'") {
          str += "'";
          i += 2;
        } else if (suffix[i] === "'") {
          i++; 
          break;
        } else {
          str += suffix[i];
          i++;
        }
      }
      values.push(str);
    } else if (suffix.substring(i, i + 4).toUpperCase() === 'NULL') {
      values.push(null);
      i += 4;
    } else {
      let token = '';
      while (i < suffix.length && suffix[i] !== ',' && suffix[i] !== ')') {
        token += suffix[i];
        i++;
      }
      token = token.trim();
      if (token === '') {
        values.push(null);
      } else if (token.toUpperCase() === 'NULL') {
        values.push(null);
      } else if (!isNaN(token as any)) {
        values.push(Number(token));
      } else {
        values.push(token);
      }
    }
    while (i < suffix.length && (suffix[i] === ',' || /\s/.test(suffix[i]))) {
      i++;
    }
  }

  const row: Record<string, any> = {};
  for (let j = 0; j < columns.length; j++) {
    row[columns[j]] = values[j];
  }
  return { tableName, row };
}

async function resetSequence(db: any, tableName: string) {
  try {
    await db.execute(`
      SELECT setval(
        pg_get_serial_sequence('${tableName}', 'id'),
        coalesce(max(id), 1)
      ) FROM "${tableName}";
    `);
    console.log(`Sequence for table "${tableName}" reset successfully.`);
  } catch (err: any) {
    console.warn(`Could not reset sequence for table "${tableName}": ${err.message}`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(`
=============================================================================
ERROR: DATABASE_URL is not defined!
=============================================================================
`);
    process.exit(1);
  }

  console.log('Connecting to PostgreSQL database...');
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  try {
    const sqlPath = path.resolve('./backup-d1.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Could not find backup-d1.sql at ${sqlPath}`);
    }

    console.log('Reading database backups from backup-d1.sql...');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    const lines = sqlContent.split('\n');

    const data: Record<string, any[]> = {
      authors: [],
      categories: [],
      users: [],
      articles: [],
      comments: [],
      bookmarks: [],
      article_likes: [],
      author_followers: [],
      user_settings: [],
      security_logs: [],
      site_settings: [],
    };

    console.log('Parsing inserts...');
    let lineCount = 0;
    for (const line of lines) {
      if (line.startsWith('INSERT INTO ')) {
        const parsed = parseSqlInsert(line);
        if (parsed) {
          const { tableName, row } = parsed;
          if (data[tableName]) {
            data[tableName].push(row);
            lineCount++;
          }
        }
      }
    }

    console.log(`Successfully parsed ${lineCount} records into memory.`);

    // 1. Authors
    if (data.authors.length > 0) {
      console.log(`Upserting ${data.authors.length} authors...`);
      for (const raw of data.authors) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.authors)
          .values({
            id: row.id,
            name: row.name ?? 'Anonymous',
            email: row.email ?? `${row.id}@yondaime.news`,
            avatar: row.avatar ?? '',
            role: row.role ?? 'Guest',
            bio: row.bio ?? '',
            portfolioName: row.portfolioName ?? '',
            portfolioUrl: row.portfolioUrl ?? '',
            banner: row.banner ?? '',
            socialLink: row.socialLink ?? '',
            expertise: row.expertise ?? 'General',
            memberSince: row.memberSince ?? 'March 2023',
            savedPrivacy: row.savedPrivacy ?? 'private',
            hasBlueBadge: row.hasBlueBadge ?? 0,
          })
          .onConflictDoUpdate({
            target: schema.authors.id,
            set: {
              name: row.name ?? 'Anonymous',
              email: row.email ?? `${row.id}@yondaime.news`,
              avatar: row.avatar ?? '',
              role: row.role ?? 'Guest',
              bio: row.bio ?? '',
              portfolioName: row.portfolioName ?? '',
              portfolioUrl: row.portfolioUrl ?? '',
              banner: row.banner ?? '',
              socialLink: row.socialLink ?? '',
              expertise: row.expertise ?? 'General',
              memberSince: row.memberSince ?? 'March 2023',
              savedPrivacy: row.savedPrivacy ?? 'private',
              hasBlueBadge: row.hasBlueBadge ?? 0,
            }
          });
      }
    }

    // 2. Categories
    if (data.categories.length > 0) {
      console.log(`Upserting ${data.categories.length} categories...`);
      for (const raw of data.categories) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.categories)
          .values({
            id: row.id,
            title: row.title,
            count: String(row.count ?? '0'),
            color: row.color ?? 'bg-blue-600',
            iconName: row.iconName ?? 'Folder',
            desc: row.desc ?? '',
          })
          .onConflictDoUpdate({
            target: schema.categories.id,
            set: {
              title: row.title,
              count: String(row.count ?? '0'),
              color: row.color ?? 'bg-blue-600',
              iconName: row.iconName ?? 'Folder',
              desc: row.desc ?? '',
            }
          });
      }
    }

    // 3. Users
    if (data.users.length > 0) {
      console.log(`Upserting ${data.users.length} users...`);
      for (const raw of data.users) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.users)
          .values({
            id: row.id,
            username: row.username,
            email: row.email,
            password: row.password,
            name: row.name,
            avatar: row.avatar,
            role: row.role,
            bio: row.bio ?? '',
            portfolioName: row.portfolioName ?? '',
            portfolioUrl: row.portfolioUrl ?? '',
            banner: row.banner ?? '',
            socialLink: row.socialLink ?? '',
            expertise: row.expertise ?? '',
            memberSince: row.memberSince ?? 'March 2023',
            savedPrivacy: row.savedPrivacy ?? 'private',
            hasBlueBadge: row.hasBlueBadge ?? 0,
            createdAt: row.createdAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.users.id,
            set: {
              username: row.username,
              email: row.email,
              password: row.password,
              name: row.name,
              avatar: row.avatar,
              role: row.role,
              bio: row.bio ?? '',
              portfolioName: row.portfolioName ?? '',
              portfolioUrl: row.portfolioUrl ?? '',
              banner: row.banner ?? '',
              socialLink: row.socialLink ?? '',
              expertise: row.expertise ?? '',
              memberSince: row.memberSince ?? 'March 2023',
              savedPrivacy: row.savedPrivacy ?? 'private',
              hasBlueBadge: row.hasBlueBadge ?? 0,
            }
          });
      }
    }

    // 4. Articles
    if (data.articles.length > 0) {
      console.log(`Upserting ${data.articles.length} articles...`);
      for (const raw of data.articles) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.articles)
          .values({
            id: row.id,
            title: row.title,
            category: row.category,
            content: row.content,
            authorId: row.authorId,
            createdAt: row.createdAt ?? Date.now(),
            img: row.img ?? '',
            views: String(row.views ?? '0'),
            status: row.status ?? 'approved',
            likes: row.likes ?? 0,
            tags: row.tags ?? '',
            readTime: row.readTime ?? '5 min read',
          })
          .onConflictDoUpdate({
            target: schema.articles.id,
            set: {
              title: row.title,
              category: row.category,
              content: row.content,
              authorId: row.authorId,
              createdAt: row.createdAt ?? Date.now(),
              img: row.img ?? '',
              views: String(row.views ?? '0'),
              status: row.status ?? 'approved',
              likes: row.likes ?? 0,
              tags: row.tags ?? '',
              readTime: row.readTime ?? '5 min read',
            }
          });
      }
    }

    // 5. Comments
    if (data.comments.length > 0) {
      console.log(`Upserting ${data.comments.length} comments...`);
      for (const raw of data.comments) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.comments)
          .values({
            id: row.id,
            articleId: row.articleId,
            author: row.author,
            avatar: row.avatar,
            content: row.content,
            parentId: row.parentId,
            likes: row.likes ?? 0,
            createdAt: row.createdAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.comments.id,
            set: {
              articleId: row.articleId,
              author: row.author,
              avatar: row.avatar,
              content: row.content,
              parentId: row.parentId,
              likes: row.likes ?? 0,
            }
          });
      }
    }

    // 6. Bookmarks
    if (data.bookmarks.length > 0) {
      console.log(`Upserting ${data.bookmarks.length} bookmarks...`);
      for (const raw of data.bookmarks) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.bookmarks)
          .values({
            id: row.id,
            username: row.username,
            articleId: row.articleId,
            createdAt: row.createdAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.bookmarks.id,
            set: {
              username: row.username,
              articleId: row.articleId,
            }
          });
      }
    }

    // 7. Article Likes
    if (data.article_likes.length > 0) {
      console.log(`Upserting ${data.article_likes.length} article_likes...`);
      for (const raw of data.article_likes) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.articleLikes)
          .values({
            id: row.id,
            username: row.username,
            articleId: row.articleId,
            createdAt: row.createdAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.articleLikes.id,
            set: {
              username: row.username,
              articleId: row.articleId,
            }
          });
      }
    }

    // 8. Author Followers
    if (data.author_followers.length > 0) {
      console.log(`Upserting ${data.author_followers.length} author_followers...`);
      for (const raw of data.author_followers) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.authorFollowers)
          .values({
            id: row.id,
            username: row.username,
            authorId: row.authorId,
            createdAt: row.createdAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.authorFollowers.id,
            set: {
              username: row.username,
              authorId: row.authorId,
            }
          });
      }
    }

    // 9. User Settings
    if (data.user_settings.length > 0) {
      console.log(`Upserting ${data.user_settings.length} user_settings...`);
      for (const raw of data.user_settings) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.userSettings)
          .values({
            id: row.id,
            username: row.username,
            emailNotifications: row.emailNotifications ?? 1,
            pushNotifications: row.pushNotifications ?? 1,
            weeklyNewsletter: row.weeklyNewsletter ?? 1,
            twoFactorAuth: row.twoFactorAuth ?? 0,
            securityAlerts: row.securityAlerts ?? 1,
            updatedAt: row.updatedAt ?? Date.now(),
          })
          .onConflictDoUpdate({
            target: schema.userSettings.id,
            set: {
              username: row.username,
              emailNotifications: row.emailNotifications ?? 1,
              pushNotifications: row.pushNotifications ?? 1,
              weeklyNewsletter: row.weeklyNewsletter ?? 1,
              twoFactorAuth: row.twoFactorAuth ?? 0,
              securityAlerts: row.securityAlerts ?? 1,
              updatedAt: row.updatedAt ?? Date.now(),
            }
          });
      }
    }

    // 10. Security Logs
    if (data.security_logs.length > 0) {
      console.log(`Upserting ${data.security_logs.length} security_logs...`);
      for (const raw of data.security_logs) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.securityLogs)
          .values({
            id: row.id,
            timestamp: row.timestamp ?? Math.floor(Date.now() / 1000),
            ip: row.ip ?? '127.0.0.1',
            eventType: row.eventType ?? '',
            details: row.details ?? '',
            status: row.status ?? 'success',
          })
          .onConflictDoUpdate({
            target: schema.securityLogs.id,
            set: {
              timestamp: row.timestamp ?? Math.floor(Date.now() / 1000),
              ip: row.ip ?? '127.0.0.1',
              eventType: row.eventType ?? '',
              details: row.details ?? '',
              status: row.status ?? 'success',
            }
          });
      }
    }

    // 11. Site Settings
    if (data.site_settings.length > 0) {
      console.log(`Upserting ${data.site_settings.length} site_settings...`);
      for (const raw of data.site_settings) {
        const row: Record<string, any> = {};
        for (const [k, v] of Object.entries(raw)) {
          row[camelCase(k)] = v;
        }
        await db.insert(schema.siteSettings)
          .values({
            key: row.key,
            value: row.value,
          })
          .onConflictDoUpdate({
            target: schema.siteSettings.key,
            set: {
              value: row.value,
            }
          });
      }
    }

    const serialTables = [
      'authors',
      'categories',
      'users',
      'comments',
      'bookmarks',
      'article_likes',
      'author_followers',
      'user_settings'
    ];

    console.log('Resetting database auto-increment sequences...');
    for (const tableName of serialTables) {
      await resetSequence(db, tableName);
    }

    console.log(`
=============================================================================
SUCCESS: All Cloudflare D1 backup datasets were migrated successfully to PostgreSQL!
=============================================================================
`);

  } catch (error) {
    console.error('Migration failed with error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
