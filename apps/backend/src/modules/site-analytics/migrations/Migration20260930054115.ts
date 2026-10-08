import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930054115 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_event" ("id" text not null, "type" text check ("type" in ('page_view', 'product_view', 'product_click', 'add_to_cart', 'link_click')) not null, "path" text not null, "target" text null, "product_id" text null, "visitor_id" text not null, "day" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_event_deleted_at" ON "site_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_event_type_day" ON "site_event" ("type", "day") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_event" cascade;`);
  }

}
