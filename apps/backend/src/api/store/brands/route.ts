import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BRAND_MODULE } from "../../../modules/brand"

/**
 * GET /store/brands
 * Route PUBLIQUE, sur le même principe que /store/products/:id/beauty-attributes :
 * l'API Store de Medusa n'expose pas nativement les modules custom, donc
 * sans cette route la vitrine ne peut pas lister les marques pour son
 * filtre "Marque" du catalogue ni pour la grille "Nos marques".
 *
 * Renvoie pour chaque marque : id, name, logo_url et product_count
 * (nombre de produits PUBLIÉS rattachés à la marque).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const brandService = req.scope.resolve(BRAND_MODULE)
  const brands = await brandService.listBrands(
    {},
    { select: ["id", "name", "logo_url"] }
  )

  // Comptage : même lecture du lien produit ↔ marque que /store/brand-products.
  let counts: Record<string, number> | null = {}
  try {
    const query = req.scope.resolve("query")
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "status", "brand.id"],
      pagination: { take: 10000 },
    })
    for (const p of data as any[]) {
      if (p.status === "published" && p.brand?.id) {
        counts[p.brand.id] = (counts[p.brand.id] ?? 0) + 1
      }
    }
  } catch {
    counts = null // la vitrine n'affichera simplement pas les nombres
  }

  res.json({
    brands: brands.map((b: any) => ({
      id: b.id,
      name: b.name,
      logo_url: b.logo_url ?? null,
      product_count: counts ? counts[b.id] ?? 0 : null,
    })),
  })
}
