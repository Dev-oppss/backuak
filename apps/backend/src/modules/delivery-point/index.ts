import DeliveryPointModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const DELIVERY_POINT_MODULE = "deliveryPoint"

export default Module(DELIVERY_POINT_MODULE, {
  service: DeliveryPointModuleService,
})
