import { neon } from '@neondatabase/serverless';

async function main() {
  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`ALTER TABLE "articles" ADD COLUMN "slug" text UNIQUE;`;
    await sql`ALTER TABLE "articles" ADD COLUMN "meta_description" text;`;
    await sql`ALTER TABLE "articles" ADD COLUMN "external_author" text;`;
    console.log("Success");
  } catch (e) {
    console.error(e);
  }
}
main();
