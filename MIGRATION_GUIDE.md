# Panduan Migrasi: Yondaime News
## Vercel (Next.js Frontend & Admin) + Fly.io (NestJS API Hub) + Neon PostgreSQL + Upstash Redis

Dokumen ini berisi arsitektur lengkap, kode sumber siap produksi, berkas konfigurasi, serta langkah demi langkah untuk melakukan migrasi infrastruktur **Yondaime News** dari Cloudflare ke **Vercel** dan **Fly.io** dengan mempertahankan database **Neon PostgreSQL** serta menambahkan akselerasi caching performa tinggi menggunakan **Upstash Redis**.

---

## Daftar Isi
1. [Arsitektur Baru & Alur Data](#1-arsitektur-baru--alur-data)
2. [Langkah 1: Next.js Frontend ke Vercel](#langkah-1-nextjs-frontend-ke-vercel)
3. [Langkah 2: Integrasi Upstash Redis](#langkah-2-integrasi-upstash-redis)
4. [Langkah 3: NestJS API Server ke Fly.io](#langkah-3-nestjs-api-server-ke-flyio)
5. [Langkah 4: Konfigurasi Dockerfile & fly.toml](#langkah-4-konfigurasi-dockerfile--flytoml)
6. [Langkah 5: Sinkronisasi Skema Database Neon PostgreSQL](#langkah-5-sinkronisasi-skema-database-neon-postgresql)
7. [Langkah 6: Deploy & Verifikasi](#langkah-6-deploy--verifikasi)

---

## 1. Arsitektur Baru & Alur Data

```
┌──────────────────────────────────────────┐
│          User Browser / Client           │
└────────────────────┬─────────────────────┘
                     │
                     │ (Akses URL / & /admin)
                     ▼
┌──────────────────────────────────────────┐
│            Vercel Serverless             │ <─── [Next.js App Router Frontend]
└──────────┬────────────────────┬──────────┘
           │                    │
           │ (REST SDK)         │ (Query API)
           ▼                    ▼
┌──────────────────┐   ┌───────────────────┐
│  Upstash Redis   │   │  Fly.io Container │ <─── [NestJS REST API Server]
│  (Edge Cache)    │   └────────┬──────────┘
└──────────────────┘            │
                                │ (Drizzle ORM via Pool)
                                ▼
                       ┌───────────────────┐
                       │  Neon PostgreSQL  │ <─── [Database Relasional Utama]
                       └───────────────────┘
```

---

## Langkah 1: Next.js Frontend ke Vercel

Aplikasi Next.js pada repositori ini dirancang menggunakan Next.js App Router (v15+). Next.js berjalan secara native di **Vercel** dengan performa dan kecepatan loading yang optimal.

### 1. Persiapan Repositori GitHub
Pastikan semua perubahan terbaru dari repositori lokal Anda telah didorong (push) ke GitHub:
```bash
git init
git add .
git commit -m "feat: prepare for vercel, fly.io, and upstash redis migration"
git remote add origin <your-github-repo-url>
git branch -M main
git push -u origin main
```

### 2. Hubungkan Repositori ke Vercel
1. Masuk ke [Vercel Dashboard](https://vercel.com) menggunakan akun Anda.
2. Klik tombol **Add New** lalu pilih **Project**.
3. Cari dan **Import** repositori GitHub Anda.
4. Di bagian **Configure Project**, jalankan konfigurasi berikut:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `./` (Root direktori)
   - **Build & Development Settings**: Biarkan default (`npm run build` dan `next start`).

### 3. Tambahkan Environment Variables di Vercel
Pada tab **Environment Variables** sebelum menekan tombol *Deploy*, tambahkan variabel berikut demi keamanan:

| Key | Value / Deskripsi | Sifat |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `https://<nama-aplikasi-anda>.fly.dev` (Atau URL domain kustom yang Anda set di Fly.io) | Public |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require&channel_binding=require` | Private |
| `UPSTASH_REDIS_REST_URL` | `https://<your-db-name>.upstash.io` (URL dari dashboard upstash.com) | Private |
| `UPSTASH_REDIS_REST_TOKEN` | *Token otorisasi dari dashboard upstash.com* | Private |

> **Catatan Penting untuk Generate Static Params pada Vercel Build:**  
> Selama build Next.js di Vercel, fungsi `generateStaticParams()` akan dieksekusi secara statis. Jika api NestJS di Fly.io belum online, request fetch akan timeout dalam 250ms dan otomatis jatuh ke data fallback statis yang aman (sehingga build web tidak akan gagal). Setelah API Fly.io online, Anda dapat melakukan **Redeploy** di Vercel untuk membangun halaman statis lengkap.

5. Klik tombol **Deploy** dan tunggu proses pembuatan selesai dalam waktu 1-2 menit.

---

## Langkah 2: Integrasi Upstash Redis

Upstash Redis adalah layanan Redis serverless yang dioptimalkan untuk performa tinggi melalui koneksi REST HTTP atau protokol TCP Redis klasik. Ini sangat cocok untuk skenario arsitektur serverless (Vercel) dan container runtime (Fly.io).

### 1. Instalasi Driver REST SDK
Untuk performa edge optimal tanpa batasan koneksi TCP pada serverless, kita menggunakan `@upstash/redis` (untuk Next.js di Vercel) atau `ioredis` / `@upstash/redis` di NestJS.

Pada proyek NestJS API Anda, jalankan:
```bash
npm install @upstash/redis
```

---

## Langkah 3: NestJS API Server ke Fly.io

Di bawah ini adalah struktur proyek mandiri untuk **NestJS API Server** yang akan ditaruh dalam repositori terpisah atau subfolder (misal `/api`), lalu dideploy ke Fly.io.

### 1. Struktur Proyek NestJS API
```text
yondaime-nestjs-api/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── database.service.ts
│   │   └── schema.ts
│   ├── redis/
│   │   ├── redis.module.ts
│   │   └── redis.service.ts
│   └── articles/
│       ├── articles.module.ts
│       ├── articles.controller.ts
│       └── articles.service.ts
├── Dockerfile
├── fly.toml
├── package.json
└── tsconfig.json
```

### 2. File Konfigurasi NestJS: `package.json`
Buat berkas `package.json` untuk NestJS Anda:
```json
{
  "name": "yondaime-nestjs-api",
  "version": "1.0.0",
  "description": "Yondaime News API Backend",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/config": "^3.2.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@upstash/redis": "^1.31.0",
    "drizzle-orm": "^0.45.2",
    "pg": "^8.11.3",
    "reflect-metadata": "^0.2.0",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "@types/pg": "^8.11.0",
    "typescript": "^5.1.3"
  }
}
```

### 3. File Entry Point: `src/main.ts`
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Mengaktifkan CORS agar dapat diakses dari domain Vercel Anda secara aman
  app.enableCors({
    origin: '*', // Sebaiknya pasang domain vercel spesifik pada tahap produksi
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Prefiks API global agar rute sesuai dengan panggilannya: /api/...
  app.setGlobalPrefix('api');

  // Port default Fly.io sering menggunakan 8080 atau PORT env
  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 NestJS API running on: http://localhost:${port}/api`);
}
bootstrap();
```

### 4. File Modul Redis: `src/redis/redis.service.ts`
Layanan ini mengotomatiskan koneksi ke cluster Upstash Redis Anda menggunakan token otorisasi REST HTTP:
```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService implements OnModuleInit {
  private redis: Redis;

  onModuleInit() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn('⚠️ Upstash Redis environment variables are missing! Caching is disabled.');
      return;
    }

    this.redis = new Redis({
      url,
      token,
    });
    console.log('🚀 Connected to Upstash Redis securely via REST SDK!');
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const data = await this.redis.get(key);
      if (typeof data === 'string') {
        return JSON.parse(data) as T;
      }
      return data as T | null;
    } catch (e) {
      console.error(`Error reading key ${key} from Redis:`, e);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!this.redis) return;
    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      await this.redis.set(key, serialized, { ex: ttlSeconds });
    } catch (e) {
      console.error(`Error writing key ${key} to Redis:`, e);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(key);
    } catch (e) {
      console.error(`Error deleting key ${key} from Redis:`, e);
    }
  }
}
```

### 5. Redis Module: `src/redis/redis.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
```

### 6. Database Schema: `src/database/schema.ts`
```typescript
import { pgTable, serial, text, timestamp, integer, jsonb, real, bigint } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  img: text('img').notNull(),
  views: text('views').notNull(),
  status: text('status').default('approved').notNull(),
  likes: integer('likes').default(2400),
  tags: text('tags'),
  readTime: text('read_time'),
});

export const authors = pgTable('authors', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  avatar: text('avatar').notNull(),
  role: text('role').notNull(),
  bio: text('bio').default(''),
  portfolioName: text('portfolio_name').default(''),
  portfolioUrl: text('portfolio_url').default(''),
  banner: text('banner').default(''),
  socialLink: text('social_link').default(''),
  expertise: text('expertise').default('Minimalism, UI Design'),
  memberSince: text('member_since').default('March 2023'),
  savedPrivacy: text('saved_privacy').default('private'),
  hasBlueBadge: integer('has_blue_badge').default(0),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey().notNull(),
  title: text('title').unique().notNull(),
  count: text('count').notNull(),
  color: text('color').notNull(),
  iconName: text('icon_name').notNull(),
  desc: text('desc').notNull(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(),
});
```

### 7. Database Service: `src/database/database.service.ts`
```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  onModuleInit() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is missing in your environment variables!');
    }

    this.pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });

    this.db = drizzle(this.pool, { schema });
    console.log('🔌 Connected to Neon PostgreSQL database securely using pool');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
