import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import multer from 'multer';
import { db } from './db';
import { redisService } from './redis';
import { articles, categories, comments, bookmarks, articleLikes, users, newsletterSubscribers, supportMessages, notifications, userSettings, media } from './database/schema';
import { eq, and, or, isNull, lte, desc } from 'drizzle-orm';
import sanitizeHtml from 'sanitize-html';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

dotenv.config();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pexih-super-secret-key-change-me'
);

const app = express();
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins to support multiple Vercel deployments (Frontend, Admin Panel)
    callback(null, true);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json());

// Simple Redis Rate Limiter Middleware
const rateLimit = (limit: number, windowSecs: number) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const path = req.baseUrl || req.path;
    const key = `rate_limit:${ip}:${path}`;
    
    try {
      const current = await redisService.incr(key);
      if (current === 1) {
        await redisService.expire(key, windowSecs);
      }
      
      if (current > limit) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
      }
      next();
    } catch (e) {
      next();
    }
  };
};

const SANITIZE_OPTIONS = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    'img': ['src', 'alt', 'title', 'width', 'height'],
    'iframe': ['src', 'width', 'height', 'allow', 'allowfullscreen', 'frameborder'],
    'span': ['class', 'style'],
    'p': ['class', 'style'],
    'div': ['class', 'style']
  },
  allowedClasses: {
    '*': ['*']
  },
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background-color': [/.*/],
      'text-align': [/.*/]
    }
  },
  allowIframeRelativeUrls: true,
};

// --- API ROUTES ---

