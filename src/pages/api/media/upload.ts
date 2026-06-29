import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const POST: APIRoute = async ({ request }) => {
  try {
    const res = await fetch(`${backendUrl}/api/media/upload`, {
      method: 'POST',
      headers: {
        'content-type': request.headers.get('content-type') || '',
      },
      body: request.body,
      // @ts-ignore
      duplex: 'half'
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
