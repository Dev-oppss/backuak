import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261015100000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "site_setting" add column if not exists "youtube" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "site_setting" drop column if exists "youtube";`);
  }

}
