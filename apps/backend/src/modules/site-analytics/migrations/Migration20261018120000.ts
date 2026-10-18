import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261018120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_event" add column if not exists "country" text null, add column if not exists "region" text null, add column if not exists "city" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "site_event" drop column if exists "country", drop column if exists "region", drop column if exists "city";`);
  }

}
