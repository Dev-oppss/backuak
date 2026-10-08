import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { DELIVERY_STAGE_MODULE } from "../modules/delivery-stage"
import { DELIVERY_POINT_MODULE } from "../modules/delivery-point"

/**
 * Initialise automatiquement le pipeline de statuts détaillé (point 4 de
 * la spec) dès qu'une commande est passée : delivery_stage = "nouvelle",
 * et rattache le point de livraison choisi par la cliente pendant le
 * tunnel (stocké dans cart.metadata.delivery_point_id — voir
 * /commande côté vitrine).
 *
 * Rappel sécurité (spec point 4/6) : ce subscriber ne touche jamais
 * payment_status — seul un webhook signé du fournisseur de paiement ou
 * une action manuelle de la propriétaire dans l'admin peut le faire.
 */
export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve("query")
  const link = container.resolve("link")
  const deliveryStageService = container.resolve(DELIVERY_STAGE_MODULE)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "cart.id", "delivery_stage.id"],
    filters: { id: data.id },
  })
  const order = orders[0]
  if (!order || order.delivery_stage?.id) return // déjà initialisé

  const [stage] = await deliveryStageService.createDeliveryStages([
    { stage: "nouvelle" },
  ])
  await link.create({
    order: { order_id: order.id },
    [DELIVERY_STAGE_MODULE]: { delivery_stage_id: stage.id },
  })

  // Rattache le point de livraison choisi, s'il y en a un sur le panier
  // d'origine de la commande.
  const cartId = order.cart?.id
if (cartId) {
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata"],
    filters: { id: cartId },
  })
  const deliveryPointId = (carts[0]?.metadata as Record<string, unknown> | null)
    ?.delivery_point_id as string | undefined

  if (deliveryPointId) {
    await link.create({
      order: { order_id: order.id },
      [DELIVERY_POINT_MODULE]: { delivery_point_id: deliveryPointId },
    })
  }
}
}
export const config: SubscriberConfig = {
  event: "order.placed",
}