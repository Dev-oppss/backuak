import DeliveryStageModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const DELIVERY_STAGE_MODULE = "deliveryStage"

export default Module(DELIVERY_STAGE_MODULE, {
  service: DeliveryStageModuleService,
})
