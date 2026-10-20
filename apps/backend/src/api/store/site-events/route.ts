import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { SITE_ANALYTICS_MODULE } from "../../../modules/site-analytics"
import { clientIp, locateIp, normalizeCity, regionOfCity, type Geo } from "../../../lib/geo"
import type { PostSiteEvent } from "./validators"

type Body = z.infer<typeof PostSiteEvent>

/**
 * POST /store/site-events
 * Remplace Umami/Google Analytics : reste dans Medusa, aucune donnée
 * personnelle (pas d'IP stockée, pas de nom, pas d'email — juste un
 * identifiant anonyme généré par le navigateur, et le lieu approximatif
 * — pays / région / ville — déduit de l'IP puis oubliée). Route PUBLIQUE mais très
 * limitée (write-only, un type fermé de champs) : rien d'exploitable en
 * cas d'abus, dans le pire cas des lignes statistiques à nettoyer.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const siteAnalytics: any = req.scope.resolve(SITE_ANALYTICS_MODULE)
  // Jour du Cameroun (UTC+1) : sans ce décalage, les visites entre minuit et 1 h
  // seraient comptées la veille.
  const day = new Date(Date.now() + 3600_000).toISOString().slice(0, 10)
  // Le visiteur a indiqué son pays (et sa ville) dans la notification : on le croit.
  // Sinon (notification fermée ou ignorée) : lieu approximatif déduit de l'IP, comme avant.
  const { country, city } = req.validatedBody
  let geo: Geo
  if (country && /^[A-Za-z]{2}$/.test(country)) {
    const code = country.toUpperCase()
    const ville = normalizeCity(city)
    geo = { country: code, region: code === "CM" ? regionOfCity(ville) : null, city: ville }
  } else {
    geo = await locateIp(clientIp(req as any))
  }

  await siteAnalytics.createSiteEvents([
    {
      type: req.validatedBody.type,
      path: req.validatedBody.path,
      target: req.validatedBody.target ?? null,
      product_id: req.validatedBody.product_id ?? null,
      visitor_id: req.validatedBody.visitor_id,
      day,
      country: geo.country,
      region: geo.region,
      city: geo.city,
    },
  ])

  res.status(204).end()
}