// 1. Articles Endpoints
app.get('/api/articles', async (req, res) => {
  try {
    const role = (req.query.role || req.headers['x-user-role'] || 'Reader') as string;
    const email = (req.query.email || req.headers['x-user-email'] || '') as string;
    const pageStr = (req.query.page || '1') as string;
    const limitStr = (req.query.limit || 'all') as string;
    
    const cacheKey = `articles_list:role_${role}:${email || 'none'}:p_${pageStr}:l_${limitStr}`;
    const cached = await redisService.get<any[]>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    let results: any[];
    if (role === 'Admin' || role === 'Writer' || role === 'Principal Engineer') {
      results = await db.select().from(articles).orderBy(desc(articles.createdAt));
    } else {
      results = await db
        .select()
        .from(articles)
        .where(
          and(
            eq(articles.status, 'approved'),
            or(isNull(articles.publishedAt), lte(articles.publishedAt, Date.now()))
          )
        )
        .orderBy(desc(articles.createdAt));
    }
    
    // Apply pagination if provided
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      results = results.slice(startIndex, startIndex + limit);
    }

    const mapped = results.map(art => {
      let contentArray = [art.content];
      try {
        if (art.content.trim().startsWith('[')) {
          contentArray = JSON.parse(art.content);
        }
      } catch (e) {}
      return { ...art, content: contentArray };
    });

    await redisService.set(cacheKey, mapped, 300);
    res.json(mapped);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/search-index', async (req, res) => {
  try {
    const results = await db
      .select({ id: articles.id, title: articles.title, category: articles.category, slug: articles.slug })
      .from(articles)
      .where(eq(articles.status, 'approved'));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/search/query', async (req, res) => {
  try {
    const query = (req.query.q || '') as string;
    if (!query) {
      return res.json({ articles: [], authors: [] });
    }
    const cleanQuery = query.toLowerCase().trim();

    // Fetch approved articles
    const allArticles = await db
      .select()
      .from(articles)
      .where(eq(articles.status, 'approved'));

    const filteredArticles = allArticles.filter(art => 
      art.title.toLowerCase().includes(cleanQuery) || 
      art.category.toLowerCase().includes(cleanQuery) || 
      (art.tags && art.tags.toLowerCase().includes(cleanQuery))
    ).map(art => {
      let contentArray = [art.content];
      try {
        if (art.content.trim().startsWith('[')) {
          contentArray = JSON.parse(art.content);
        }
      } catch (e) {}
      return { ...art, content: contentArray };
    });

    // Fetch authors
    const allAuthors = await db.select().from(users).where(eq(users.role, 'Writer'));
    const filteredAuthors = allAuthors.filter(u => 
      u.name.toLowerCase().includes(cleanQuery) || 
      (u.bio && u.bio.toLowerCase().includes(cleanQuery))
    );

    res.json({
      articles: filteredArticles,
      authors: filteredAuthors
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/articles/realtime-stats', async (req, res) => {
  try {
    const totalArticles = await db.select().from(articles);
    const approvedCount = totalArticles.filter(a => a.status === 'approved').length;
    const pendingCount = totalArticles.filter(a => a.status === 'pending').length;
    const viewsSum = totalArticles.reduce((sum, a) => sum + (parseInt(a.views) || 0), 0);

    res.json({
      total: totalArticles.length,
      published: approvedCount,
      pending: pendingCount,
      totalViews: viewsSum,
      activeReaders: Math.floor(Math.random() * 25) + 5
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles/:id/view', async (req, res) => {
  try {
    const id = req.params.id;
    // Increment view in Redis Hash
    await redisService.hincrby('article_views_sync', id, 1);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Sync views to PostgreSQL every 10 minutes
setInterval(async () => {
  try {
    const viewsData = await redisService.hgetall('article_views_sync');
    if (viewsData && Object.keys(viewsData).length > 0) {
      console.log('Syncing views to PostgreSQL...', viewsData);
      // Delete the hash so we start fresh for the next interval
      await redisService.del('article_views_sync');
      
      // Update each article in the database
      for (const [id, count] of Object.entries(viewsData)) {
        if (!count || isNaN(Number(count))) continue;
        
        // Fetch current views
        const currentRes = await db.select({ views: articles.views }).from(articles).where(eq(articles.id, id)).limit(1);
        if (currentRes.length > 0) {
          const currentViews = parseInt(currentRes[0].views) || 0;
          const newViews = currentViews + Number(count);
          await db.update(articles).set({ views: newViews.toString() }).where(eq(articles.id, id));
        }
      }
      console.log('Views sync complete.');
    }
  } catch (error) {
    console.error('Error syncing views:', error);
  }
}, 10 * 60 * 1000); // 10 minutes

app.get('/api/articles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const cacheKey = `article_detail:${id}`;
    const cached = await redisService.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const resDb = await db
      .select()
      .from(articles)
      .where(or(eq(articles.id, id), eq(articles.slug, id)))
      .limit(1);

    if (resDb.length === 0) {
      return res.status(404).json({ error: `Article with ID ${id} not found.` });
    }

    const art = resDb[0];
    let contentArray = [art.content];
    try {
      if (art.content.trim().startsWith('[')) {
        contentArray = JSON.parse(art.content);
      }
    } catch (e) {}

    const result = { ...art, content: contentArray };
    await redisService.set(cacheKey, result, 300);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const body = req.body;
    let contentString = '';
    if (Array.isArray(body.content)) {
      contentString = JSON.stringify(body.content);
    } else {
      contentString = String(body.content || '');
    }

    const cleanContent = sanitizeHtml(contentString, SANITIZE_OPTIONS);

    const payload = {
      id: body.id || `art_${Date.now()}`,
      title: body.title,
      category: body.category,
      content: cleanContent,
      authorId: body.authorId || null,
      author: body.author ? JSON.parse(JSON.stringify(body.author)) : null,
      createdAt: body.createdAt || Date.now(),
      publishedAt: body.publishedAt || Date.now(),
      img: body.img || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=60',
      views: body.views || '0',
      status: body.status || 'approved',
      slug: body.slug || null,
      metaDescription: body.metaDescription || '',
      metaKeywords: body.metaKeywords || '',
      externalAuthor: body.externalAuthor || null,
      likes: body.likes || 0,
      tags: body.tags || '',
      readTime: body.readTime || '3 min read'
    };

    await db.insert(articles).values(payload);
    await redisService.delPattern('articles_list:*');
    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    let contentString = '';
    if (body.content) {
      if (Array.isArray(body.content)) {
        contentString = JSON.stringify(body.content);
      } else {
        contentString = String(body.content || '');
      }
      body.content = sanitizeHtml(contentString, SANITIZE_OPTIONS);
    }

    await db.update(articles).set(body).where(eq(articles.id, id));
    await redisService.del(`article_detail:${id}`);
    if (body.slug) {
      await redisService.del(`article_detail:${body.slug}`);
    }
    await redisService.delPattern('articles_list:*');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await db.delete(articles).where(eq(articles.id, id));
    await redisService.del(`article_detail:${id}`);
    await redisService.delPattern('articles_list:*');
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Categories Endpoints
app.get('/api/categories', async (req, res) => {
  try {
    const cacheKey = `categories_list_all`;
    const cached = await redisService.get<any[]>(cacheKey);
    if (cached) return res.json(cached);

    const activeArticles = await db
      .select({ category: articles.category })
      .from(articles)
      .where(
        and(
          eq(articles.status, 'approved'),
          or(isNull(articles.publishedAt), lte(articles.publishedAt, Date.now()))
        )
      );

    const countsMap: Record<string, number> = {};
    activeArticles.forEach(art => {
      const catsInArticle = (art.category || "")
        .split(',')
        .map(c => c.trim())
        .filter(Boolean);
      catsInArticle.forEach(c => {
        const key = c.toLowerCase();
        countsMap[key] = (countsMap[key] || 0) + 1;
      });
    });

    const list = await db.select().from(categories);
    const mappedList = list.map(cat => {
      const matchKey = cat.title.toLowerCase();
      return {
        ...cat,
        count: String(countsMap[matchKey] || 0)
      };
    });

    await redisService.set(cacheKey, mappedList, 120);
    res.json(mappedList);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const data = req.body;
    let existing: any[] = [];
    if (data.id) {
      existing = await db.select().from(categories).where(eq(categories.id, Number(data.id))).limit(1);
    } else {
      existing = await db.select().from(categories).where(eq(categories.title, data.title)).limit(1);
    }

    if (existing.length > 0) {
      await db
        .update(categories)
        .set({
          title: data.title || existing[0].title,
          count: String(data.count || existing[0].count),
          color: data.color || existing[0].color,
          iconName: data.iconName || existing[0].iconName,
          desc: data.desc || existing[0].desc,
        })
        .where(eq(categories.id, existing[0].id));
    } else {
      await db.insert(categories).values({
        title: data.title,
        count: String(data.count || '0'),
        color: data.color || '#3b82f6',
        iconName: data.iconName || 'Hash',
        desc: data.desc || 'No description provided.',
      });
    }

    await redisService.del(`categories_list_all`);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!isNaN(id)) {
      await db.delete(categories).where(eq(categories.id, id));
      await redisService.del(`categories_list_all`);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. User & Authors Endpoints
app.get('/api/users', async (req, res) => {
  try {
    let results = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Apply pagination if provided
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);
    if (!isNaN(page) && !isNaN(limit) && page > 0 && limit > 0) {
      const startIndex = (page - 1) * limit;
      results = results.slice(startIndex, startIndex + limit);
    }
    
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const body = req.body;
    
    const newUser = {
      ...body,
      createdAt: body.createdAt || Date.now(),
      role: body.role || 'user',
      hasBlueBadge: body.hasBlueBadge || 0,
      password: body.password || 'defaultPassword' // Fallback
    };
    
    const [insertedUser] = await db.insert(users).values(newUser).returning();
    const { password, ...safeUser } = insertedUser;
    
    res.status(201).json({ success: true, data: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/status', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    
    if (!status || !['Active', 'Suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await db.update(users).set({ status }).where(eq(users.id, id));
    res.json({ success: true, message: `User status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(users).where(eq(users.id, id));
    res.json({ success: true, message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/authors', async (req, res) => {
  try {
    const list = await db.select().from(users).where(eq(users.role, 'Writer'));
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const username = (req.query.username || '') as string;
    const u = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (u.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(u[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Newsletter support
app.post('/api/newsletter/subscribe', async (req, res) => {
  try {
    const email = req.body.email;
    if (!email) return res.status(400).json({ error: 'Email required' });

    await db.insert(newsletterSubscribers).values({
      email,
      createdAt: Date.now()
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/support/message', async (req, res) => {
  try {
    const body = req.body;
    await db.insert(supportMessages).values({
      name: body.name || 'Anonymous',
      email: body.email,
      subject: body.subject || 'No Subject',
      message: body.message,
      createdAt: Date.now()
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Auth Endpoints
app.post('/api/auth/login', rateLimit(5, 60), async (req, res) => {
  try {
    const { email, password, isAdminLogin } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userRes = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userRes.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = userRes[0];
    
    if (user.status === 'Suspended') {
      return res.status(403).json({ error: 'Account suspended. Please contact support.' });
    }
    
    if (isAdminLogin && user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { password: _, ...safeUser } = user;
    
    const token = await new SignJWT(safeUser)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
      
    res.json({ success: true, token, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/register', rateLimit(5, 60), async (req, res) => {
  try {
    const { email, password, username, name } = req.body;
    if (!email || !password || !username || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    const existing = await db.select().from(users).where(or(eq(users.email, email), eq(users.username, username))).limit(1);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const payload = {
      username,
      email,
      password: hashedPassword,
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      role: 'user',
      createdAt: Date.now(),
    };

    const insertedUser = await db.insert(users).values(payload).returning();
    const { password: _, ...safeUser } = insertedUser[0];

    const token = await new SignJWT(safeUser)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
      
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Comments
app.get('/api/comments/:articleId', async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const results = await db.select().from(comments).where(eq(comments.articleId, articleId)).orderBy(desc(comments.createdAt));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments', rateLimit(10, 60), async (req, res) => {
  try {
    const { articleId, author, avatar, content, parentId } = req.body;
    if (!articleId || !content || !author) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const payload = {
      articleId,
      author,
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author}`,
      content: sanitizeHtml(content, SANITIZE_OPTIONS),
      parentId: parentId || null,
      likes: 0,
      createdAt: Date.now()
    };
    const result = await db.insert(comments).values(payload).returning();
    res.json({ success: true, comment: result[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comments/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(comments).where(eq(comments.id, id));
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const comment = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
    if (comment.length === 0) return res.status(404).json({ error: 'Not found' });
    const newLikes = (comment[0].likes || 0) + 1;
    await db.update(comments).set({ likes: newLikes }).where(eq(comments.id, id));
    res.json({ success: true, likes: newLikes });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Interactions (Like, Bookmark)
app.post('/api/interactions', async (req, res) => {
  try {
    const { articleId, interactionType, username } = req.body;
    if (!articleId || !interactionType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const uname = username || 'guest';
    
    if (interactionType === 'like') {
      const existing = await db.select().from(articleLikes).where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.username, uname))).limit(1);
      if (existing.length === 0) {
        await db.insert(articleLikes).values({ username: uname, articleId, createdAt: Date.now() });
      }
    } else if (interactionType === 'unlike') {
      await db.delete(articleLikes).where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.username, uname)));
    } else if (interactionType === 'bookmark') {
      const existing = await db.select().from(bookmarks).where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.username, uname))).limit(1);
      if (existing.length === 0) {
        await db.insert(bookmarks).values({ username: uname, articleId, createdAt: Date.now() });
      }
    } else if (interactionType === 'unbookmark') {
      await db.delete(bookmarks).where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.username, uname)));
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/interactions/:articleId', async (req, res) => {
  try {
    const articleId = req.params.articleId;
    const username = (req.query.username || 'guest') as string;
    
    const userLikes = await db.select().from(articleLikes).where(and(eq(articleLikes.articleId, articleId), eq(articleLikes.username, username))).limit(1);
    const userBookmarks = await db.select().from(bookmarks).where(and(eq(bookmarks.articleId, articleId), eq(bookmarks.username, username))).limit(1);
    const totalLikes = await db.select().from(articleLikes).where(eq(articleLikes.articleId, articleId));
    
    res.json({
      liked: userLikes.length > 0,
      bookmarked: userBookmarks.length > 0,
      totalLikes: totalLikes.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Article Revisions (Cloud Draft)
app.get('/api/revisions', async (req, res) => {
  try {
    const articleId = (req.query.articleId || '') as string;
    if (!articleId) return res.json([]);
    const results = await db.select().from(articleRevisions).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/revisions', async (req, res) => {
  try {
    const { revisionId } = req.body;
    if (revisionId) {
      const rev = await db.select().from(articleRevisions).where(eq(articleRevisions.id, Number(revisionId))).limit(1);
      if (rev.length > 0) {
        // Find current article to save it as backup revision
        const { articleId } = rev[0];
        const currentArt = await db.select().from(articles).where(eq(articles.id, articleId)).limit(1);
        if (currentArt.length > 0) {
          await db.insert(articleRevisions).values({
            articleId,
            title: currentArt[0].title,
            content: currentArt[0].content,
            category: currentArt[0].category,
            img: currentArt[0].img,
            createdAt: Date.now()
          });
        }
        return res.json({ success: true, restored: rev[0] });
      }
      return res.status(404).json({ error: 'Revision not found' });
    }
    res.status(400).json({ error: 'Missing revisionId' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/revisions/save', async (req, res) => {
  try {
    const { articleId, title, content, category, img } = req.body;
    if (!articleId || !title) {
      return res.status(400).json({ error: 'Missing articleId or title' });
    }
    
    const existing = await db.select().from(articleRevisions).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt));
    if (existing.length >= 15) {
      const toDelete = existing.slice(14).map(e => e.id);
      for (const delId of toDelete) {
        await db.delete(articleRevisions).where(eq(articleRevisions.id, delId));
      }
    }
    
    const result = await db.insert(articleRevisions).values({
      articleId,
      title,
      content,
      category: category || '',
      img: img || '',
      createdAt: Date.now()
    }).returning();
    
    res.json({ success: true, revision: result[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drafts/latest', async (req, res) => {
  try {
    const articleId = (req.query.articleId || '') as string;
    if (!articleId) return res.json(null);
    const results = await db.select().from(articleRevisions).where(eq(articleRevisions.articleId, articleId)).orderBy(desc(articleRevisions.createdAt)).limit(1);
    if (results.length > 0) {
      res.json(results[0]);
    } else {
      res.json(null);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const upload = multer({ storage: multer.memoryStorage() });

app.get('/api/media', async (req, res) => {
  try {
    const results = await db.select().from(media).orderBy(desc(media.createdAt));
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
  try {
    const cloudName = process.env.PUBLIC_CLOUDINARY_CLOUD_NAME || 'dr070zmrm';
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!apiKey || !apiSecret) {
      // Fallback
      const base64 = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64}`;
      return res.json({ success: true, url: dataUrl, message: 'Cloudinary credentials missing, using Base64 fallback' });
    }

    const timestamp = Math.round(Date.now() / 1000).toString();
    const folder = 'peXih';
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + apiSecret).digest('hex');

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    
    // We must use fetch with form-data since this is Express (not web Request API)
    const formData = new FormData();
    const blob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', blob, file.originalname);
    formData.append('api_key', apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const cloudinaryResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData as any,
    });

    const result = await cloudinaryResponse.json();

    if (!cloudinaryResponse.ok) {
      return res.status(cloudinaryResponse.status).json({ error: result.error?.message || 'Cloudinary upload failed' });
    }

    // Save to DB
    const newMedia = {
      publicId: result.public_id,
      url: result.secure_url || result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      createdAt: Date.now(),
    };
    
    await db.insert(media).values(newMedia);

    res.json({
      success: true,
      url: newMedia.url,
      public_id: newMedia.publicId,
    });
  } catch (error: any) {
    console.error('Cloudinary Upload Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Default status endpoint
app.get('/api/status', (req, res) => {

// Start server only if not in Vercel serverless environment
if (!process.env.VERCEL) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`🚀 Yondaime Node.js Express server running on: http://localhost:${port}/api`);
  });
}

export default app;
