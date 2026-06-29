# Yondaime Master Architecture & Specification Prompt

This artifact serves as the absolute master specification and reproduction blueprint for **Yondaime**, a highly polished, mobile-first, premium Swiss-modern digital news/magazine and tech reader. Anyone or any generative AI model processing this file will have the complete technical, visual, structural, and integration blueprint required to replicate Yondaime exactly, down to single-pixel details.

---

## 1. Core Visual Design System (Swiss-Modern)

### A. Viewport & Chassis Rules (Strict Mobile-First Phase)
- **Container Class**: The physical boundary of the app is always restricted inside a centered mobile frame:
  `className="fixed inset-0 w-full max-w-[400px] mx-auto flex flex-col bg-white shadow-sm font-sans overflow-hidden"`
- **Layout Alignment**: All non-full-width items (banners, ads, hero cards) MUST be centered precisely inside this chassis wrapper (using `mx-auto` or `justify-center`).

### B. Typography Scale & Fonts
- **Primary Font Family**: Clean sans-serif sans (e.g., **Inter** or similar clean layout font) loaded via NextJS Font loader with fallback sans-serif.
- **Font Sizes**:
  - **Main Screen/Page Titles**: `text-[16px]` or `text-[14px]` (font-bold/font-medium, low tracking-tight, slate-900).
  - **Category Badge/Feed Subheaders/Card Titles**: `text-[12px]` to `text-[11px]`.
  - **Summary/Feed Paragraph/Body Copy**: `text-[10px]` to `text-[9px]` (slate-600 line-relaxed).
  - **Metadata, Timestamps, Likes Counter**: `text-[8px]` to `text-[9px]` (font-mono, tracking-wide).

### C. Spacing & Margins Metrics
- **Header Padding**: Every single view possessing a header uses precisely `h-[52px] px-5` layout margins (strictly synchronized).
- **Inner View Padding**: Body bounds utilize `px-5 pb-16` or `px-5 py-4` for clear layout density.
- **Divider Separation Line**: Standard bounds are styled using subtle `#e5e7eb` or `slate-100` dividing elements (use `border-slate-100` or `border-t`).

### D. Geometry, Borders, and Radii
- **Primary Border Radius**: Soft geometry of `rounded-xl` for large banners, slider elements, and cards.
- **Secondary Border Radius**: `rounded-md` or `rounded-lg` for interior components, buttons, and badges.

### E. Colors & Themes
- **Foreground / Canvas Canvas**: Clean off-white canvas with dark slate text.
- **Main Accent Elements**: Slate selection (`bg-slate-900`/`text-white` or dark borders).
- **Vibrant Badge Pill Accents**: Saturated background values paired with legible white labels representing matching categorical contents.

---

## 2. Global Components & Persistent Controls

### A. Top App Header & Utility Bar
- **Padding Metric**: `pt-3 pb-2 px-5` (Strictly persistent).
- **Real-Time Visitor/DateTime Badge**:
  - Element ID: `visitor-clock`.
  - Display Rules: Pull timezone from `Intl.DateTimeFormat().resolvedOptions().timeZone` with a 24-hr clock format (`HH:mm:ss` or `HH:mm`) updating dynamically on intervals.
  - Displays synchronous active viewer numbers and local timezone indicators.

### B. Bottom Navigation Control Bar
- **Dimensions**: Precise fixed height size of `h-[52px]`.
- **Labels Text**: `text-[8px]` text-center font-bold tracking-tight.
- **Icons**: Standardized `w-4 h-4` Lucide SVG vector glyphs.
- **Tones**: Gray inactive selectors, dark slate (`text-slate-950`) active highlights.
- **Sub-pages Handling**: When on sub-pages (individual stories, author portfolios, edit profile screens), the Bottom Navigation Bar is automatically HIDDEN.
- **Primary Pages**: Home, Categories (Drawer Trigger), Notifications, and User Profile.

