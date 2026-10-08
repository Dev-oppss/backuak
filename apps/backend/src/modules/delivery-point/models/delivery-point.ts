import { model } from "@medusajs/framework/utils"

/**
 * Un point/zone de livraison (ex. "Akwa, Douala"), sélectionné par la
 * cliente à la commande (point 7 du cahier des charges). Module autonome,
 * pas les Stock Locations de Medusa (trop liées à la gestion d'inventaire
 * physique pour ce qu'on veut faire ici).
 */
const DeliveryPoint = model.define("delivery_point", {
  id: model.id().primaryKey(),
  name: model.text().searchable(),
  city: model.text(),
  fee: model.number(),
  estimated_delay: model.text().nullable(),
  active: model.boolean().default(true),
})

export default DeliveryPoint
