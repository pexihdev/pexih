import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const activeUser = locals.user;
    if (!activeUser) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), { status: 401 });
    }

    const url = new URL(request.url);
    const articleId = url.searchParams.get('articleId');
    if (!articleId) return new Response(JSON.stringify({ error: 'articleId required' }), { status: 400 });

    const res = await fetch(`${backendUrl}/api/revisions?articleId=${articleId}`);
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Please log in' }), { status: 401 });
    }

    const body = await request.json();
    const res = await fetch(`${backendUrl}/api/revisions`, {
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
