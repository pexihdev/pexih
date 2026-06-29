import type { APIRoute } from 'astro';
import { db } from '../lib/db';
import { articles, categories } from '../../backend/src/database/schema';
import { eq } from 'drizzle-orm';

const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://pexih.com';

export const GET: APIRoute = async () => {
  try {
    // Read approved/published articles directly from the database
    const dbArticles = await db.select().from(articles).where(eq(articles.status, 'approved'));
    
    // Read all categories dynamically from database
    const dbCategories = await db.select().from(categories);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url>
        <loc>${SITE_URL}</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
      <url>
        <loc>${SITE_URL}/explore</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
      
      <!-- Dynamic Categories -->
      ${dbCategories.map((cat: any) => `
      <url>
        <loc>${SITE_URL}/explore?category=${encodeURIComponent(cat.title)}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>
      `).join('')}

      <!-- Dynamic Articles -->
      ${dbArticles.map((article: any) => `
      <url>
        <loc>${SITE_URL}/article/${article.id}</loc>
        <lastmod>${new Date(article.publishedAt || article.createdAt || Date.now()).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.7</priority>
      </url>
      `).join('')}
    </urlset>`;

    return new Response(sitemap.trim(), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate'
      }
    });
  } catch (error) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>${SITE_URL}</loc></url>
      </urlset>`,
      {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' }
      }
    );
  }
};

