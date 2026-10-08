import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { DELIVERY_POINT_MODULE } from "../../../../modules/delivery-point"
import type { z } from "@medusajs/framework/zod"
import type { PostAdminDeliveryPoint } from "../../validators"

type PostAdminDeliveryPointType = z.infer<typeof PostAdminDeliveryPoint>

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  const point = await deliveryPointService.retrieveDeliveryPoint(id)
  res.json({ delivery_point: point })
}

export async function POST(
  req: MedusaRequest<Partial<PostAdminDeliveryPointType>>,
  res: MedusaResponse
) {
  const { id } = req.params
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  const [point] = await deliveryPointService.updateDeliveryPoints([
    { id, ...req.validatedBody },
  ])
  res.json({ delivery_point: point })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const deliveryPointService = req.scope.resolve(DELIVERY_POINT_MODULE)
  await deliveryPointService.deleteDeliveryPoints([id])
  res.json({ id, deleted: true })
}
