import { z } from "@medusajs/framework/zod"

export const PostAdminBrand = z.object({
  name: z.string(),
  logo_url: z.string().nullable().optional(),
})

export const PostAdminProductBrand = z.object({
  brand_id: z.string(),
})
