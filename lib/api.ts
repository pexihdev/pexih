import { Article, Category } from "./articlesData";
import { getTagColorFromName, slugify, getArticleTags, generateArticleId } from "./utils";

// Look for a configured backend url or default to a proxy via Next.js
let API_BASE = "https://pexih-backend.vercel.app";
try {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.PUBLIC_BACKEND_URL) {
    API_BASE = (import.meta as any).env.PUBLIC_BACKEND_URL;
  } else if (typeof process !== 'undefined' && process.env.PUBLIC_BACKEND_URL) {
    API_BASE = process.env.PUBLIC_BACKEND_URL;
  }
} catch (e) {
  // ignore
}

export interface Author {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bio?: string;
  has_blue_badge?: boolean | number;
  verified?: boolean;
  followersCount?: number;
  hasBlueBadge?: boolean;
  portfolio_name?: string;
  portfolio_url?: string;
  portfolioName?: string;
  portfolioUrl?: string;
  banner?: string;
  social_link?: string;
  socialLink?: string;
  expertise?: string;
  member_since?: string;
  memberSince?: string;
  saved_privacy?: string;
  savedPrivacy?: string;
}

class ApiService {
  private isBrowser() {
    return typeof window !== "undefined";
  }

  private safeGetItem(key: string): string | null {
    if (!this.isBrowser()) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`localStorage getItem('${key}') was blocked or failed:`, e);
      return null;
    }
  }

  private safeSetItem(key: string, value: string): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`localStorage setItem('${key}') was blocked or failed:`, e);
    }
  }

  // Initialize DB tables on live Cloudflare if accessed
  async initDb() {
    try {
      const res = await fetch(`${API_BASE}/api/seed`, { method: 'POST' });
      return await res.json();
    } catch (e) {
      console.warn("Backend not reachable, executing via mock fallback mode", e);
      return { success: false, fallback: true };
    }
  }

  async getTags(): Promise<{ name: string; value: string; col: string; slug: string }[]> {
    try {
      const articles = await this.getArticles();
      const tagsSet = new Set<string>();
      const tagList: { name: string; value: string; col: string; slug: string }[] = [];
      
      // Add tags dynamically extracted from approved articles
      articles.forEach(a => {
        const articleTags = getArticleTags(a);
        articleTags.forEach(raw => {
          if (raw) {
            const slug = slugify(raw);
            if (!tagsSet.has(slug)) {
              tagsSet.add(slug);
              tagList.push({
                name: raw,
                value: raw,
                slug,
                col: getTagColorFromName(raw)
              });
            }
          }
        });
      });
      return tagList;
    } catch (e) {
      return [];
    }
  }

  // --- ARTICLES ---
  async getArticles(includePending: boolean = false): Promise<Article[]> {
    let articles: Article[] | null = null;
    try {
      let role = "Reader";
      let email = "";
      try {
        const localUser = this.safeGetItem("yondaime_user");
        if (localUser) {
          const parsed = JSON.parse(localUser);
          role = parsed.role || "Reader";
          email = parsed.email || "";
        }
      } catch (e) {}

      const res = await fetch(`${API_BASE}/api/articles?role=${encodeURIComponent(role)}&email=${encodeURIComponent(email)}`, {
        headers: {
          "X-User-Role": role,
          "X-User-Email": email
        },
        cache: "no-store"
      });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && Array.isArray(data)) {
          this.safeSetItem("yondaime_articles", JSON.stringify(data));
          articles = data;
        }
      }
    } catch (e) {
      console.warn("Backend articles unreachable, checking fallback or offline cache", e);
    }

    if (articles === null) {
      const local = this.safeGetItem("yondaime_articles");
      if (local) {
        try {
          articles = JSON.parse(local);
        } catch (e) {}
      }
    }

    if (articles === null) {
      articles = [];
    }

    if (!includePending) {
      return articles.filter(a => a.status !== "pending");
    }
    return articles;
  }

  async getArticleById(id: string): Promise<Article | null> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}`, { cache: "no-store" });
      if (res.ok) {
        const art = await res.json();
        if (art && !art.error) {
          return art;
        }
      }
    } catch (e) {
      console.warn("Backend single article unreachable, checking client list:", e);
    }
    const list = await this.getArticles(true);
    return list.find(a => String(a.id) === String(id) || String(a.slug) === String(id)) || null;
  }

  async saveArticle(article: Partial<Article>): Promise<boolean> {
    const list = await this.getArticles(true);
    if (article.id) {
      // Edit
      const idx = list.findIndex(a => String(a.id) === String(article.id));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...article } as Article;
      }
      
      try {
        await fetch(`${API_BASE}/api/articles/${article.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(article)
        });
      } catch(e){}
    } else {
      // Add new
      const newId = generateArticleId(list.map(a => String(a.id)));
      const newArt: Article & { publishedAt?: number } = {
        id: newId,
        title: article.title || "Untitled Article",
        category: article.category || "Developer",
        author: article.author || { name: "Kenji Sato", role: "Principal Engineer", avatar: "yondaime-auth1" },
        date: "Just now",
        views: article.views || "0",
        img: article.img || "dev-type",
        content: article.content || ["Empty article body."],
        status: article.status || "pending",
        publishedAt: (article as any).publishedAt || Date.now(),
        tags: article.tags || ""
      } as any;
      list.unshift(newArt);

      try {
        const response = await fetch(`${API_BASE}/api/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: newArt.id,
            title: newArt.title,
            category: newArt.category,
            content: newArt.content,
            img: newArt.img,
            views: newArt.views,
            authorId: (article as any).authorId || 1,
            author: newArt.author,
            status: newArt.status,
            tags: article.tags || ""
          })
        });
        if (response.ok) {
          const resData = await response.json() as any;
          if (resData && resData.success && resData.result && resData.result.id) {
            newArt.id = String(resData.result.id);
            if (resData.result.likes !== undefined) {
              newArt.likes = resData.result.likes;
            }
          }
        }
      } catch (e){}
    }

    this.safeSetItem("yondaime_articles", JSON.stringify(list));
    return true;
  }

  async deleteArticle(id: string): Promise<boolean> {
    const list = await this.getArticles(true);
    const filtered = list.filter(a => String(a.id) !== String(id));
    this.safeSetItem("yondaime_articles", JSON.stringify(filtered));

    try {
      await fetch(`${API_BASE}/api/articles/${id}`, { method: 'DELETE' });
    } catch(e){}

    return true;
  }

  async trackArticleView(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}/track-view`, {
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to track view on backend DO:", e);
    }
    return null;
  }

  async getArticleLiveViews(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${id}/live-views`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to catch live views from DO:", e);
    }
    return null;
  }


  // --- CATEGORIES ---
  async getCategories(): Promise<Category[]> {
    try {
      const res = await fetch(`${API_BASE}/api/categories`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && Array.isArray(data)) {
          const formatted = data.map((d: any) => ({
            title: d.title,
            count: String(d.count),
            color: d.color,
            iconName: d.icon_name || d.iconName,
            desc: d.desc,
            logo: d.logo
          }));
          this.safeSetItem("yondaime_categories", JSON.stringify(formatted));
          return formatted;
        }
      }
    } catch (e) {
      console.warn("Backend categories unreachable, checking fallback or offline cache", e);
    }

    const local = this.safeGetItem("yondaime_categories");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }

    return [];
  }

  async getSiteSettings(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/site-settings`);
      return await res.json();
    } catch (e) {
      console.warn("Failed to fetch site settings, using defaults");
      return null;
    }
  }

  async saveSiteSettings(settings: any): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/site-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      return res.ok;
    } catch(e) {
      return false;
    }
  }

  async saveCategory(cat: Category): Promise<boolean> {
    const list = await this.getCategories();
    const idx = list.findIndex(c => c.title === cat.title);
    if (idx !== -1) {
      list[idx] = cat;
    } else {
      list.push(cat);
    }

    this.safeSetItem("yondaime_categories", JSON.stringify(list));

    try {
      await fetch(`${API_BASE}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cat.title,
          count: cat.count,
          color: cat.color,
          iconName: cat.iconName,
          desc: cat.desc,
          logo: cat.logo
        })
      });
    } catch(e){}

    return true;
  }

  async deleteCategory(title: string): Promise<boolean> {
    const list = await this.getCategories();
    const filtered = list.filter(c => c.title !== title);
    this.safeSetItem("yondaime_categories", JSON.stringify(filtered));
    return true;
  }


  // --- AUTHORS / USERS ---
  async getAuthors(): Promise<Author[]> {
    const defaultAuthors: Author[] = [
      { id: "999", name: "Admin", email: "admin@yondaime.news", avatar: "yondaime-avatar", role: "Admin", bio: "System Administrator and Lead Creator", portfolioName: "Yondaime", portfolioUrl: "https://yondaime.news" },
      { id: "1", name: "Kenji Sato", email: "kenji@yondaime.news", avatar: "yondaime-auth1", role: "Principal Engineer" },
      { id: "2", name: "Emma Wilson", email: "emma@yondaime.news", avatar: "face-new", role: "Software Architect" },
      { id: "3", name: "John Doe", email: "john@yondaime.news", avatar: "face-3", role: "Cognitive Engineer" },
      { id: "4", name: "Alex Rose", email: "alex@yondaime.news", avatar: "yondaime-auth2", role: "Systems Engineer" },
      { id: "5", name: "Mike Chen", email: "mike@yondaime.news", avatar: "face-new", role: "Tactical Analyst" },
    ];

    try {
      const res = await fetch(`${API_BASE}/api/authors`);
      if (res.ok) {
        const data = (await res.json()) as any[];
        if (data && Array.isArray(data)) {
          this.safeSetItem("yondaime_authors", JSON.stringify(data));
          return data;
        }
      }
    } catch(e){
      console.warn("Backend authors unreachable, checking fallback or offline cache", e);
    }

    const local = this.safeGetItem("yondaime_authors");
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }

    this.safeSetItem("yondaime_authors", JSON.stringify(defaultAuthors));
    return defaultAuthors;
  }

  async getAuthor(id: string): Promise<Author | null> {
    const list = await this.getAuthors();
    return list.find(a => String(a.id) === String(id)) || null;
  }

  async saveAuthor(author: Author): Promise<boolean> {
    const list = await this.getAuthors();
    const idx = list.findIndex(a => String(a.id) === String(author.id));
    if (idx !== -1) {
      list[idx] = author;
    } else {
      list.push(author);
    }

    this.safeSetItem("yondaime_authors", JSON.stringify(list));

    try {
      await fetch(`${API_BASE}/api/authors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(author)
      });
    } catch (e){}

    return true;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const list = await this.getAuthors();
    const filtered = list.filter(a => String(a.id) !== String(id));
    this.safeSetItem("yondaime_authors", JSON.stringify(filtered));

    try {
      const res = await fetch(`${API_BASE}/api/authors/${id}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errData = await res.json() as any;
        throw new Error(errData.error || "Failed to delete author from backend.");
      }
    } catch (e: any) {
      console.warn("Error running backend deleteAuthor:", e);
      throw e;
    }
    return true;
  }

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown upload error" })) as any;
      throw new Error(err.error || `Upload failed with status ${res.status}`);
    }

    const data = await res.json() as any;
    return data.url;
  }

  async register(name: string, email: string, password: string):Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        return data;
      }
      return { success: false, error: data.error || "Registration failed" };
    } catch (e: any) {
      console.warn("Failed registration:", e);
      return { success: false, error: "Network error" };
    }
  }

  async login(email: string, password: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        return data;
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (e: any) {
      console.warn("Failed login:", e);
      return { success: false, error: "Network error" };
    }
  }

  async adminLogin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = (await res.json()) as any;
      if (res.ok && data.success) {
        return data;
      }
      return { success: false, error: data.error || "Login failed" };
    } catch (e) {
      // Offline fallback using secure Web Cryptography hashing
      try {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode((password || "") + "yondaime_secure_salt_2026");
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        // Expected Hash for "Aqua123@": "47d097eec22a1d8a170ba020d422f408b0a7f9e8af951f3f5108e6bf856f2d22"
        const isValidOfflinePassword = hashHex === "47d097eec22a1d8a170ba020d422f408b0a7f9e8af951f3f5108e6bf856f2d22";

        if (username === "jennaira" && isValidOfflinePassword) {
          return { success: true, token: "yondaime-admin-token-13579" };
        }
      } catch (err) {}
      return { success: false, error: "Network error or invalid administrator credentials." };
    }
  }

  async getAdminHealth(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/health`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to get admin health:", e);
    }
    return { success: false, offline: true };
  }

  async clearKvCache(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/cache/clear`, {
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to clear cache:", e);
    }
    return { success: false, error: "Network error trying to clear KV cache." };
  }

  async getDbStats(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/db-stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to get DB stats:", e);
    }
    return { success: false, error: "Network error trying to fetch Database statistics." };
  }

  async getSecurityLogs(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/security-logs`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to load security logs:", e);
    }
    return [];
  }

  async clearSecurityLogs(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/security-logs/clear`, {
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to clear security logs:", e);
    }
    return { success: false, error: "Network error attempting to clear security logs." };
  }

  async getSchedulerReport(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/scheduler/report`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to load scheduler report:", e);
    }
    return { success: false, error: "Network error trying to fetch background scheduler report." };
  }

  async runSchedulerSync(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/scheduler/run`, {
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to trigger scheduler manual run:", e);
    }
    return { success: false, error: "Network error trying to manual trigger background scheduler sync." };
  }

  async getCloudinarySignature(folder: string = "articles", params?: Record<string, any>): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/upload-signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folder, params })
      });
      if (res.ok) {
        return await res.json();
      }
      const data: any = await res.json().catch(() => ({}));
      return { success: false, error: data?.error || "Failed to generate Cloudinary signature on server." };
    } catch (e) {
      console.warn("Failed to get Cloudinary signature:", e);
    }
    return { success: false, error: "Network error trying to fetch Cloudinary pre-signed payload." };
  }

  async uploadToCloudinaryDirect(file: File, sigData?: { signature?: string; timestamp?: number; apiKey?: string; cloudName?: string; folder?: string }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (sigData?.folder) {
        formData.append("folder", sigData.folder);
      } else {
        formData.append("folder", "yondaime");
      }

      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data: any = await res.json();
        if (data && (data.success || data.url)) {
          return { success: true, url: data.url, public_id: data.public_id };
        }
        return { success: false, error: data?.error || "Backend upload failed to return url" };
      } else {
        const errData: any = await res.json().catch(() => ({}));
        return { success: false, error: errData?.error || `Secure backend upload failed with status ${res.status}` };
      }
    } catch (e: any) {
      return { success: false, error: `Backend upload failed: ${e.message}` };
    }
  }

  getLiveReadersWebSocketUrl(articleId: string): string {
    const wsBase = API_BASE.replace(/^http/, "ws");
    return `${wsBase}/api/articles/${articleId}/live-readers/ws`;
  }

  getArticlesStreamUrl(): string {
    return `${API_BASE}/api/articles/stream`;
  }

  async getSearchIndex(): Promise<Record<string, string[]>> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/search-index`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed fetching edge search index:", e);
    }
    return {};
  }

  async searchGlobal(query: string) {
    if (!query) return { success: true, articles: [], authors: [] };
    const res = await fetch(`${API_BASE}/api/articles/search/query?q=${encodeURIComponent(query)}`);
    return await res.json();
  }

  async autoFixImage(id: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/scheduler/auto-fix-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      return await res.json();
    } catch (e: any) {
      console.warn("Error calling image auto fix API:", e);
      return { success: false, error: e.message || "Failed to trigger image auto-fix." };
    }
  }

  async getSliderArticles(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/slider?t=${Date.now()}`, {
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && data.articles) {
          return data.articles;
        }
      }
    } catch (e) {
      console.warn("Failed fetching slider articles:", e);
    }
    const list = await this.getArticles();
    return list.slice(0, 3);
  }

  async updateSliderConfig(ids: string[]): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/slider`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      return await res.json();
    } catch (e: any) {
      console.warn("Failed updating slider config:", e);
      return { success: false, error: e.message || "Failed to transmit slider update to backend API." };
    }
  }

  // --- COMMENTS ENGINES ---
  async getComments(articleId: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/comments`);
      if (res.ok) {
        const list = (await res.json()) as any[];
        this.safeSetItem(`yondaime_comments_${articleId}`, JSON.stringify(list));
        return list;
      }
    } catch (e) {
      console.warn("Error getting comments from worker:", e);
    }

    const localCache = this.safeGetItem(`yondaime_comments_${articleId}`);
    if (localCache) {
      try {
        return JSON.parse(localCache);
      } catch (e) {}
    }
    return [];
  }

  async addComment(articleId: string, author: string, avatar: string, content: string, parentId?: number | null, role?: string, verified?: boolean): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, avatar, content, parentId, role, verified })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to add comment to backend:", e);
    }
    return null;
  }

  async likeComment(commentId: number, increment: boolean = true): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/comments/${commentId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to toggle like on backend comment:", e);
    }
    return null;
  }

  async likeArticle(articleId: string, increment: boolean = true, username?: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ increment, username })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to toggle like on backend article:", e);
    }
    return null;
  }

  async bookmarkArticle(articleId: string, username: string, bookmark: boolean = true): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/articles/${articleId}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bookmark })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to bookmark article on backend:", e);
    }
    return null;
  }

  async getUserNotifications(username: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/user/notifications?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json() as any;
        return data.success ? data.notifications : [];
      }
    } catch (e) {
      console.warn("Failed fetching notifications:", e);
    }
    return [];
  }

  async readAllNotifications(username: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/user/notifications/read-all`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async readNotification(id: number | string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/user/notifications/${id}/read`, {
        method: "POST"
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async getUserBookmarks(username: string): Promise<Article[]> {
    try {
      const res = await fetch(`${API_BASE}/api/user/bookmarks?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = (await res.json()) as Article[];
        return data || [];
      }
    } catch (e) {
      console.warn("Failed to fetch user bookmarks from backend:", e);
    }
    return [];
  }

  async getUserLikedArticles(username: string): Promise<Article[]> {
    try {
      const res = await fetch(`${API_BASE}/api/user/liked?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = (await res.json()) as Article[];
        return data || [];
      }
    } catch (e) {
      console.warn("Failed to fetch user liked articles from backend:", e);
    }
    return [];
  }

  async getUserCollections(username: string): Promise<any[]> {
    try {
      const saved = await this.getUserBookmarks(username);
      const liked = await this.getUserLikedArticles(username);
      
      const cols = [];
      if (saved && saved.length > 0) {
        cols.push({
          id: "saved", 
          name: "Saved Stories", 
          count: saved.length, 
          icon: "Bookmark", 
          color: "blue",
          desc: "Articles you have saved to read later.",
          category: saved[0]?.category || "General",
          images: saved.slice(0, 4).map(a => a.img || ""),
          articles: saved
        });
      }
      if (liked && liked.length > 0) {
        cols.push({
          id: "liked", 
          name: "Liked Articles", 
          count: liked.length, 
          icon: "Heart", 
          color: "red",
          desc: "Articles you have liked and found insightful.",
          category: liked[0]?.category || "General",
          images: liked.slice(0, 4).map(a => a.img || ""),
          articles: liked
        });
      }

      if (cols.length === 0) {
        return [
          { id: "saved", name: "Saved Stories", count: 0, icon: "Bookmark", color: "blue", desc: "Articles you have saved", category: "General", images: [], articles: [] }
        ];
      }
      
      return cols;
    } catch(e) {
      return [
        { id: "saved", name: "Saved Stories", count: 0, icon: "Bookmark", color: "blue", desc: "Articles you have saved", category: "General", images: [], articles: [] }
      ];
    }
  }

  async followAuthor(authorId: string, username: string, follow: boolean = true): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/authors/${authorId}/follow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, follow })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to toggle follow status on backend:", e);
    }
    return null;
  }

  async getAuthorFollowStatus(authorId: string, username: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/authors/${authorId}/status-follow?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = (await res.json()) as { following?: boolean };
        return !!data?.following;
      }
    } catch (e) {
      console.warn("Failed to get author follow status from backend:", e);
    }
    return false;
  }

  async upgradeUser(params: {
    username: string;
    name: string;
    email: string;
    avatar?: string;
    gateway?: string;
    amount?: number;
    currency?: string;
    transactionRef?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/user/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to upgrade user on backend:", e);
    }
    return null;
  }

  async getUserStats(username: string, email?: string): Promise<any> {
    try {
      const query = new URLSearchParams({ username });
      if (email) {
        query.append("email", email);
      }
      const res = await fetch(`${API_BASE}/api/user/stats?${query.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch user stats from backend:", e);
    }
    return null;
  }

  async getUserSettings(username: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/user/settings?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to fetch user settings from backend:", e);
    }
    return null;
  }

  async updateUserSettings(payload: {
    username: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    weekly_newsletter?: boolean;
    two_factor_auth?: boolean;
    security_alerts?: boolean;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/user/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed to update user settings on backend:", e);
    }
    return null;
  }

  // --- NEWSLETTER INTEGRATION ---
  async subscribeNewsletter(email: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (e: any) {
      console.warn("Newsletter subscription failed:", e);
      return { success: false, error: e.message || "Failed to subscribe to newsletter." };
    }
  }

  async getNewsletterSubscribers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscribers`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && data.subscribers) {
          return data.subscribers;
        }
      }
    } catch (e) {
      console.warn("Failed retrieving subscribers:", e);
    }
    return [];
  }

  async deleteNewsletterSubscriber(id: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/subscribers/${id}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to remove subscriber." };
    }
  }

  // --- SUPPORT FEEDBACK INTEGRATION ---
  async submitSupportMessage(payload: { name: string; email: string; subject: string; message: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/support/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      console.warn("Error submitting support feedback:", e);
      return { success: false, error: e.message || "Failed to submit feedback." };
    }
  }

  async getSupportMessages(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && data.messages) {
          return data.messages;
        }
      }
    } catch (e) {
      console.warn("Failed retrieving support messages:", e);
    }
    return [];
  }

  async resolveSupportMessage(id: number, status: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update feedback status." };
    }
  }

  async deleteSupportMessage(id: number): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${id}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to delete feedback message." };
    }
  }

  async replySupportMessage(id: number, replyMessage: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/support-messages/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_message: replyMessage })
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to send support reply." };
    }
  }

  async getUserSupportMessages(email: string): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/support/messages?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && data.messages) {
          return data.messages;
        }
      }
    } catch (e) {
      console.warn("Failed retrieving user support messages:", e);
    }
    return [];
  }

  async getPerformanceAnalytics(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/performance`);
      if (res.ok) {
        return await res.json();
      } else {
        console.error("fetch failed with status:", res.status, await res.text());
      }
    } catch (e: any) {
      console.warn("Failed retrieving performance metrics:", e?.message || e);
    }
    return { success: false, error: "Failed to load metrics data." };
  }

  async getAnnouncement(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/announcement`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed retrieving global announcement:", e);
    }
    return { success: false, error: "Failed to load announcement." };
  }

  async saveAnnouncement(payload: { enabled: boolean; text: string; type: string }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/announcement`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update global announcement." };
    }
  }

  // --- GENERAL SETTINGS ---
  async getGeneralSettings(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/settings/general`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed retrieving general settings:", e);
    }
    return {
      success: false,
      settings: { 
        siteName: 'Yondaime', 
        siteMetaDescription: 'Developer Platform', 
        socialInstagram: '', 
        socialTiktok: '', 
        socialX: '' 
      }
    };
  }

  // --- ADVERTISEMENTS CONFIG ---
  async getAdsConfig(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/ads`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed retrieving ads config:", e);
    }
    return {
      success: false,
      adsConfig: {
        enabled: false,
        topBanner: { enabled: true, code: "" },
        midFeed: { enabled: true, code: "" },
        inArticle: { enabled: true, code: "" },
        bottomSticky: { enabled: true, code: "" }
      }
    };
  }

  // --- FLOATING WIDGET CONFIG ---
  async getFloatingWidget(): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/widget`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn("Failed retrieving widget config:", e);
    }
    return {
      success: false,
      widget: { isActive: 0, logoUrl: "https://cdn-icons-png.flaticon.com/512/124/124034.png", linkUrl: "" }
    };
  }

  async saveAdsConfig(payload: {
    enabled: boolean;
    topBanner: { enabled: boolean; code: string };
    midFeed: { enabled: boolean; code: string };
    inArticle: { enabled: boolean; code: string };
    bottomSticky: { enabled: boolean; code: string };
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update advertisement configurations." };
    }
  }
  async updateUserProfile(payload: {
    username: string;
    name?: string;
    email?: string;
    avatar?: string;
    bio?: string;
    portfolioName?: string;
    portfolioUrl?: string;
    banner?: string;
    socialLink?: string;
    expertise?: string;
    memberSince?: string;
    savedPrivacy?: string;
  }): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update user profile in Database." };
    }
  }

  async getUserProfile(username: string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/user/profile?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e: any) {
      console.warn("Failed retrieving user profile from backend:", e);
    }
    return { success: false };
  }

  async getUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success && data.users) {
          return data.users;
        }
      }
    } catch (e) {
      console.warn("Failed retrieving admin users:", e);
    }
    return [];
  }

  async updateUser(id: number, payload: any): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to update user." };
    }
  }

  // --- COMMENTS ADMIN ---
  async getAdminComments(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments`);
      if (res.ok) {
        const data = await res.json() as any;
        return data.success ? data.comments : [];
      }
    } catch (e) {
      console.warn("Failed fetching admin comments:", e);
    }
    return [];
  }

  async deleteComment(id: number | string): Promise<any> {
    try {
      const res = await fetch(`${API_BASE}/api/admin/comments/${id}`, {
        method: "DELETE"
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  // --- CLOUDFLARE CI/CD DEPLOYMENT ---
  async triggerDeployment(target: "pages" | "worker"): Promise<any> {
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  async getDeploymentLogs(target: "pages" | "worker"): Promise<any> {
    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logs", target })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

export const api = new ApiService();
