import { z } from "@medusajs/framework/zod"

export const PostAdminDeliveryStage = z.object({
  stage: z.enum([
    "nouvelle",
    "confirmee",
    "preparation",
    "expedition",
    "livree",
    "annulee",
    "echec",
    "retour",
  ]),
  note: z.string().optional(),
})

export const PostAdminDeliveryPoint = z.object({
  name: z.string(),
  city: z.string(),
  fee: z.number(),
  estimated_delay: z.string().optional(),
  active: z.boolean().optional(),
})
