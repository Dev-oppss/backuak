import { z } from "@medusajs/framework/zod"

export const PostAdminBeautyAttributes = z.object({
  skin_type: z.array(z.string()).optional(),
  application_zone: z.array(z.string()).optional(),
  usage_time: z.array(z.string()).optional(),
  usage_mode: z
    .enum([
      "application_directe",
      "dilution",
      "melange",
      "apres_un_autre_produit",
      "seul",
    ])
    .optional(),
  compatible_with_ids: z.array(z.string()).optional(),
  incompatible_with_ids: z.array(z.string()).optional(),
  precautions: z.string().optional(),
  side_effects: z.string().optional(),
  ingredients: z.string().optional(),
  net_content: z.string().optional(),
})
