CREATE TABLE "article_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "author_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"article_id" text NOT NULL,
	"author" text NOT NULL,
	"avatar" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" integer,
	"likes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"sender" text NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"article_id" text,
	"is_read" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"ip" text NOT NULL,
	"event_type" text NOT NULL,
	"details" text NOT NULL,
	"status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"subject" text NOT NULL,
	"message" text NOT NULL,
	"status" text DEFAULT 'unread' NOT NULL,
	"reply_message" text,
	"replied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "upgrade_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"amount" real NOT NULL,
	"currency" text NOT NULL,
	"gateway" text NOT NULL,
	"transaction_ref" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email_notifications" integer DEFAULT 1,
	"push_notifications" integer DEFAULT 1,
	"weekly_newsletter" integer DEFAULT 1,
	"two_factor_auth" integer DEFAULT 0,
	"security_alerts" integer DEFAULT 1,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"avatar" text NOT NULL,
	"role" text NOT NULL,
	"bio" text DEFAULT '',
	"portfolio_name" text DEFAULT '',
	"portfolio_url" text DEFAULT '',
	"banner" text DEFAULT '',
	"social_link" text DEFAULT '',
	"expertise" text DEFAULT 'Minimalism, Urban Photography, Japanese Culture, UI Design',
	"member_since" text DEFAULT 'March 2023',
	"saved_privacy" text DEFAULT 'private',
	"has_blue_badge" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "web_push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "web_push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "status" text DEFAULT 'approved' NOT NULL;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "likes" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "tags" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "read_time" text;--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "bio" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "portfolio_name" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "portfolio_url" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "banner" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "social_link" text DEFAULT '';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "expertise" text DEFAULT 'Minimalism, Urban Photography, Japanese Culture, UI Design';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "member_since" text DEFAULT 'March 2023';--> statement-breakpoint
ALTER TABLE "authors" ADD COLUMN "saved_privacy" text DEFAULT 'private';