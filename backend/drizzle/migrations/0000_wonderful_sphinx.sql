CREATE TABLE "article_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"content" text NOT NULL,
	"author_id" integer,
	"author" jsonb,
	"created_at" bigint NOT NULL,
	"img" text NOT NULL,
	"views" text NOT NULL,
	"status" text DEFAULT 'approved' NOT NULL,
	"likes" integer DEFAULT 2400,
	"tags" text,
	"read_time" text
);
--> statement-breakpoint
CREATE TABLE "author_followers" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"author_id" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
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
	CONSTRAINT "authors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"article_id" text NOT NULL,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cache" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"count" text NOT NULL,
	"color" text NOT NULL,
	"icon_name" text NOT NULL,
	"desc" text NOT NULL,
	CONSTRAINT "categories_title_unique" UNIQUE("title")
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
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" bigint NOT NULL,
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
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queue_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue_name" text DEFAULT 'default' NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"last_error" text,
	"run_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"timestamp" integer NOT NULL,
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
	"replied_at" bigint,
	"created_at" bigint NOT NULL
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
	"created_at" bigint NOT NULL
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
	"updated_at" bigint NOT NULL,
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
	"created_at" bigint NOT NULL,
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
	"created_at" bigint NOT NULL,
	CONSTRAINT "web_push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
