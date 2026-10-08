import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { SITE_ANALYTICS_MODULE } from "../../../modules/site-analytics"
import type { PostSiteEvent } from "./validators"

type Body = z.infer<typeof PostSiteEvent>

/**
 * POST /store/site-events
 * Remplace Umami/Google Analytics : reste dans Medusa, aucune donnée
 * personnelle (pas d'IP stockée, pas de nom, pas d'email — juste un
 * identifiant anonyme généré par le navigateur). Route PUBLIQUE mais très
 * limitée (write-only, un type fermé de champs) : rien d'exploitable en
 * cas d'abus, dans le pire cas des lignes statistiques à nettoyer.
 */
export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const siteAnalytics: any = req.scope.resolve(SITE_ANALYTICS_MODULE)
  const day = new Date().toISOString().slice(0, 10)

  await siteAnalytics.createSiteEvents([
    {
      type: req.validatedBody.type,
      path: req.validatedBody.path,
      target: req.validatedBody.target ?? null,
      product_id: req.validatedBody.product_id ?? null,
      visitor_id: req.validatedBody.visitor_id,
      day,
    },
  ])

  res.status(204).end()
}
