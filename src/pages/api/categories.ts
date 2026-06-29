import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { categories } from '../../../backend/src/database/schema';
import { eq, desc } from 'drizzle-orm';
import { checkRateLimit, getClientIp } from '../../lib/rateLimiter';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (id) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, Number(id)),
      });
      
      if (!category) {
        return new Response(JSON.stringify({ error: 'Category not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify(category), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const allCategories = await db.query.categories.findMany({
      orderBy: [desc(categories.id)],
    });
    
    return new Response(JSON.stringify(allCategories), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const limitResult = checkRateLimit(`${ip}:post-categories`, 5, 60000); // Max 5 categories created per minute
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
    
    // Auto-generate count if not provided
    const newCategory = {
      title: body.title,
      count: body.count || '0',
      color: body.color || '#FF6B00',
      iconName: body.iconName || 'Hash',
      desc: body.desc || ''
    };
    
    const result = await db.insert(categories).values(newCategory).returning();
    
    return new Response(JSON.stringify({ success: true, data: result[0] }), {
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    // Rate limit check
    const ip = getClientIp(request);
    const limitResult = checkRateLimit(`${ip}:put-categories`, 10, 60000); // Max 10 category updates per minute
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
    
    const targetId = id ? Number(id) : body.id;
    if (!targetId) {
      return new Response(JSON.stringify({ error: 'ID is required for update' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const { id: _, ...updateData } = body;
    
    await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, Number(targetId)));
      
    return new Response(JSON.stringify({ success: true, message: 'Category updated successfully' }), {
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
    const limitResult = checkRateLimit(`${ip}:delete-categories`, 10, 60000); // Max 10 category deletions per minute
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
    
    await db.delete(categories).where(eq(categories.id, Number(id)));
    
    return new Response(JSON.stringify({ success: true, message: 'Category deleted successfully' }), {
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
