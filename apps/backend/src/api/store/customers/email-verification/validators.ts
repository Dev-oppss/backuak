import { z } from "@medusajs/framework/zod"

export const PostVerifyCode = z.object({
  code: z.string().length(6),
})
