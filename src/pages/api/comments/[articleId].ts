import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const GET: APIRoute = async ({ params }) => {
  try {
    const { articleId } = params;

    const res = await fetch(`${backendUrl}/api/comments/${articleId}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
