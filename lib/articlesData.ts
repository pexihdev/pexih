export interface Category {
  title: string;
  count: string;
  color: string;
  iconName: string;
  desc: string;
  logo?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  createdAt?: string | number;
  author: {
    name: string;
    role: string;
    avatar: string;
    verified?: boolean;
  };
  authorName?: string;
  authorRole?: string;
  authorVerified?: boolean;
  date: string;
  readTime: string;
  views: string;
  img: string;
  image?: string;
  content: string[];
  status?: "approved" | "pending" | "rejected";
  publishedAt?: number;
  slug?: string;
  metaDescription?: string;
  externalAuthor?: string;
  tags?: string[];
  likes?: number;
  raw?: any;
}

export interface Tag {
  name: string;
  value: string;
  col: string;
}

export const categoriesData: Category[] = [];
export const articlesData: Article[] = [];
export const popularTags: Tag[] = [];
