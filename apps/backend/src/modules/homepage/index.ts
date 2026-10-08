import HomepageModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const HOMEPAGE_MODULE = "homepage"

export default Module(HOMEPAGE_MODULE, {
  service: HomepageModuleService,
})
