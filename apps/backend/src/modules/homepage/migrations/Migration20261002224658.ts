import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261002224658 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "homepage_content" ("id" text not null, "hero_slides" jsonb null, "promo_slides" jsonb null, "featured_product_ids" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "homepage_content_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_homepage_content_deleted_at" ON "homepage_content" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "homepage_content" cascade;`);
  }

}
