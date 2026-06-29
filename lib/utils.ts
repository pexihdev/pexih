import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function getTagColorFromName(name: string): string {
  if (!name) return "bg-gray-500";
  const slug = slugify(name);
  const colClasses = ["bg-orange-600", "bg-slate-800", "bg-purple-600", "bg-indigo-600", "bg-emerald-600", "bg-green-600", "bg-orange-500", "bg-amber-600", "bg-red-500", "bg-pink-500"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colClasses[Math.abs(hash) % colClasses.length];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const categoryColorMap: Record<string, string> = {
  developer: "bg-orange-600",
  ai: "bg-purple-600",
  "ai, technology": "bg-purple-600",
  technology: "bg-emerald-600",
  football: "bg-green-600",
  viral: "bg-orange-500",
  business: "bg-amber-600",
  gaming: "bg-red-500",
  entertainment: "bg-pink-500",
};

export function getTagColor(categoryOrTag: string): string {
  if (!categoryOrTag) return "bg-orange-600";
  const key = categoryOrTag.toLowerCase().trim();
  if (categoryColorMap[key]) {
    return categoryColorMap[key];
  }
  return getTagColorFromName(categoryOrTag);
}

export function getDisplayTag(article: any): string {
  if (!article) return "Featured";
  const cat = (article.category || article.cat || "").toLowerCase();
  const tags = getArticleTags(article);
  const displayTag = tags.find(t => t.toLowerCase() !== cat);
  return displayTag || tags[0] || article.category || article.cat || "Featured";
}

export function getArticleTags(article: any): string[] {
  if (!article) return [];
  if (article.tags) {
    if (Array.isArray(article.tags)) {
      return article.tags.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof article.tags === "string") {
      return article.tags.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
  }
  
  const tags: string[] = [];
  const title = (article.title || "").toLowerCase();
  
  // Dynamic SEO from title
  if (title) {
    const commonWords = ["the", "and", "or", "in", "of", "to", "a", "is", "for", "on", "with", "as", "by", "at", "about", "what", "how", "why", "are", "you", "that", "this"];
    const generatedTags = title.split(/\s+/).filter((w: string) => w.length > 3 && !commonWords.includes(w)).slice(0, 2).map((w: string) => w.replace(/[^a-zA-Z0-9-]/g, ''));
    if (generatedTags.length > 0) {
      return generatedTags.map((w: string) => w.charAt(0).toUpperCase() + w.slice(1));
    }
  }

  // Soft fallback tags
  if (article.category) {
    tags.push(article.category);
  } else {
    tags.push("Featured");
  }

  return Array.from(new Set(tags));
}

export function getArticleLink(article: any): string {
  if (!article) return "#";
  if (typeof article === 'string' || typeof article === 'number') {
    return `/article/${article}`;
  }
  const strId = String(article.slug || article.id);
  return `/article/${strId}`;
}

export function formatAbsoluteDate(timestampOrDateStr: number | string): string {
  let targetTime: number;
  if (!timestampOrDateStr) {
    targetTime = Date.now();
  } else if (typeof timestampOrDateStr === "string" && timestampOrDateStr.toLowerCase() === "just now") {
    targetTime = Date.now();
  } else if (typeof timestampOrDateStr === "number") {
    targetTime = timestampOrDateStr < 0 ? Date.now() + timestampOrDateStr : timestampOrDateStr;
  } else {
    const num = Number(timestampOrDateStr);
    if (!isNaN(num)) {
      targetTime = num < 0 ? Date.now() + num : num;
    } else {
      const parsed = Date.parse(timestampOrDateStr);
      if (isNaN(parsed) && String(timestampOrDateStr).includes("ago")) {
        const s = String(timestampOrDateStr).toLowerCase();
        const numAgo = parseInt(s.replace(/[^0-9]/g, '')) || 1;
        let diff = 0;
        if (s.includes("min")) diff = numAgo * 60 * 1000;
        else if (s.includes("hour")) diff = numAgo * 60 * 60 * 1000;
        else if (s.includes("day")) diff = numAgo * 24 * 60 * 60 * 1000;
        else if (s.includes("week")) diff = numAgo * 7 * 24 * 60 * 60 * 1000;
        else if (s.includes("month")) diff = numAgo * 30 * 24 * 60 * 60 * 1000;
        else if (s.includes("year")) diff = numAgo * 365 * 24 * 60 * 60 * 1000;
        targetTime = Date.now() - diff;
      } else if (!isNaN(parsed)) {
        targetTime = parsed;
      } else {
        targetTime = Date.now();
      }
    }
  }

  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(targetTime));
  } catch {
    return "Jun 8, 2026";
  }
}

export function formatTimeAgo(timestampOrDateStr: number | string): string {
  return formatAbsoluteDate(timestampOrDateStr);
}

export function optimizeCloudinaryUrl(
  url: string,
  options: { width?: number; height?: number; crop?: string; quality?: string | number; seoName?: string } = {}
): string {
  if (!url || typeof url !== "string") return url || "";
  
  const cleanUrl = url.trim();
  if (cleanUrl.startsWith("<") || cleanUrl.includes("<iframe") || cleanUrl.includes("<script") || cleanUrl.includes("<div")) return cleanUrl;
  if (!cleanUrl.includes("res.cloudinary.com")) return cleanUrl;

  // Set default width to 400 for aggressive mobile optimization if not explicitly bypassed
  const width = options.width !== undefined ? options.width : 400;

  try {
    const parts = cleanUrl.split("/");
    const uploadIndex = parts.findIndex(p => p === "upload" || p === "fetch" || p === "authenticated" || p === "private_delivery");
    
    if (uploadIndex === -1) return cleanUrl;
    
    const nextPart = parts[uploadIndex + 1];
    
    let widthStr = width > 0 ? `w_${width}` : '';
    let heightStr = options.height ? `h_${options.height}` : '';
    let cropStr = (width > 0 || options.height) ? `c_${options.crop || 'fill'}` : '';
    let qualityStr = `q_${options.quality || 'auto'}`;
    let formatStr = `f_auto`;
    let gravityStr = (width > 0 || options.height) ? `g_auto` : '';
    
    const newTransforms = [cropStr, gravityStr, widthStr, heightStr, qualityStr, formatStr].filter(Boolean).join(",");

    const isTransformation = nextPart && (
      nextPart.includes(",") ||
      nextPart.includes("=") ||
      /^(w|h|c|q|f|g|co|e|l|u|fl|pg|r|y|x)_/.test(nextPart)
    );

    if (isTransformation) {
      let existing = nextPart.split(",");
      
      if (width > 0) existing = existing.filter(p => !p.startsWith("w_") && !p.startsWith("c_") && !p.startsWith("g_"));
      if (options.height) existing = existing.filter(p => !p.startsWith("h_") && !p.startsWith("c_") && !p.startsWith("g_"));
      
      existing = existing.filter(p => !p.startsWith("q_") && !p.startsWith("f_"));
      
      const merged = [...existing, cropStr, gravityStr, widthStr, heightStr, qualityStr, formatStr].filter(Boolean).join(",");
      parts[uploadIndex + 1] = merged;
    } else {
      parts.splice(uploadIndex + 1, 0, newTransforms);
    }
    
    if (options.seoName && parts[uploadIndex] === "upload") {
      const resourceType = parts[uploadIndex - 1];
      if (resourceType === 'image') {
        parts[uploadIndex - 1] = 'images';
      } else if (resourceType === 'video') {
        parts[uploadIndex - 1] = 'videos';
      } else if (resourceType === 'raw') {
        parts[uploadIndex - 1] = 'files';
      }
      
      if (['image', 'video', 'raw'].includes(resourceType)) {
        parts.splice(uploadIndex, 1);
        
        const lastPart = parts[parts.length - 1];
        const dotIndex = lastPart.lastIndexOf('.');
        const slug = options.seoName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'media';
        
        if (dotIndex !== -1) {
          const ext = lastPart.substring(dotIndex);
          const name = lastPart.substring(0, dotIndex);
          parts[parts.length - 1] = `${name}/${slug}${ext}`;
        } else {
          parts[parts.length - 1] = `${lastPart}/${slug}.jpg`;
        }
      }
    }

    return parts.join("/");
  } catch (err) {
    console.error("Error optimizing Cloudinary URL:", err);
    return cleanUrl;
  }
}

export function getSafeImage(imgValue: any, fallbackSeed: string): string {
  if (!imgValue || typeof imgValue !== "string" || imgValue.trim() === "") {
    return `https://picsum.photos/seed/${encodeURIComponent(fallbackSeed || "yondaime")}/800/450`;
  }
  let clean = imgValue.trim();
  if (clean.startsWith("<") || clean.includes("<iframe") || clean.includes("<script") || clean.includes("<div")) {
    return clean;
  }
  if (clean.startsWith("//")) {
    return "https:" + clean;
  }
  if (/^unsplash[:/]/i.test(clean)) {
    const photoId = clean.replace(/^unsplash[:/]/i, "");
    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=1200&q=80`;
  }
  if (clean.toLowerCase().startsWith("http://") || clean.toLowerCase().startsWith("https://")) {
    // If it is unsplash image, ensure high resolution parameters
    if (clean.includes("unsplash.com") && !clean.includes("?")) {
      return `${clean}?auto=format&fit=crop&w=1200&q=80`;
    }
    return clean;
  }
  // Check if it is a potentially valid Unsplash ID
  if (clean.length > 5 && !clean.includes(" ") && !clean.includes(".") && !clean.includes("/")) {
    return `https://images.unsplash.com/photo-${clean}?auto=format&fit=crop&w=1200&q=80`;
  }
  return `https://picsum.photos/seed/${encodeURIComponent(clean || fallbackSeed || "yondaime")}/800/450`;
}

export function getArticleTimestamp(art: any): number {
  if (!art) return 0;
  let ts = 0;
  const effectNow = Date.now();
  
  if (art.createdAt) {
    const parsed = Number(art.createdAt);
    if (!isNaN(parsed)) ts = parsed;
    else {
      const parsedDate = Date.parse(String(art.createdAt));
      if (!isNaN(parsedDate)) ts = parsedDate;
    }
  }
  
  if (ts === 0) {
    const dateVal = art.date || "";
    if (typeof dateVal === "number") {
      ts = dateVal;
    } else if (dateVal) {
      if (dateVal.toLowerCase() === "just now") {
        ts = effectNow;
      } else {
        const parsed = Date.parse(dateVal);
        if (!isNaN(parsed)) {
          ts = parsed;
        } else if (dateVal.toLowerCase().includes("ago")) {
          const s = dateVal.toLowerCase();
          const num = parseInt(s.replace(/[^0-9]/g, '')) || 1;
          let diff = 0;
          if (s.includes("min")) diff = num * 60 * 1000;
          else if (s.includes("hour")) diff = num * 60 * 60 * 1000;
          else if (s.includes("day")) diff = num * 24 * 60 * 60 * 1000;
          else if (s.includes("week")) diff = num * 7 * 24 * 60 * 60 * 1000;
          else if (s.includes("month")) diff = num * 30 * 24 * 60 * 60 * 1000;
          else if (s.includes("year")) diff = num * 365 * 24 * 60 * 60 * 1000;
          ts = effectNow - diff;
        }
      }
    }
  }
  
  return ts;
}

export function generateArticleId(existingIds: string[] = []): string {
  let length = 9;
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let attempts = 0;
  
  while (true) {
    let id = 'yon-';
    for (let i = 0; i < length; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!existingIds.includes(id)) {
        return id;
    }
    attempts++;
    if (attempts > 100) {
        length++;
        attempts = 0;
    }
  }
}

export function slugifyAuthor(name: string): string {
  if (!name) return "author";
  return name.trim().replace(/\s+/g, '-');
}

export function formatViews(val: any): string {
  const num = parseInt(String(val || "0").replace(/[^0-9]/g, "")) || 0;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "m";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  }
  return String(num || "0");
}

