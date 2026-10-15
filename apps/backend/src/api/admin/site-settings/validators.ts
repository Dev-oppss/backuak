import { z } from "@medusajs/framework/zod"

export const PostAdminSiteSettings = z.object({
  phone: z.string().max(50).optional(),
  whatsapp: z.string().max(20).optional(),
  email: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  hours: z.string().max(200).optional(),
  instagram: z.string().max(300).optional(),
  facebook: z.string().max(300).optional(),
  tiktok: z.string().max(300).optional(),
  youtube: z.string().max(300).optional(),
  banner_messages: z.array(z.string().max(200)).optional(),
})
