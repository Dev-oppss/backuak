import BrandModule from "../modules/brand"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Une marque a plusieurs produits (isList: true côté produit) : depuis un
 * Brand, on récupère la liste de ses produits ; depuis un Product, on
 * récupère sa marque unique.
 */
export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  BrandModule.linkable.brand
)
