import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      status: 'success',
      message: 'Hello from Astro Node.js API!',
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
};
