ALTER TABLE "articles" ALTER COLUMN "likes" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "meta_description" text;--> statement-breakpoint
ALTER TABLE "articles" ADD COLUMN "external_author" text;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_slug_unique" UNIQUE("slug");