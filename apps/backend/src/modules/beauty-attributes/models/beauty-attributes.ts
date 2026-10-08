import { model } from "@medusajs/framework/utils"

/**
 * Champs structurés spécifiques à la beauté, demandés dans le cahier des
 * charges (points 2 et 3) : zone d'application, moment d'utilisation, mode
 * d'utilisation, compatibilités, précautions.
 *
 * Ce modèle est lié 1-1 au produit via un module link (voir
 * src/links/product-beauty-attributes.ts) plutôt que d'ajouter ces champs
 * directement sur le modèle Product natif de Medusa — on garde le module
 * Product intact et on étend ses données proprement.
 *
 * skin_type / application_zone / usage_time sont des listes (une cliente peut
 * filtrer par plusieurs valeurs à la fois), usage_mode est un choix unique.
 *
 * compatible_with_ids / incompatible_with_ids stockent des IDs de produits
 * Medusa sous forme de tableau plutôt qu'une vraie relation many-to-many,
 * pour rester simple à ce stade — un produit ne référence jamais des
 * dizaines de produits compatibles. À revoir si ce nombre grandit beaucoup.
 */
const BeautyAttributes = model.define("beauty_attributes", {
  id: model.id().primaryKey(),

  skin_type: model.array().nullable(),
  application_zone: model.array().nullable(),
  usage_time: model.array().nullable(),

  usage_mode: model
    .enum([
      "application_directe",
      "dilution",
      "melange",
      "apres_un_autre_produit",
      "seul",
    ])
    .nullable(),

  compatible_with_ids: model.array().nullable(),
  incompatible_with_ids: model.array().nullable(),

  precautions: model.text().nullable(),
  side_effects: model.text().nullable(),
  ingredients: model.text().nullable(),
  net_content: model.text().nullable(),
})

export default BeautyAttributes
