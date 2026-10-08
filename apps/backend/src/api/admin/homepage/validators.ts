import { z } from "@medusajs/framework/zod"

const HeroSlide = z.object({
  image_url: z.string(),
  title: z.string().max(200).optional(),
  subtitle: z.string().max(300).optional(),
  cta_label: z.string().max(60).optional(),
  cta_href: z.string().max(300).optional(),
})

const PromoSlide = z.object({
  mode: z.enum(["banner", "poster"]).default("banner"),
  image_url: z.string().optional(),
  tone: z.enum(["rose", "teal"]).optional(),
  title: z.string().max(200).optional(),
  text: z.string().max(400).optional(),
  cta: z.string().max(60).optional(),
  href: z.string().max(300),
})

export const PostAdminHomepage = z.object({
  hero_slides: z.array(HeroSlide).optional(),
  promo_slides: z.array(PromoSlide).optional(),
  featured_product_ids: z.array(z.string()).optional(),
})
