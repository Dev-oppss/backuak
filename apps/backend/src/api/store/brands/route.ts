import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"

/**
 * GET /store/brands
 * Route PUBLIQUE, sur le même principe que /store/products/:id/beauty-attributes :
 * l'API Store de Medusa n'expose pas nativement les modules custom, donc
 * sans cette route la vitrine ne peut pas lister les marques pour son
 * filtre "Marque" du catalogue.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands({}, { select: ["id", "name"] })
  res.json({ brands })
}
