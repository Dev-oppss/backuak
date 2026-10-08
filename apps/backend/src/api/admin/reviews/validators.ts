import { z } from "@medusajs/framework/zod"

export const PostAdminReview = z.object({
  status: z.enum(["published", "removed"]),
})
