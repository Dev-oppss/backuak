import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/bestsellers?by=sales|rating&limit=8
 * Route PUBLIQUE — ne renvoie que des ids de produits, classés :
 * - "sales"  : les plus vendus, calculé sur les commandes réelles
 * - "rating" : les mieux notés, sur les avis publiés uniquement, avec un
 *              minimum de 2 avis pour éviter qu'un seul avis à 5 étoiles
 *              domine le classement
 * Le front redemande ensuite les vraies données (prix inclus) à Medusa
 * avec ces ids — même principe que /store/search.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { by = "sales", limit = "8" } = req.query as Record<string, string>
  const take = Number(limit) || 8
  const query = req.scope.resolve("query")

  if (by === "rating") {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "reviews.rating", "reviews.status"],
      pagination: { take: 10000 },
    })
    const ranked = (products as any[])
      .map((p) => {
        const pub = (p.reviews ?? []).filter((r: any) => r.status === "published")
        return {
          id: p.id,
          average: pub.length ? pub.reduce((s: number, r: any) => s + r.rating, 0) / pub.length : 0,
          count: pub.length,
        }
      })
      .filter((p) => p.count >= 2)
      .sort((a, b) => b.average - a.average)
      .slice(0, take)

    res.json({ product_ids: ranked.map((p) => p.id) })
    return
  }

  // by === "sales" (par défaut)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "items.product_id", "items.quantity"],
    pagination: { take: 10000 },
  })
  const units: Record<string, number> = {}
  for (const o of orders as any[]) {
    for (const item of o.items ?? []) {
      if (!item.product_id) continue
      units[item.product_id] = (units[item.product_id] ?? 0) + Number(item.quantity ?? 0)
    }
  }
  const product_ids = Object.entries(units)
    .sort((a, b) => b[1] - a[1])
    .slice(0, take)
    .map(([id]) => id)

  res.json({ product_ids })
}
