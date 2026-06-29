import type { APIRoute } from 'astro';
import { setSessionCookie } from '../../../lib/auth';

const backendUrl = import.meta.env.PUBLIC_BACKEND_URL || 'https://pexih-api.vercel.app';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const payload = await request.json();
    
    // Proxy request to real backend
    const response = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return new Response(JSON.stringify(data), { status: response.status });
    }
    
    // Set HTTP-only cookie using the token from backend
    if (data.token) {
      setSessionCookie(cookies, data.token);
    }
    
    return new Response(JSON.stringify({ success: true, user: data.user }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
