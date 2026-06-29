import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db';
import { users } from '../../../../../backend/src/database/schema';
import { eq } from 'drizzle-orm';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser || activeUser.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { id } = params;
    if (!id) return new Response(JSON.stringify({ error: 'ID required' }), { status: 400 });

    const body = await request.json();
    const { status } = body;

    if (!status || !['Active', 'Suspended'].includes(status)) {
      return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
    }

    await db.update(users).set({ status }).where(eq(users.id, Number(id)));

    return new Response(JSON.stringify({ success: true, message: `Status updated to ${status}` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