```

### 8. Database Module: `src/database/database.module.ts`
```typescript
import { Module, Global } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
```

### 9. Rute & Kontroler Artikel: `src/articles/articles.controller.ts`
```typescript
import { Controller, Get, Post, Put, Body, Param, Query, Headers } from '@nestjs/common';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  async getArticles(
    @Query('role') queryRole?: string,
    @Headers('X-User-Role') headerRole?: string
  ) {
    const role = headerRole || queryRole || 'Reader';
    return this.articlesService.findAll(role);
  }

  @Get(':id')
  async getArticleById(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Post()
  async createArticle(@Body() data: any) {
    return this.articlesService.create(data);
  }

  @Put(':id')
  async updateArticle(@Param('id') id: string, @Body() data: any) {
    return this.articlesService.update(id, data);
  }
}
```

### 10. Service Artikel Termasuk Upstash Cache Logic: `src/articles/articles.service.ts`
Keuntungan utama Upstash Redis teruji di sini. API akan merespon instan dalam beberapa milidetik bila data berada di cache memori Redis daripada membebani query Neon PostgreSQL database:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { RedisService } from '../redis/redis.service';
import { articles } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ArticlesService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly redisService: RedisService
  ) {}

  async findAll(role: string) {
    const cacheKey = `articles_list:role_${role}`;
    
    // 1. Coba kueri cache Redis
    const cachedData = await this.redisService.get<any[]>(cacheKey);
    if (cachedData) {
      console.log('⚡ Cache Hit: articles list fetched from Upstash Redis!');
      return cachedData;
    }

    // 2. Fallback kueri Neon PostgreSQL database
    let fetchedArticles: any[];
    if (role !== 'Admin' && role !== 'Writer' && role !== 'Principal Engineer') {
      fetchedArticles = await this.dbService.db
        .select()
        .from(articles)
        .where(eq(articles.status, 'approved'));
    } else {
      fetchedArticles = await this.dbService.db.select().from(articles);
    }

    // 3. Simpan data ke cache Redis untuk 10 menit ke depan
    await this.redisService.set(cacheKey, fetchedArticles, 600);
    return fetchedArticles;
  }

  async findOne(id: string) {
    const cacheKey = `article_detail:${id}`;
    
    // 1. Coba kueri cache Redis
    const cachedArticle = await this.redisService.get<any>(cacheKey);
    if (cachedArticle) {
       console.log(`⚡ Cache Hit: article id [${id}] fetched from Upstash Redis!`);
       return cachedArticle;
    }

    // 2. Fallback database
    const result = await this.dbService.db
      .select()
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Article with ID ${id} not found.`);
    }

    const targetArticle = result[0];
    
    // 3. Simpan ke cache Redis selama 1 jam
    await this.redisService.set(cacheKey, targetArticle, 3600);
    return targetArticle;
  }

  async create(data: any) {
    const created = await this.dbService.db
      .insert(articles)
      .values({
        id: data.id,
        title: data.title,
        category: data.category,
        content: JSON.stringify(data.content),
        authorId: data.authorId || 1,
        createdAt: Date.now(),
        img: data.img || 'dev-type',
        views: '0',
        status: data.status || 'pending',
        tags: data.tags || '',
      })
      .returning();

    // Invalidation Cache setelah penulisan entri baru
    await this.invalidateArticlesCache();
    return created;
  }

  async update(id: string, data: any) {
    const updated = await this.dbService.db
      .update(articles)
      .set({
        title: data.title,
        category: data.category,
        content: typeof data.content === 'object' ? JSON.stringify(data.content) : data.content,
        status: data.status,
        tags: data.tags,
        img: data.img,
      })
      .where(eq(articles.id, id))
      .returning();

    // Hapus data cache detail dan data list lama yang sekarang sudah usang
    await this.redisService.del(`article_detail:${id}`);
    await this.invalidateArticlesCache();
    return updated;
  }

  private async invalidateArticlesCache() {
    // Invalidate semua cache list demi menjamin integritas data instan
    console.log('🧹 Invalidating articles lists key caches from Upstash Redis.');
    const roles = ['Reader', 'Admin', 'Writer', 'Principal Engineer'];
    for (const r of roles) {
      await this.redisService.del(`articles_list:role_${r}`);
    }
  }
}
```

## Langkah 4: Konfigurasi vercel.json untuk Serverless NestJS

NestJS dideploy ke **Vercel** sebagai fungsi serverless menggunakan file `vercel.json` dan entrypoint khusus. Ini memberi skalabilitas tinggi secara gratis tanpa mengelola server kontainer sendiri.

### 1. File Konfigurasi: `vercel.json`
Letakkan file ini di dalam direktori `backend/`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

### 2. File Entry Point Serverless Vercel: `api/index.ts`
Buat file baru di `backend/api/index.ts` untuk melayani request serverless secara kontinu dengan adaptasi Express:
```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();
let isBootstrapped = false;

