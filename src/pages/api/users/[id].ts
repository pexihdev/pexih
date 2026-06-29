import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import { users } from '../../../../backend/src/database/schema';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser || activeUser.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });

    await db.delete(users).where(eq(users.id, Number(id)));

    return new Response(JSON.stringify({ success: true, message: 'User deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
