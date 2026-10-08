import SiteAnalyticsModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const SITE_ANALYTICS_MODULE = "siteAnalytics"

export default Module(SITE_ANALYTICS_MODULE, {
  service: SiteAnalyticsModuleService,
})
