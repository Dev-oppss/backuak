import { z } from "@medusajs/framework/zod"

export const PostStoreReview = z.object({
  product_id: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
})
