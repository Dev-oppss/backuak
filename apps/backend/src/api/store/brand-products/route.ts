import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/brand-products?marque=ACM
 * Route PUBLIQUE — ne renvoie que des ids de produits (jamais de prix),
 * même principe que /store/bestsellers : la vitrine redemande ensuite les
 * vraies données à Medusa avec ces ids.
 *
 * Nécessaire car l'API Store native ne renvoie pas la marque (module custom
 * lié par defineLink) et ne sait pas filtrer dessus.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { marque } = req.query as Record<string, string>
  if (!marque?.trim()) {
    res.json({ product_ids: [] })
    return
  }

  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "brand.id", "brand.name"],
    pagination: { take: 10000 },
  })

  const wanted = marque.trim().toLowerCase()
  const product_ids = (data as any[])
    .filter((p) => p.brand?.name?.trim().toLowerCase() === wanted)
    .map((p) => p.id)

  res.json({ product_ids })
}