### C. Interactive Popups & Micro Toast System
- **No Native Modals**: `window.alert`, `window.prompt`, and standard browser alert frames are strictly forbidden. All feedback loops must use in-frame responsive overlays.
- **Toast Standard**: Styled via `sonner` or lightweight custom component to project top-centered warnings.
  - Setup: `toastOptions={{ className: '!py-1.5 !px-2.5 font-bold !text-[9px] text-center rounded-full shadow-md border' }}`.
  - All textual messages centered.

---

## 3. Screen-by-Screen Specifications & Pages Directory

### A. Home Core View (`app/page.tsx`)
- **Main Header Block**: Dynamic timezone clock on left, centered "YONDAIME" display typography, right search trigger.
- **Horizontal Scrolling Categories Slide**: Custom inline tray (`overflow-x-auto scrollbar-none`) exhibiting pill elements representing dynamic database taxonomy lists.
- **Hero Slider**: Highly visual slideshow representing primary trending articles.
  - Aspect Ratio restriction: `aspect-[16/9]` with centered responsive frame, `rounded-xl`, and seamless transition slides (`motion`).
- **Standard Post Feed Grid**:
  - Aspect Ratio: `aspect-[4/3]` or `aspect-[3/2]` thumbnails.
  - Standard Item Contents: Left block showing text details (category tag, story title, short excerpt, metadata with comments/likes tally). Right block displaying image metadata thumbnail.
- **Global Advertisement Container**: Standard styled frame displaying Google Adsense code blocks or fallback standard promo banners.

### B. Story Detail View (`app/article/[id]/page.tsx`)
- **Top Header**: Centered ChevronLeft glyph for immediate back redirect routing. Centered article title segment.
- **Primary Image Banner**: Strict `aspect-[16/9]` with matching padding margins (`px-5`) and `rounded-xl` borders to fully replicate home styling.
- **Author Identity Header Block**:
  - Displays details including full author avatars, name, verified tags (if applicable), and active follower tally.
  - Inline user action trigger allowing reader to directly "Follow/Unfollow" active writers.
- **Explanatory Body Text Content**: Rendered through custom styled block with rich layout rendering (`prose`), spacing rules, and support for injected in-line imagery structures.
- **Comment Threads / Section**:
  - Dynamically sorted thread exhibiting comments and expandable nested replies.
  - Direct responsive input box with active validation rules.

### C. AMP View (`app/article/[id]/amp/page.tsx`)
- **Zero Dynamic JS**: Strictly complies with AMP frameworks. No client-side React code.
- **CSS Delivery**: Inlined strictly into custom head style limits `<style amp-custom>...</style>`.
- **Semantic Meta Validation**: Integrates highly structured metadata formulas including Google News JSON-LD specifications.
- **Component Proxies**: Traditional HTML components must resolve inside compliant tag definitions (e.g., `<amp-img>`, `<amp-ad>`). This includes support for AMP structural configurations (`width`, `height`, and `layout="responsive"` tags).

### D. Category Landing & Archives (`app/category/[id]/page.tsx`)
- **Drawer Triggers**: Dynamic responsive tray sliding in from screen bottom to let users switch content groupings swiftly.
- **Fallback SVG Icons**: If an category item is saved without a visual assets emblem, the system executes dynamic Lucide resolutions contextualizing the item's naming patterns:
  - Developer/Code => `FileCode`
  - AI/Technology => `Sparkles` / `Cpu`
  - Sports/Football => `Trophy`
  - Entertainment => `Film`, etc.

### E. User Profile Hub (`app/profile/*`)
- **Portfolio Settings Modification**: Complete user form permitting modifications to avatars, banners, display portfolios, bios, and privacy keys (`saved_privacy`).
- **Dynamic Readers Section Tabs**:
  - **Upgrades Container**: Premium micro paywall styling with clean tiers card overlays.
  - **Collections Directory**: Categorized private or shared lists exhibiting specific article groupings saved by individuals.
  - **Saves & Liked Records**: Simple list views allowing users to access histories of liked and flagged contents.

---

## 4. Search Engine Optimization (SEO) & Indexing Specs

