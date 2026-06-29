import { articlesData } from "./lib/articlesData";

async function seed() {
  const API_BASE = "https://dev13579.yondaime.my.id";
  for (const art of articlesData) {
    try {
      // POST logic from api.ts
      const response = await fetch(`${API_BASE}/api/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: art.title,
          category: art.category,
          content: art.content,
          img: art.img,
          views: art.views,
          authorId: 1,
          status: art.status || "approved",
          tags: art.tags || ""
        })
      });
      console.log(`Seeded ${art.title}: ${response.status}`);
    } catch(e) {
      console.error(e);
    }
  }
}

seed();
