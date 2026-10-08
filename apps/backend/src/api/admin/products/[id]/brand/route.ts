import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { BRAND_MODULE } from "../../../../../modules/brand"

/**
 * POST /admin/products/:id/brand
 * Body : { brand_id: string }
 *
 * Remplace le lien existant s'il y en a déjà un (un produit n'a qu'une
 * seule marque) : on retire d'abord l'éventuel lien précédent, sinon un
 * second link.create() sur un produit déjà lié à une marque échoue avec
 * la même erreur "Cannot create multiple links…" que pour les attributs
 * beauté (product ↔ brand est aussi un lien 1-1 côté produit).
 */
export async function POST(
  req: MedusaRequest<{ brand_id: string }>,
  res: MedusaResponse
) {
  const { id } = req.params
  const { brand_id } = req.body ?? {}
  const link = req.scope.resolve("link")
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "brand.id"],
    filters: { id },
  })
  const existingBrandId = data[0]?.brand?.id

  if (existingBrandId) {
    await link.dismiss({
      [Modules.PRODUCT]: { product_id: id },
      [BRAND_MODULE]: { brand_id: existingBrandId },
    })
  }

  await link.create({
    [Modules.PRODUCT]: { product_id: id },
    [BRAND_MODULE]: { brand_id },
  })

  res.json({ product_id: id, brand_id })
}
