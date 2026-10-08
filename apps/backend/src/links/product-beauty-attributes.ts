import BeautyAttributesModule from "../modules/beauty-attributes"
import ProductModule from "@medusajs/medusa/product"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Lien 1-1 : on étend le produit avec ses attributs beauté, exactement
 * comme l'exemple officiel "Subtitle" de la doc Medusa (lien du modèle
 * principal vers un modèle custom pour l'enrichir).
 */
export default defineLink(
  ProductModule.linkable.product,
  BeautyAttributesModule.linkable.beautyAttributes
)
