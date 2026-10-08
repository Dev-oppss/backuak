import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/products/:id/beauty-attributes
 *
 * Route PUBLIQUE (pas d'auth admin) — nécessaire car les liens de modules
 * custom ne sont pas exposés automatiquement sur l'API Store, seulement
 * sur l'API Admin. Sans cette route, le storefront ne peut pas afficher
 * zone/moment/mode sur la fiche produit.
 *
 * Comme les autres routes custom du projet, elle passe par le middleware
 * de clé publique standard de Medusa (appliqué automatiquement aux routes
 * /store) — le storefront doit donc envoyer l'en-tête
 * x-publishable-api-key (voir lib/medusa.ts côté frontend).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "beauty_attributes.*"],
    filters: { id },
  })

  res.json({ beauty_attributes: data[0]?.beauty_attributes ?? null })
}
