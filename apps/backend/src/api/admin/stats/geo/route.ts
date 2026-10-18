import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_ANALYTICS_MODULE } from "../../../../modules/site-analytics"
import { buildGeoStats, type GeoOrder } from "../../../../lib/geo-stats"

/**
 * GET /admin/stats/geo?days=30
 * Visites, clics et produits préférés par pays / région / ville.
 * `days` : période en jours (défaut 30, max 90 = durée de conservation des évènements).
 *
 * Limite volontaire : jusqu'à 50 000 évènements lus en mémoire par requête
 * (`truncated: true` si la période en contient davantage).
 */
const MAX_EVENTS = 50000

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const days = Math.min(90, Math.max(1, Number(req.query.days) || 30))
  // Même calendrier que le stockage des évènements : jour du Cameroun (UTC+1).
  const since = new Date(Date.now() + 3600_000 - days * 86400_000).toISOString().slice(0, 10)

  const siteAnalytics: any = req.scope.resolve(SITE_ANALYTICS_MODULE)
  const [events, total] = await siteAnalytics.listAndCountSiteEvents(
    { day: { $gte: since } },
    {
      take: MAX_EVENTS,
      order: { day: "DESC" },
      select: ["type", "product_id", "visitor_id", "country", "region", "city"],
    }
  )

  const query = req.scope.resolve("query")
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    pagination: { take: 10000 },
  })
  const titles = new Map<string, string>(products.map((p: any) => [p.id, p.title]))

  // Commandes de la période, placées par la ville de leur point de livraison.
  let orders: GeoOrder[] = []
  const sinceIso = `${since}T00:00:00.000Z`
  try {
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "created_at", "shipping_address.city", "delivery_point.city", "items.product_id", "items.quantity"],
      filters: { created_at: { $gte: sinceIso } },
      pagination: { take: 10000 },
    })
    orders = (data as any[]).map((o) => ({
      city: o.delivery_point?.city ?? o.shipping_address?.city ?? null,
      items: (o.items ?? []).map((i: any) => ({ product_id: i.product_id ?? null, quantity: Number(i.quantity ?? 0) })),
    }))
  } catch {
    // Lien commande ↔ point de livraison indisponible : stats de visites seules.
  }

  res.json({
    days,
    truncated: total > MAX_EVENTS,
    ...buildGeoStats(events, orders, titles),
  })
}
