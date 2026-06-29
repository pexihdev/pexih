import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { articles } from '../../../backend/src/database/schema';
import { ilike, or, and, eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q') || '';
    const limitParam = url.searchParams.get('limit') || '10';
    const limit = Math.min(parseInt(limitParam, 10) || 10, 50);

    if (!q.trim()) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Perform case-insensitive partial match search on title, category, tags, or content
    const results = await db.query.articles.findMany({
      where: and(
        eq(articles.status, 'approved'),
        or(
          ilike(articles.title, `%${q}%`),
          ilike(articles.category, `%${q}%`),
          ilike(articles.tags || articles.category, `%${q}%`),
          ilike(articles.content, `%${q}%`)
        )
      ),
      limit: limit,
    });

    // Format the response for search suggestions (auto-suggest highlights)
    const suggestions = results.map(art => ({
      id: art.id,
      title: art.title,
      category: art.category,
      img: art.img,
      tags: art.tags,
      slug: art.slug || art.id
    }));

    return new Response(JSON.stringify(suggestions), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // 1 minute client cache for suggestions
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
