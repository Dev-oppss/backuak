import BeautyAttributesModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const BEAUTY_ATTRIBUTES_MODULE = "beautyAttributes"

export default Module(BEAUTY_ATTRIBUTES_MODULE, {
  service: BeautyAttributesModuleService,
})
