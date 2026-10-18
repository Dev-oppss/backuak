import { normalizeCity, regionOfCity } from "./geo"

/**
 * Statistiques par lieu (pays / région / ville) : où sont les visiteurs, où il
 * y a le plus de visites et de clics, et quels produits "marchent" le mieux
 * dans chaque lieu. Fonction pure (aucun accès base) pour rester testable.
 *
 * "Produits les plus aimés" : le site n'a pas de bouton "j'aime", on mesure
 * donc l'intérêt réel par un score :
 *     clics sur le produit ×1  +  ajouts au panier ×3  +  unités commandées ×5
 * Les commandes sont placées par la VILLE DU POINT DE LIVRAISON (exacte),
 * les visites et clics par la localisation de l'IP (approximative).
 */
export const SCORE_WEIGHTS = { click: 1, add_to_cart: 3, ordered: 5 } as const

export type GeoEvent = {
  type: string
  product_id: string | null
  visitor_id: string
  country: string | null
  region: string | null
  city: string | null
}
export type GeoOrder = {
  city: string | null
  items: { product_id: string | null; quantity: number }[]
}
export type GeoRow = {
  key: string
  name: string
  country: string | null
  visitors: number
  page_views: number
  clicks: number
  add_to_cart: number
  orders: number
}
export type ProductRow = {
  id: string
  title: string
  clicks: number
  add_to_cart: number
  ordered: number
  score: number
}
export type GeoStats = {
  coverage: { located: number; total: number }
  weights: typeof SCORE_WEIGHTS
  levels: { country: GeoRow[]; region: GeoRow[]; city: GeoRow[] }
  top_products: {
    country: Record<string, ProductRow[]>
    region: Record<string, ProductRow[]>
    city: Record<string, ProductRow[]>
  }
}

type Level = "country" | "region" | "city"
type Acc = { row: GeoRow; visitors: Set<string>; products: Map<string, ProductRow> }

const MAX_ROWS = 50
const TOP_PRODUCTS = 5

export function buildGeoStats(
  events: GeoEvent[],
  orders: GeoOrder[],
  productTitle: Map<string, string>
): GeoStats {
  const levels: Record<Level, Map<string, Acc>> = {
    country: new Map(),
    region: new Map(),
    city: new Map(),
  }

  const acc = (level: Level, key: string, name: string, country: string | null): Acc => {
    let a = levels[level].get(key)
    if (!a) {
      a = {
        row: { key, name, country, visitors: 0, page_views: 0, clicks: 0, add_to_cart: 0, orders: 0 },
        visitors: new Set(),
        products: new Map(),
      }
      levels[level].set(key, a)
    }
    return a
  }
  const product = (a: Acc, id: string): ProductRow => {
    let p = a.products.get(id)
    if (!p) {
      p = { id, title: productTitle.get(id) ?? id, clicks: 0, add_to_cart: 0, ordered: 0, score: 0 }
      a.products.set(id, p)
    }
    return p
  }
  // Les 3 niveaux concernés par un lieu (un niveau absent est simplement ignoré).
  const targets = (country: string | null, region: string | null, city: string | null) => {
    const c = country ?? "??"
    const out: Acc[] = [acc("country", c, c === "??" ? "Inconnu" : c, country)]
    if (region) out.push(acc("region", `${c}|${region}`, region, country))
    if (city) out.push(acc("city", `${c}|${city}`, city, country))
    return out
  }

  let located = 0
  for (const e of events) {
    if (e.country) located += 1
    for (const a of targets(e.country, e.region, e.city)) {
      if (e.type === "page_view" || e.type === "product_view") a.visitors.add(e.visitor_id)
      if (e.type === "page_view") a.row.page_views += 1
      if (e.type === "product_click") {
        a.row.clicks += 1
        if (e.product_id) product(a, e.product_id).clicks += 1
      }
      if (e.type === "add_to_cart") {
        a.row.add_to_cart += 1
        if (e.product_id) product(a, e.product_id).add_to_cart += 1
      }
    }
  }

  for (const o of orders) {
    const city = normalizeCity(o.city)
    const region = regionOfCity(city)
    for (const a of targets("CM", region, city)) {
      a.row.orders += 1
      for (const it of o.items) {
        if (it.product_id) product(a, it.product_id).ordered += Number(it.quantity ?? 0)
      }
    }
  }

  const result: GeoStats = {
    coverage: { located, total: events.length },
    weights: SCORE_WEIGHTS,
    levels: { country: [], region: [], city: [] },
    top_products: { country: {}, region: {}, city: {} },
  }
  for (const level of ["country", "region", "city"] as Level[]) {
    const accs = [...levels[level].values()]
    for (const a of accs) a.row.visitors = a.visitors.size
    accs.sort(
      (x, y) =>
        y.row.visitors - x.row.visitors ||
        y.row.clicks - x.row.clicks ||
        y.row.orders - x.row.orders
    )
    for (const a of accs.slice(0, MAX_ROWS)) {
      result.levels[level].push(a.row)
      const top = [...a.products.values()]
        .map((p) => ({
          ...p,
          score:
            p.clicks * SCORE_WEIGHTS.click +
            p.add_to_cart * SCORE_WEIGHTS.add_to_cart +
            p.ordered * SCORE_WEIGHTS.ordered,
        }))
        .sort((x, y) => y.score - x.score)
        .slice(0, TOP_PRODUCTS)
      result.top_products[level][a.row.key] = top
    }
  }
  return result
}
