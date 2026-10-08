import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260917074716 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "delivery_stage" ("id" text not null, "stage" text check ("stage" in ('nouvelle', 'confirmee', 'preparation', 'expedition', 'livree', 'annulee', 'echec', 'retour')) not null default 'nouvelle', "note" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "delivery_stage_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_delivery_stage_deleted_at" ON "delivery_stage" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "delivery_stage" cascade;`);
  }

}
