import { MedusaService } from "@medusajs/framework/utils"
import DeliveryStage from "./models/delivery-stage"

class DeliveryStageModuleService extends MedusaService({
  DeliveryStage,
}) {}

export default DeliveryStageModuleService
