import DeliveryPointModule from "../modules/delivery-point"
import OrderModule from "@medusajs/medusa/order"
import { defineLink } from "@medusajs/framework/utils"

/**
 * Un point de livraison dessert plusieurs commandes (isList: true côté
 * commande) : depuis un DeliveryPoint, on récupère la liste des commandes
 * qui l'utilisent ; depuis une Order, on récupère son point de livraison
 * unique — même logique que le lien Product ↔ Brand.
 */
export default defineLink(
  {
    linkable: OrderModule.linkable.order,
    isList: true,
  },
  DeliveryPointModule.linkable.deliveryPoint
)
