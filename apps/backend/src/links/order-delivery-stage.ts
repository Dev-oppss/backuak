import DeliveryStageModule from "../modules/delivery-stage"
import OrderModule from "@medusajs/medusa/order"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Lien 1-1 : on étend la commande avec son statut de livraison détaillé,
 * même principe que l'extension du produit avec les attributs beauté.
 */
export default defineLink(
  OrderModule.linkable.order,
  DeliveryStageModule.linkable.deliveryStage
)