export const bootstrap = async () => {
  if (isBootstrapped) return;
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server),
  );
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.init();
  isBootstrapped = true;
};

export default async function handler(req: any, res: any) {
  await bootstrap();
  server(req, res);
}
```

---

## Langkah 5: Sinkronisasi Skema Database Neon PostgreSQL

Karena Anda menggunakan **Neon PostgreSQL** sebagai database relasional SQL tunggal dengan skema yang sudah ada, Anda **tidak boleh menghapus/droptable** maupun mengosongkan antrean tabel yang menyimpan log aktivitas kustom para pembaca. 

Untuk mensinkronkan rilis NestJS API dengan Neon Postgres:
1. Hubungkan NestJS menggunakan URL koneksi yang persis sama.
2. Ketika mengubah atau menambahkan kolom baru pada masa depan di NestJS, selalu gunakan **Drizzle Kit** secara lokal sebelum mendorongnya ke live DB:
   ```bash
   npx drizzle-kit generate
   ```
3. Dorong skema baru tanpa merusak data dengan rilis aman:
   ```bash
   npx drizzle-kit push
   ```

---

## Langkah 6: Deploy & Verifikasi di Vercel

Dengan memigrasi NestJS ke Vercel, kita sekarang memiliki arsitektur **All-on-Vercel**.

### 1. Konfigurasi Proyek Backend di Vercel Dashboard
Setiap bagian (frontend dan backend) akan dideploy sebagai dua proyek Vercel terpisah dari repositori GitHub yang sama:

#### **A. Untuk Backend API (NestJS):**
1. Di [Vercel Dashboard](https://vercel.com), klik **Add New** -> **Project**.
2. **Import** repositori GitHub Anda.
3. Di tab **Configure Project**:
   - **Project Name**: `yondaime-news-api` (atau sesuka Anda)
   - **Framework Preset**: Pilih **Other** (atau let Vercel detect)
   - **Root Directory**: Klik **Edit** dan pilih folder **`backend`**.
   - **Build & Development Settings**:
     - **Build Command**: `npm run build` (atau `nest build`)
     - **Install Command**: `npm install` (atau default)
     - **Output Directory**: Biarkan default/kosong (Vercel secara dinamis melayani fungsi serverless lewat `vercel.json`).
4. Buka tab **Environment Variables** dan tambahkan:
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require&channel_binding=require`
   - `UPSTASH_REDIS_REST_URL`: *URL REST Redis Anda*
   - `UPSTASH_REDIS_REST_TOKEN`: *Token REST Redis Anda*
   - `CLOUDINARY_API_KEY`: *API Key Cloudinary Anda*
   - `CLOUDINARY_API_SECRET`: *API Secret Cloudinary Anda*
   - `CLOUDINARY_CLOUD_NAME`: dr070zmrm
