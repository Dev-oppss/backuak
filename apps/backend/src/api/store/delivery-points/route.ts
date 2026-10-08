import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_POINT_MODULE } from "../../../modules/delivery-point"

/**
 * GET /store/delivery-points
 * Route PUBLIQUE (écran Commande, point 5 de la spec) — ne renvoie que les
 * points actifs : une cliente ne doit pas pouvoir choisir une zone que la
 * propriétaire a désactivée depuis l'admin.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  const points = await deliveryPointService.listDeliveryPoints(
    { active: true },
    { select: ["id", "name", "city", "fee", "estimated_delay"] }
  )
  res.json({ delivery_points: points })
}
