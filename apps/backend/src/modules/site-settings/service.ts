import { MedusaService } from "@medusajs/framework/utils"
import SiteSetting from "./models/site-setting"

class SiteSettingsModuleService extends MedusaService({ SiteSetting }) {}

export default SiteSettingsModuleService
