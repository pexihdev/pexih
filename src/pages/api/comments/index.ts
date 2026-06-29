import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Please log in to comment' }), { status: 401 });
    }

    const body = await request.json();
    
    // Call backend Express
    const res = await fetch(`${backendUrl}/api/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        username: activeUser.username
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
