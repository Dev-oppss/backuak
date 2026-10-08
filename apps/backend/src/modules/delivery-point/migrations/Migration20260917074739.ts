import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260917074739 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "delivery_point" ("id" text not null, "name" text not null, "city" text not null, "fee" integer not null, "estimated_delay" text null, "active" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_point_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_point_deleted_at" ON "delivery_point" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "delivery_point" cascade;`);
  }

}
