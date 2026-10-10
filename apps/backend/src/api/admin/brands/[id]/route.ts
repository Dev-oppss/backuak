import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../../modules/brand"

/**
 * POST /admin/brands/:id — renomme une marque et/ou change son logo
 * (seuls les champs envoyés sont modifiés ; logo_url vide = retirer le logo).
 * DELETE /admin/brands/:id — supprime une marque ; les produits qui y
 * étaient liés restent en place, simplement sans marque.
 */
export async function POST(
  req: MedusaRequest<{ name?: string; logo_url?: string | null }>,
  res: MedusaResponse
) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const { name, logo_url } = req.body ?? {}
  const [brand] = await brandService.updateBrands([
    {
      id: req.params.id,
      ...(name !== undefined ? { name } : {}),
      ...(logo_url !== undefined ? { logo_url: logo_url || null } : {}),
    },
  ])
  res.json({ brand })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  await brandService.deleteBrands([req.params.id])
  res.json({ id: req.params.id, deleted: true })
}
