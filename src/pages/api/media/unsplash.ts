import type { APIRoute } from 'astro';

const CURATED_DEFAULT_IMAGES = [
  {
    id: 'default-1',
    url: 'https://images.unsplash.com/photo-1494438639946-1ebd1d2038b5?auto=format&fit=crop&w=800&q=80',
    description: 'Minimal warm lamp on table',
    author: 'Sven Brandsma',
    author_url: 'https://unsplash.com/@svenbrandsma'
  },
  {
    id: 'default-2',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
    description: 'Modern concrete architecture facade',
    author: 'Sven Mieke',
    author_url: 'https://unsplash.com/@sxm'
  },
  {
    id: 'default-3',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    description: 'Serene beach sunset wave',
    author: 'Sean Oulashin',
    author_url: 'https://unsplash.com/@seanyooo'
  },
  {
    id: 'default-4',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    description: 'Dynamic digital technology connections network',
    author: 'Anas Alshanti',
    author_url: 'https://unsplash.com/@anas_alshanti'
  },
  {
    id: 'default-5',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    description: 'Green microprocessor board tech concept',
    author: 'Alexandre Debiève',
    author_url: 'https://unsplash.com/@alexandre_debieve'
  },
  {
    id: 'default-6',
    url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80',
    description: 'Aesthetic high-tech workspace',
    author: 'Alex Kotliarskyi',
    author_url: 'https://unsplash.com/@frantic'
  },
  {
    id: 'default-7',
    url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    description: 'Aesthetic minimalist plant decoration',
    author: 'Sarah Dorweiler',
    author_url: 'https://unsplash.com/@sarahdorweiler'
  },
  {
    id: 'default-8',
    url: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=800&q=80',
    description: 'Inspiring aesthetic sky sunset',
    author: 'Ales Krivec',
    author_url: 'https://unsplash.com/@aleskrivec'
  },
  {
    id: 'default-9',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    description: 'Iconic Yosemite valley valley reflection',
    author: 'Anneliese Phillips',
    author_url: 'https://unsplash.com/@anneliese_p'
  },
  {
    id: 'default-10',
    url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    description: 'Misty green mountain pine trees',
    author: 'Kalen Emsley',
    author_url: 'https://unsplash.com/@kalenemsley'
  },
  {
    id: 'default-11',
    url: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80',
    description: 'Beautiful waterfall cascading over moss',
    author: 'Lars van de Goor',
    author_url: 'https://unsplash.com/@larsvandegoor'
  },
  {
    id: 'default-12',
    url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
    description: 'Mystical lush wooden forest pathway',
    author: 'Sebastian Unrau',
    author_url: 'https://unsplash.com/@sebi_p'
  },
  {
    id: 'default-13',
    url: 'https://images.unsplash.com/photo-1472214222541-d510753a4707?auto=format&fit=crop&w=800&q=80',
    description: 'Peaceful rolling hills under golden light',
    author: 'Sasha • Stories',
    author_url: 'https://unsplash.com/@sashastories'
  },
  {
    id: 'default-14',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    description: 'Vibrant majestic mountain pass sunset',
    author: 'Yevhenii Zakharov',
    author_url: 'https://unsplash.com/@e_zakharov'
  },
  {
    id: 'default-15',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    description: 'Tall redwood trees with sun rays breaking through',
    author: 'John Towner',
    author_url: 'https://unsplash.com/@johntowner'
  }
];

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') || '';
    
    const unsplashKey = process.env.PUBLIC_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_ACCESS_KEY;
    
    if (!unsplashKey) {
      let filtered = CURATED_DEFAULT_IMAGES;
      if (query.trim() !== '') {
        filtered = CURATED_DEFAULT_IMAGES.filter(img => 
          img.description.toLowerCase().includes(query.toLowerCase()) ||
          img.author.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      const results = filtered.length > 0 ? filtered : CURATED_DEFAULT_IMAGES.slice(0, 8);
      
      return new Response(JSON.stringify({
        results: results.map(item => ({
          id: item.id,
          urls: {
            regular: item.url,
            small: item.url.replace('&w=800', '&w=400')
          },
          description: item.description,
          user: {
            name: item.author,
            links: {
              html: item.author_url
            }
          }
        }))
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query || 'minimalism')}&client_id=${unsplashKey}&per_page=20`;
    const res = await fetch(unsplashUrl);
    
    if (!res.ok) {
      console.warn('Unsplash API returned error, falling back to default curated images');
      return new Response(JSON.stringify({
        results: CURATED_DEFAULT_IMAGES.map(item => ({
          id: item.id,
          urls: {
            regular: item.url,
            small: item.url.replace('&w=800', '&w=400')
          },
          description: item.description,
          user: {
            name: item.author,
            links: {
              html: item.author_url
            }
          }
        }))
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ results: data.results || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Unsplash Proxy Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
