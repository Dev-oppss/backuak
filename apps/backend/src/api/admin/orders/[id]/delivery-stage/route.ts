import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_STAGE_MODULE } from "../../../../../modules/delivery-stage"
import type { z } from "@medusajs/framework/zod"
import type { PostAdminDeliveryStage } from "../../../validators"

type PostAdminDeliveryStageType = z.infer<typeof PostAdminDeliveryStage>

/**
 * GET /admin/orders/:id/delivery-stage
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "delivery_stage.*"],
    filters: { id },
  })

  res.json({ delivery_stage: data[0]?.delivery_stage ?? null })
}

/**
 * POST /admin/orders/:id/delivery-stage
 * Crée le statut s'il n'existe pas encore, ou le met à jour sinon — la
 * propriétaire fait avancer la commande dans le pipeline depuis l'admin.
 *
 * Comme pour le module attributs beauté : vérifier la forme exacte de
 * `link.create()` et le nom d'accès (`order.delivery_stage`) une fois
 * branché sur le vrai projet.
 */
export async function POST(
  req: MedusaRequest<PostAdminDeliveryStageType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const deliveryStageService = req.scope.resolve(DELIVERY_STAGE_MODULE)
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "delivery_stage.id"],
    filters: { id },
  })

  const existingId = data[0]?.delivery_stage?.id

  if (existingId) {
    const [updated] = await deliveryStageService.updateDeliveryStages([
      { id: existingId, ...req.validatedBody },
    ])
    return res.json({ delivery_stage: updated })
  }

  const link = req.scope.resolve("link")
  const [created] = await deliveryStageService.createDeliveryStages([
    req.validatedBody,
  ])

  await link.create({
    order: { order_id: id },
    [DELIVERY_STAGE_MODULE]: { delivery_stage_id: created.id },
  })

  res.json({ delivery_stage: created })
}
