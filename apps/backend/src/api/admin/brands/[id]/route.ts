import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"

/**
 * POST /admin/brands/:id — renomme une marque.
 * DELETE /admin/brands/:id — supprime une marque ; les produits qui y
 * étaient liés restent en place, simplement sans marque.
 */
export async function POST(
  req: MedusaRequest<{ name: string }>,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const [brand] = await brandService.updateBrands([
    { id: req.params.id, name: req.body?.name },
  ])
  res.json({ brand })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  await brandService.deleteBrands([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
