import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_POINT_MODULE } from "../../../modules/delivery-point"
import type { z } from "@medusajs/framework/zod"
import type { PostAdminDeliveryPoint } from "../validators"

type PostAdminDeliveryPointType = z.infer<typeof PostAdminDeliveryPoint>

/**
 * GET /admin/delivery-points
 * Liste tous les points de livraison, pour l'écran de gestion dans
 * Settings et pour le sélecteur affiché au client au moment de la commande.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  const points = await deliveryPointService.listDeliveryPoints()
  res.json({ delivery_points: points })
}

/**
 * POST /admin/delivery-points
 * Crée un nouveau point de livraison.
 */
export async function POST(
  req: MedusaRequest<PostAdminDeliveryPointType>,
  res: MedusaResponse
) {
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  const [point] = await deliveryPointService.createDeliveryPoints([
    req.validatedBody,
  ])
  res.json({ delivery_point: point })
}
