import { MedusaService } from "@medusajs/framework/utils"
import Brand from "./models/brand"

/**
 * MedusaService génère automatiquement les méthodes CRUD :
 * createBrands, listBrands, updateBrands, deleteBrands, retrieveBrand, etc.
 */
class BrandModuleService extends MedusaService({
  Brand,
}) {}

export default BrandModuleService
