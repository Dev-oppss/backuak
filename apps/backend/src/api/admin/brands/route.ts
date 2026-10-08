import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"

/**
 * GET /admin/brands — liste toutes les marques (pour le script d'import et
 * un futur écran de gestion).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands()
  res.json({ brands })
}

/**
 * POST /admin/brands — crée une marque si elle n'existe pas déjà (le script
 * d'import vérifie d'abord via GET, donc pas de contrôle de doublon ici).
 */
export async function POST(req: MedusaRequest<{ name: string }>, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const [brand] = await brandService.createBrands([{ name: req.body?.name }])
  res.json({ brand })
}
