import { model } from "@medusajs/framework/utils"

/**
 * Une marque (ex. "The Ordinary", "Nivea").
 * Séparée du produit pour pouvoir filtrer/naviguer par marque,
 * comme demandé dans le cahier des charges (point 8 : navigation par marques).
 */
const Brand = model.define("brand", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
})

export default Brand
