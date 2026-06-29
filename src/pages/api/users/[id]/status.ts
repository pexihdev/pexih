import type { APIRoute } from "astro";

const backendUrl =
  import.meta.env.PUBLIC_BACKEND_URL || "https://pexih-api.vercel.app";

export const PUT: APIRoute = async ({ request, params }) => {
  try {
    const { id } = params;
    const body = await request.json();

    const response = await fetch(`${backendUrl}/api/users/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
