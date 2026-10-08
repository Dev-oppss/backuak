import { MedusaService } from "@medusajs/framework/utils"
import HomepageContent from "./models/homepage-content"

class HomepageModuleService extends MedusaService({ HomepageContent }) {}

export default HomepageModuleService
