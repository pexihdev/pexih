import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

// Detect if we are running on Vercel deployment
const isVercel = !!(process.env.VERCEL || process.env.VERCEL_ENV);

export default defineConfig({
  output: 'server',
  adapter: isVercel ? vercel() : node({
    mode: 'standalone'
  }),
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  }
});