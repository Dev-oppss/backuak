import { MedusaService } from "@medusajs/framework/utils"
import SiteEvent from "./models/site-event"

class SiteAnalyticsModuleService extends MedusaService({ SiteEvent }) {}

export default SiteAnalyticsModuleService
