import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * GET /store/orders/:id/delivery-stage
 * Pour l'écran "Mes commandes" (/compte) : affiche à la cliente où en est
 * sa commande dans le pipeline détaillé (préparation, expédition…), en
 * plus des statuts natifs Medusa. Route réservée au client authentifié
 * propriétaire de la commande (voir middlewares.ts — authenticate("customer")
 * + vérification que la commande lui appartient, ci-dessous).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "delivery_stage.*"],
    filters: { id },
  })

  const order = data[0]
  const customerId = (req.auth_context as any)?.actor_id

  if (!order || order.customer_id !== customerId) {
    res.status(404).json({ message: "Commande introuvable." })
    return
  }

  res.json({ delivery_stage: order.delivery_stage ?? null })
}
