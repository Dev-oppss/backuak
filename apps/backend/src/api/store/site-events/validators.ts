import { z } from "@medusajs/framework/zod"

export const PostSiteEvent = z.object({
  type: z.enum(["page_view", "product_view", "product_click", "add_to_cart", "link_click"]),
  path: z.string().max(500),
  target: z.string().max(200).optional(),
  product_id: z.string().optional(),
  visitor_id: z.string().min(8).max(64),
})
