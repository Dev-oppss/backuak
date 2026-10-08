import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930054114 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "review" ("id" text not null, "customer_id" text not null, "customer_name" text not null, "rating" integer not null, "comment" text null, "status" text check ("status" in ('published', 'flagged', 'removed')) not null default 'published', "verified_purchase" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "review_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_review_deleted_at" ON "review" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "review" cascade;`);
  }

}
