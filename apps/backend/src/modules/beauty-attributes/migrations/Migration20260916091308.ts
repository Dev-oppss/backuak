import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260916091308 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "beauty_attributes" ("id" text not null, "skin_type" text[] null, "application_zone" text[] null, "usage_time" text[] null, "usage_mode" text check ("usage_mode" in ('application_directe', 'dilution', 'melange', 'apres_un_autre_produit', 'seul')) null, "compatible_with_ids" text[] null, "incompatible_with_ids" text[] null, "precautions" text null, "side_effects" text null, "ingredients" text null, "net_content" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "beauty_attributes_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_beauty_attributes_deleted_at" ON "beauty_attributes" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "beauty_attributes" cascade;`);
  }

}
