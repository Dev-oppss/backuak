import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_ANALYTICS_MODULE } from "../../../modules/site-analytics"

/**
 * GET /admin/stats
 * Toutes les statistiques dans Medusa, sans outil externe : ventes
 * (commandes, produits, marques, catégories, clients, avis — données
 * réelles de Medusa) ET fréquentation (visites, pages vues, clics —
 * table site_event, alimentée par /store/site-events).
 *
 * Limite volontaire : lit jusqu'à 10 000 lignes en mémoire par requête —
 * largement suffisant à ce stade ; au-delà, passer à des agrégats SQL.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id", "created_at", "total", "customer_id", "email",
      "items.product_id", "items.quantity", "items.title",
    ],
    pagination: { take: 10000 },
  })

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "categories.name", "brand.name", "reviews.rating", "reviews.status"],
    pagination: { take: 10000 },
  })
  const productById = new Map<string, any>(products.map((p: any) => [p.id, p]))

  const byDay: Record<string, number> = {}
  const byMonth: Record<string, number> = {}
  const units: Record<string, number> = {}
  const brandUnits: Record<string, number> = {}
  const categoryUnits: Record<string, number> = {}
  const customers: Record<string, { email: string; orders: number; spent: number }> = {}
  let revenue = 0

  for (const o of orders as any[]) {
    const day = String(o.created_at).slice(0, 10)
    const month = day.slice(0, 7)
    byDay[day] = (byDay[day] ?? 0) + 1
    byMonth[month] = (byMonth[month] ?? 0) + 1
    revenue += Number(o.total ?? 0)

    const key = o.customer_id ?? o.email
    if (key) {
      customers[key] ??= { email: o.email, orders: 0, spent: 0 }
      customers[key].orders += 1
      customers[key].spent += Number(o.total ?? 0)
    }

    for (const item of o.items ?? []) {
      if (!item.product_id) continue
      const q = Number(item.quantity ?? 0)
      units[item.product_id] = (units[item.product_id] ?? 0) + q
      const p = productById.get(item.product_id)
      const brand = p?.brand?.name
      if (brand) brandUnits[brand] = (brandUnits[brand] ?? 0) + q
      for (const c of p?.categories ?? []) {
        categoryUnits[c.name] = (categoryUnits[c.name] ?? 0) + q
      }
    }
  }

  const ranked = Object.entries(units)
    .map(([id, qty]) => ({ id, title: productById.get(id)?.title ?? id, units: qty }))
    .sort((a, b) => b.units - a.units)

  const neverOrdered = (products as any[])
    .filter((p) => !units[p.id])
    .map((p) => ({ id: p.id, title: p.title, units: 0 }))

  const rated = (products as any[])
    .map((p) => {
      const pub = (p.reviews ?? []).filter((r: any) => r.status === "published")
      return {
        id: p.id,
        title: p.title,
        count: pub.length,
        average: pub.length ? pub.reduce((s: number, r: any) => s + r.rating, 0) / pub.length : 0,
      }
    })
    .filter((p) => p.count > 0)
    .sort((a, b) => b.average - a.average)

  const toList = (rec: Record<string, number>) =>
    Object.entries(rec).map(([name, units]) => ({ name, units })).sort((a, b) => b.units - a.units)

  // ---------- Fréquentation (site_event) ----------
  const siteAnalytics: any = req.scope.resolve(SITE_ANALYTICS_MODULE)
  const [events] = await siteAnalytics.listAndCountSiteEvents(
    {},
    { take: 10000, order: { day: "DESC" } }
  )

  const visitsByDay: Record<string, Set<string>> = {}
  const visitsByMonth: Record<string, Set<string>> = {}
  const pageViewsByPath: Record<string, number> = {}
  const productClicks: Record<string, { title: string; clicks: number }> = {}
  let totalPageViews = 0
  let totalAddToCart = 0

  for (const e of events as any[]) {
    const month = e.day.slice(0, 7)
    if (e.type === "page_view" || e.type === "product_view") {
      visitsByDay[e.day] ??= new Set()
      visitsByDay[e.day].add(e.visitor_id)
      visitsByMonth[month] ??= new Set()
      visitsByMonth[month].add(e.visitor_id)
    }
    if (e.type === "page_view") {
      totalPageViews += 1
      pageViewsByPath[e.path] = (pageViewsByPath[e.path] ?? 0) + 1
    }
    if (e.type === "product_click" && e.product_id) {
      const p = productById.get(e.product_id)
      productClicks[e.product_id] ??= { title: p?.title ?? e.target ?? e.product_id, clicks: 0 }
      productClicks[e.product_id].clicks += 1
    }
    if (e.type === "add_to_cart") totalAddToCart += 1
  }

  res.json({
    totals: { orders: orders.length, revenue, customers: Object.keys(customers).length },
    orders_by_day: byDay,
    orders_by_month: byMonth,
    top_products: ranked.slice(0, 10),
    least_popular_products: [...ranked.slice(-10).reverse(), ...neverOrdered].slice(0, 10),
    top_customers: Object.values(customers).sort((a, b) => b.spent - a.spent).slice(0, 10),
    top_brands: toList(brandUnits).slice(0, 10),
    top_categories: toList(categoryUnits).slice(0, 10),
    best_rated: rated.slice(0, 10),
    worst_rated: [...rated].reverse().slice(0, 10),

    traffic: {
      visits_by_day: Object.fromEntries(
        Object.entries(visitsByDay).map(([d, s]) => [d, s.size])
      ),
      visits_by_month: Object.fromEntries(
        Object.entries(visitsByMonth).map(([m, s]) => [m, s.size])
      ),
      total_page_views: totalPageViews,
      total_add_to_cart: totalAddToCart,
      top_pages: Object.entries(pageViewsByPath)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10),
      top_clicked_products: Object.values(productClicks)
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
    },
  })
}
