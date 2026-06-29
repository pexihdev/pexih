import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { sql } from 'drizzle-orm';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Lazy migration for article_revisions to ensure columns exist in Neon DB
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS "article_revisions" (
          "id" serial PRIMARY KEY NOT NULL,
          "article_id" text NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
          "title" text NOT NULL,
          "content" text NOT NULL,
          "category" text NOT NULL DEFAULT '',
          "img" text NOT NULL DEFAULT '',
          "updated_by" integer,
          "created_at" bigint NOT NULL
        );
        ALTER TABLE "article_revisions" ADD COLUMN IF NOT EXISTS "category" text NOT NULL DEFAULT '';
        ALTER TABLE "article_revisions" ADD COLUMN IF NOT EXISTS "img" text NOT NULL DEFAULT '';
        ALTER TABLE "article_revisions" ADD COLUMN IF NOT EXISTS "updated_by" integer;
      `);
    } catch (e) {
      console.error("Lazy DB sync error:", e);
    }

    const activeUser = locals.user;
    if (!activeUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/revisions/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
