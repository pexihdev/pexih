import type { APIRoute } from 'astro';
import { db } from '../../lib/db';
import { siteSettings } from '../../../backend/src/database/schema';

export const GET: APIRoute = async () => {
  try {
    const settings = await db.query.siteSettings.findMany();
    
    // Convert array of {key, value} to an object map
    const settingsMap = settings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    
    return new Response(JSON.stringify(settingsMap), {
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
    const body = await request.json();
    // Expecting body to be an object: { "siteName": "PEXIH", "theme": "light", ... }
    
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        await db.insert(siteSettings)
          .values({ key, value })
          .onConflictDoUpdate({
            target: siteSettings.key,
            set: { value }
          });
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Settings updated' }), {
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
