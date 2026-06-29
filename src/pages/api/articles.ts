import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { articles, users, articleRevisions } from '../../../backend/src/database/schema';
import { eq, desc } from 'drizzle-orm';
import { checkRateLimit, getClientIp } from '../../lib/rateLimiter';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, id),
      });
      
      if (!article) {
        return new Response(JSON.stringify({ error: 'Article not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Dynamically resolve author profile from users table if available
      if (article.authorId) {
        const dbAuthor = await db.query.users.findFirst({
          where: eq(users.id, article.authorId)
        });
        if (dbAuthor) {
          article.author = {
            name: dbAuthor.name,
            avatar: dbAuthor.avatar,
            role: dbAuthor.role,
            username: dbAuthor.username
          };
        }
      }
      
      return new Response(JSON.stringify(article), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const limit = Number(url.searchParams.get('limit')) || 100;
    
    const allArticles = await db.query.articles.findMany({
      limit,
      orderBy: [desc(articles.createdAt)],
    });
    
    // Batch resolve author profiles from users table for dynamic accuracy
    const authorIds = allArticles.map(a => a.authorId).filter((aid): aid is number => aid !== null && aid !== undefined);
    if (authorIds.length > 0) {
      const uniqueAuthorIds = Array.from(new Set(authorIds));
      const dbUsers = await db.query.users.findMany({
        where: (users, { inArray }) => inArray(users.id, uniqueAuthorIds)
      });
      const userMap = new Map(dbUsers.map(u => [u.id, u]));
      for (const art of allArticles) {
        if (art.authorId && userMap.has(art.authorId)) {
          const userObj = userMap.get(art.authorId)!;
          art.author = {
            name: userObj.name,
            avatar: userObj.avatar,
            role: userObj.role,
            username: userObj.username
          };
        }
      }
    }
    
    return new Response(JSON.stringify(allArticles), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const limitResult = checkRateLimit(`${ip}:post-articles`, 5, 60000); // Max 5 creations per minute
    if (limitResult.isLimited) {
      return new Response(JSON.stringify({
        error: `Too many requests. Please try again after ${new Date(limitResult.resetTime).toLocaleTimeString('id-ID')}`
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString()
        },
      });
    }

    const body = await request.json();
    
    // Resolve active user from middleware locals
    const activeUser = locals.user;
    const authorId = activeUser ? Number(activeUser.id) : (body.authorId ? Number(body.authorId) : null);
    
    // Standard author fallback
    const authorObj = activeUser ? {
      name: activeUser.name,
      avatar: activeUser.avatar,
      role: activeUser.role,
      username: activeUser.username
    } : (body.author || { name: 'Admin', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80', role: 'Administrator' });

    // Auto-generate ID and created_at if not provided
    const newArticle = {
      ...body,
      id: body.id || crypto.randomUUID(),
      authorId,
      author: authorObj,
      createdAt: body.createdAt || Date.now(),
      status: body.status || 'published',
      views: body.views || '0'
    };
    
    await db.insert(articles).values(newArticle);
    
    return new Response(JSON.stringify({ success: true, data: newArticle }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const limitResult = checkRateLimit(`${ip}:put-articles`, 10, 60000); // Max 10 updates per minute
    if (limitResult.isLimited) {
      return new Response(JSON.stringify({
        error: `Too many requests. Please try again after ${new Date(limitResult.resetTime).toLocaleTimeString('id-ID')}`
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString()
        },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const body = await request.json();
    
    const targetId = id || body.id;
    if (!targetId) {
      return new Response(JSON.stringify({ error: 'ID is required for update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Fetch the existing article to create a revision snapshot
    const existingArticle = await db.query.articles.findFirst({
      where: eq(articles.id, targetId),
    });
    
    const activeUser = locals.user;
    if (existingArticle) {
      // Create a revision snapshot of pre-updated values
      await db.insert(articleRevisions).values({
        articleId: existingArticle.id,
        title: existingArticle.title,
        content: existingArticle.content,
        category: existingArticle.category,
        img: existingArticle.img,
        updatedBy: activeUser ? Number(activeUser.id) : (existingArticle.authorId ? Number(existingArticle.authorId) : null),
        createdAt: Date.now(),
      });
    }
    
    const { id: _, ...updateData } = body;
    
    // Resolve active user from middleware locals and update relationship
    if (activeUser) {
      updateData.authorId = Number(activeUser.id);
      updateData.author = {
        name: activeUser.name,
        avatar: activeUser.avatar,
        role: activeUser.role,
        username: activeUser.username
      };
    }
    
    await db.update(articles)
      .set(updateData)
      .where(eq(articles.id, targetId));
      
    return new Response(JSON.stringify({ success: true, message: 'Article updated successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const limitResult = checkRateLimit(`${ip}:delete-articles`, 10, 60000); // Max 10 deletions per minute
    if (limitResult.isLimited) {
      return new Response(JSON.stringify({
        error: `Too many requests. Please try again after ${new Date(limitResult.resetTime).toLocaleTimeString('id-ID')}`
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((limitResult.resetTime - Date.now()) / 1000).toString()
        },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID is required for deletion' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    await db.delete(articles).where(eq(articles.id, id));
    
    return new Response(JSON.stringify({ success: true, message: 'Article deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
