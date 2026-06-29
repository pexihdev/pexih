import type { APIRoute } from 'astro';
import { getUserFromCookies } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { users } from '../../../../backend/src/database/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const payload = await getUserFromCookies(cookies);
    if (!payload || !payload.id) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    
    // Fetch fresh user data just in case
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.id as number),
    });
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
    }
    
    const { password: _, ...safeUser } = user;
    
    return new Response(JSON.stringify({ user: safeUser }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