5. Jalankan **Deploy**. Anda akan mendapatkan URL backend (misalnya: `https://yondaime-news-api.vercel.app`).

#### **B. Untuk Frontend & Admin Panel (Next.js):**
1. Di [Vercel Dashboard](https://vercel.com), klik **Add New** -> **Project**.
2. **Import** repositori yang sama.
3. Di tab **Configure Project**:
   - **Project Name**: `yondaime-news-frontend`
   - **Framework Preset**: **Next.js**
   - **Root Directory**: Pilih root **`./`** (utama).
   - **Build & Development Settings**:
     - **Build Command**: `node -e "const fs = require('fs'); if (fs.existsSync('.next')) fs.rmSync('.next', {recursive: true});" && cross-env NODE_OPTIONS="--max_old_space_size=2048" next build` (atau biarkan default Vercel menjalankan `npm run build`).
     - **Install Command**: `npm install` (atau default)
     - **Output Directory**: `.next` (default)
4. Buka tab **Environment Variables** dan tambahkan:
   - `NEXT_PUBLIC_BACKEND_URL`: `https://yondaime-news-api.vercel.app` (URL Vercel Backend yang didapat dari langkah A)
   - `DATABASE_URL`: `postgresql://neondb_owner:npg_vPaxrZCIX85y@ep-damp-river-aetebz2v-pooler.c-2.us-east-2.aws.neon.tech/yondaimeauhah?sslmode=require&channel_binding=require`
   - `UPSTASH_REDIS_REST_URL`: *URL REST Redis Anda*
   - `UPSTASH_REDIS_REST_TOKEN`: *Token REST Redis Anda*
   - `CLOUDINARY_API_KEY`: *API Key Cloudinary Anda*
   - `CLOUDINARY_API_SECRET`: *API Secret Cloudinary Anda*
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: dr070zmrm
5. Jalankan **Deploy**.

---
🚀 **Selamat! Seluruh sistem Yondaime News (Frontend, Admin Panel, dan Backend API NestJS) kini dideploy dan bersinergi secara sempurna dan berkinerja tinggi 100% di infrastruktur Vercel!**