### A. Dynamic Sitemap Generator (`app/sitemap.ts`)
Creates dynamic, standard-compliant XML mapping. Automatically resolves primary routes alongside live PostgreSQL dataset routes:
```typescript
import { getDbArticles } from "@/lib/api";

export default async function sitemap() {
  const articles = await getDbArticles();
  const dynamicUrls = articles.map(a => ({
    url: `https://yondaime.my.id/article/${a.id}`,
    lastModified: new Date(Number(a.updatedAt || a.createdAt)),
  }));

  const routes = ["", "/categories", "/explore", "/popular"].map(route => ({
    url: `https://yondaime.my.id${route}`,
    lastModified: new Date(),
  }));

  return [...routes, ...dynamicUrls];
}
```

### B. Robots.txt Configuration (`app/robots.ts`)
Explicit crawler handling definitions pointing to the XML map index:
```typescript
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/writer/", "/api/"],
    },
    sitemap: "https://yondaime.my.id/sitemap.xml",
  };
}
```

### C. Monetization Configuration File Ads.txt (`app/ads.txt/route.ts`)
Resolves Adsense publisher validations directly from custom system configurations stored inside the PostgreSQL DB:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/api";

export async function GET(req: NextRequest) {
  const settings = await getSystemSettings();
  const body = settings?.adsTxt || "google.com, pub-xxxxxxxxxxxxxxxx, DIRECT, f08c47fec0942fa0";
  return new NextResponse(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

---

## 5. System Database Schema Blueprint (Drizzle ORM Dialect)

The database configuration strictly represents Yondaime's active data boundaries without table alterations unless passed with `reset=true`:

```typescript
import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

// 1. Writer Directories Schema
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar").notNull(),
  role: text("role").notNull(),
  bio: text("bio").notNull(),
  banner: text("banner").notNull(),
  verified: boolean("verified").default(false).notNull(),
  hasBlueBadge: boolean("has_blue_badge").default(false).notNull(),
  portfolioName: text("portfolio_name"),
  portfolioUrl: text("portfolio_url"),
  socialLink: text("social_link"),
});

// 2. Stories Repository Schema
export const articles = pgTable("articles", {
  id: text("id").primaryKey(), // Using yon-{random-9-str} slug format
  title: text("title").notNull(),
  category: text("category").notNull(),
  authorId: integer("author_id").references(() => authors.id).notNull(),
  date: text("date").notNull(),
  readTime: text("read_time").notNull(),
  views: text("views").default("0").notNull(),
  img: text("img").notNull(),
  content: text("content").array().notNull(), // PostgreSQL array storage matching sqlite JSON backup formats
  createdAt: text("created_at").notNull(),
  status: text("status").default("draft").notNull(), // Approved, Draft, Pending, Rejected
  likes: integer("likes").default(0).notNull(),
  tags: text("tags").notNull(),
});

// 3. User Accounts Schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  avatar: text("avatar").notNull(),
  role: text("role").default("user").notNull(),
  bio: text("bio"),
  banner: text("banner"),
  portfolioName: text("portfolio_name"),
  portfolioUrl: text("portfolio_url"),
  socialLink: text("social_link"),
  savedPrivacy: text("saved_privacy").default("private").notNull(), // Public vs Private
  createdAt: text("created_at").notNull(),
});

// 4. Activity Logs & Settings
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: text("article_id").references(() => articles.id).notNull(),
  authorName: text("author_name").notNull(),
  authorAvatar: text("author_avatar").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
});

export const bookmarks = pgTable("bookmarks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  articleId: text("article_id").references(() => articles.id).notNull(),
});
```

---

## 6. Cloudflare Deployment Config Setup

- **Local Runner Configuration**: Turbopack enabled during active dev builds.
- **Production Builder Rules**: Turbopack disabled strictly when compiling to Cloudflare Pages distribution limits.
- **API Worker Sync Endpoint**: Integrates client-side state synchronizations through endpoint mappings on Worker `dev13579.yondaime.my.id`.
- **Cloudinary CDN Image Deliverables**: Assets are stored and retrieved from bucket instances using Cloud Name: `dr070zmrm` with authorization signatures preserved strictly on server environment states.
