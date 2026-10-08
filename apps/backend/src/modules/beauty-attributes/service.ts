import { MedusaService } from "@medusajs/framework/utils"
import BeautyAttributes from "./models/beauty-attributes"

/**
 * Génère createBeautyAttributes, updateBeautyAttributes,
 * retrieveBeautyAttributes, listBeautyAttributes, deleteBeautyAttributes...
 */
class BeautyAttributesModuleService extends MedusaService({
  BeautyAttributes,
}) {}

export default BeautyAttributesModuleService
