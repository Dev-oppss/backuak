import { model } from "@medusajs/framework/utils"

/**
 * Pipeline de statuts détaillé demandé par la propriétaire, plus fin que ce
 * que Medusa gère nativement (payment_status / fulfillment_status).
 * Lié 1-1 à la commande (voir src/links/order-delivery-stage.ts), sur le
 * même principe que l'extension du produit avec les attributs beauté.
 */
const DeliveryStage = model.define("delivery_stage", {
  id: model.id().primaryKey(),

  stage: model
    .enum([
      "nouvelle",
      "confirmee",
      "preparation",
      "expedition",
      "livree",
      "annulee",
      "echec",
      "retour",
    ])
    .default("nouvelle"),

  // Court commentaire libre, ex. motif d'annulation ou note de préparation.
  note: model.text().nullable(),
})

export default DeliveryStage
