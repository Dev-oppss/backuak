import ReviewModule from "../modules/review"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Un produit a plusieurs avis (isList: true côté avis, symétrique de
 * product-brand.ts où c'est côté produit) : depuis un Product, on
 * récupère la liste de ses avis ; depuis un Review, on récupère son
 * produit unique.
 */
export default defineLink(
  ProductModule.linkable.product,
  {
    linkable: ReviewModule.linkable.review,
    isList: true,
  }
)
