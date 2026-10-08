import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260930054118 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "site_setting" ("id" text not null, "phone" text null, "whatsapp" text null, "email" text null, "address" text null, "hours" text null, "instagram" text null, "facebook" text null, "tiktok" text null, "banner_messages" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "site_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_site_setting_deleted_at" ON "site_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "site_setting" cascade;`);
  }

}
