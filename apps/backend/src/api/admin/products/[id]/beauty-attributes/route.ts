import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { BEAUTY_ATTRIBUTES_MODULE } from "../../../../../modules/beauty-attributes"
import type { z } from "@medusajs/framework/zod"
import type { PostAdminBeautyAttributes } from "./validators"

type PostAdminBeautyAttributesType = z.infer<typeof PostAdminBeautyAttributes>

/**
 * GET /admin/products/:id/beauty-attributes
 * Récupère les attributs beauté liés à un produit (via le module link),
 * pour les afficher dans l'écran produit de l'admin.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "beauty_attributes.*"],
    filters: { id },
  })

  res.json({ beauty_attributes: data[0]?.beauty_attributes ?? null })
}

/**
 * POST /admin/products/:id/beauty-attributes
 * Crée les attributs beauté d'un produit ET le lien la première fois ;
 * les fois suivantes, met seulement à jour l'enregistrement existant sans
 * recréer de lien. Le lien product ↔ beautyAttributes est 1-1
 * (voir src/links/product-beauty-attributes.ts) : un deuxième
 * link.create() sur un produit déjà lié échoue avec
 * "Cannot create multiple links between 'product' and 'beautyAttributes'"
 * — c'est le bug observé en enregistrant depuis le widget après un import.
 */
export async function POST(
  req: MedusaRequest<PostAdminBeautyAttributesType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const beautyAttributesService = req.scope.resolve(BEAUTY_ATTRIBUTES_MODULE)
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "beauty_attributes.id"],
    filters: { id },
  })
  const existingId = data[0]?.beauty_attributes?.id

  if (existingId) {
    const [updated] = await beautyAttributesService.updateBeautyAttributes([
      { id: existingId, ...req.validatedBody },
    ])
    return res.json({ beauty_attributes: updated })
  }

  const link = req.scope.resolve("link")
  const [attributes] = await beautyAttributesService.createBeautyAttributes([
    req.validatedBody,
  ])

  await link.create({
    [Modules.PRODUCT]: { product_id: id },
    [BEAUTY_ATTRIBUTES_MODULE]: { beauty_attributes_id: attributes.id },
  })

  res.json({ beauty_attributes: attributes })
}
