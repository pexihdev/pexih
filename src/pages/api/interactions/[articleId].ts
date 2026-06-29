import type { APIRoute } from 'astro';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const GET: APIRoute = async ({ params, request, locals }) => {
  try {
    const activeUser = locals.user;
    const { articleId } = params;
    
    // We can allow guests to fetch interactions? Yes, pass guest
    const username = activeUser ? activeUser.username : "guest";

    const res = await fetch(`${backendUrl}/api/interactions/${articleId}?username=${encodeURIComponent(username)}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { status: res.status });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
