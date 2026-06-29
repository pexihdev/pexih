import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:8080';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), { status: 401 });
    }

    const url = new URL(request.url);
    const articleId = url.pathname.split('/').pop() || ''; 
    // Wait, the client is fetching /api/interactions, actually the frontend does not fetch GET /api/interactions in client side except for recommends?
    // Let's just proxy GET to backend Express. 
    const res = await fetch(`${backendUrl}/api/interactions/${articleId}?username=${encodeURIComponent(activeUser.username)}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const body = await request.json();
    
    // Call backend Express
    const res = await fetch(`${backendUrl}/api/interactions`, {
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
