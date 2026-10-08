import { MedusaService } from "@medusajs/framework/utils"
import DeliveryPoint from "./models/delivery-point"

/**
 * Génère createDeliveryPoints, listDeliveryPoints, updateDeliveryPoints,
 * deleteDeliveryPoints, retrieveDeliveryPoint...
 */
class DeliveryPointModuleService extends MedusaService({
  DeliveryPoint,
}) {}

export default DeliveryPointModuleService
