import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    // ...les modules déjà enregistrés...
    { resolve: "./modules/brand" },
    { resolve: "./modules/beauty-attributes" },
    { resolve: "./modules/delivery-stage" },
    { resolve: "./modules/delivery-point" },
    { resolve: "./modules/review" },
    { resolve: "./modules/site-analytics" },
    { resolve: "./modules/email-verification" },
    { resolve: "./modules/site-settings" },
    { resolve: "./modules/homepage" },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              upload_dir: "/home/webmaster/uploads",
              backend_url: "https://api.kuakumarket.com/static",
            },
          },
        ],
      },
    },
  ],
});
