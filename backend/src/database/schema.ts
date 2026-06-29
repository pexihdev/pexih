import { pgTable, serial, text, timestamp, integer, jsonb, real, bigint } from 'drizzle-orm/pg-core';

export const articles = pgTable('articles', {
  id: text('id').primaryKey().notNull(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  content: text('content').notNull(),
  authorId: integer('author_id').references(() => users.id),
  author: jsonb('author'),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
  publishedAt: bigint('published_at', { mode: 'number' }),
  img: text('img').notNull(),
  views: text('views').notNull(),
  status: text('status').default('approved').notNull(),
  slug: text('slug').unique(),
  metaDescription: text('meta_description'),
  metaKeywords: text('meta_keywords'),
  externalAuthor: text('external_author'),
  likes: integer('likes').default(0),
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
  expertise: text('expertise').default('Minimalism, Urban Photography, Japanese Culture, UI Design'),
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

export const cache = pgTable('cache', {
  key: text('key').primaryKey().notNull(),
  value: jsonb('value').notNull(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const queueJobs = pgTable('queue_jobs', {
  id: serial('id').primaryKey().notNull(),
  queueName: text('queue_name').default('default').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(3).notNull(),
  lastError: text('last_error'),
  runAt: timestamp('run_at', { mode: 'date' }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const articleLikes = pgTable('article_likes', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').notNull(),
  articleId: text('article_id').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const authorFollowers = pgTable('author_followers', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').notNull(),
  authorId: text('author_id').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const bookmarks = pgTable('bookmarks', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').notNull(),
  articleId: text('article_id').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const comments = pgTable('comments', {
  id: serial('id').primaryKey().notNull(),
  articleId: text('article_id').notNull(),
  author: text('author').notNull(),
  avatar: text('avatar').notNull(),
  content: text('content').notNull(),
  parentId: integer('parent_id'),
  likes: integer('likes').default(0),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const newsletterSubscribers = pgTable('newsletter_subscribers', {
  id: serial('id').primaryKey().notNull(),
  email: text('email').unique().notNull(),
  status: text('status').default('active').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').notNull(),
  sender: text('sender').notNull(),
  type: text('type').notNull(),
  message: text('message').notNull(),
  articleId: text('article_id'),
  isRead: integer('is_read').default(0),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const securityLogs = pgTable('security_logs', {
  id: text('id').primaryKey().notNull(),
  timestamp: integer('timestamp').notNull(),
  ip: text('ip').notNull(),
  eventType: text('event_type').notNull(),
  details: text('details').notNull(),
  status: text('status').notNull(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey().notNull(),
  value: text('value').notNull(),
});

export const supportMessages = pgTable('support_messages', {
  id: serial('id').primaryKey().notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').default('unread').notNull(),
  replyMessage: text('reply_message'),
  repliedAt: bigint('replied_at', { mode: 'number' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const upgradeTransactions = pgTable('upgrade_transactions', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').notNull(),
  amount: real('amount').notNull(),
  currency: text('currency').notNull(),
  gateway: text('gateway').notNull(),
  transactionRef: text('transaction_ref').notNull(),
  status: text('status').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const userSettings = pgTable('user_settings', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').unique().notNull(),
  emailNotifications: integer('email_notifications').default(1),
  pushNotifications: integer('push_notifications').default(1),
  weeklyNewsletter: integer('weekly_newsletter').default(1),
  twoFactorAuth: integer('two_factor_auth').default(0),
  securityAlerts: integer('security_alerts').default(1),
  updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey().notNull(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  avatar: text('avatar').notNull(),
  role: text('role').notNull(),
  status: text('status').default('Active'),
  bio: text('bio').default(''),
  portfolioName: text('portfolio_name').default(''),
  portfolioUrl: text('portfolio_url').default(''),
  banner: text('banner').default(''),
  socialLink: text('social_link').default(''),
  expertise: text('expertise').default('Minimalism, Urban Photography, Japanese Culture, UI Design'),
  memberSince: text('member_since').default('March 2023'),
  savedPrivacy: text('saved_privacy').default('private'),
  hasBlueBadge: integer('has_blue_badge').default(0),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const webPushSubscriptions = pgTable('web_push_subscriptions', {
  id: serial('id').primaryKey().notNull(),
  username: text('username'),
  endpoint: text('endpoint').unique().notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const floatingWidget = pgTable('floating_widget', {
  id: serial('id').primaryKey().notNull(),
  isActive: integer('is_active').default(0).notNull(),
  logoUrl: text('logo_url').notNull(),
  linkUrl: text('link_url').notNull(),
});

export const userInteractions = pgTable('user_interactions', {
  id: serial('id').primaryKey().notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  interactionType: text('interaction_type').notNull(), // 'like', 'bookmark'
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const articleRevisions = pgTable('article_revisions', {
  id: serial('id').primaryKey().notNull(),
  articleId: text('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(),
  img: text('img').notNull(),
  updatedBy: integer('updated_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});

export const media = pgTable('media', {
  id: serial('id').primaryKey().notNull(),
  publicId: text('public_id').notNull(),
  url: text('url').notNull(),
  format: text('format').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  bytes: integer('bytes').notNull(),
  uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: bigint('created_at', { mode: 'number' }).notNull(),
});


