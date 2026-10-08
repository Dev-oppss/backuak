import { model } from "@medusajs/framework/utils"

/**
 * Évènement de fréquentation du site (visites, pages vues, clics),
 * enregistré directement dans la base de Medusa — aucun outil externe.
 * Aucune donnée personnelle : pas d'IP, pas de nom, pas d'email ;
 * `visitor_id` est un identifiant aléatoire anonyme généré par le
 * navigateur du visiteur.
 *
 * `day` (AAAA-MM-JJ, heure du Cameroun) est stocké à part pour que les
 * statistiques par jour/mois restent rapides sans calcul de fuseau.
 */
const SiteEvent = model
  .define("site_event", {
    id: model.id().primaryKey(),
    type: model.enum([
      "page_view",
      "product_view",
      "product_click",
      "add_to_cart",
      "link_click",
    ]),
    path: model.text(),
    target: model.text().nullable(),
    product_id: model.text().nullable(),
    visitor_id: model.text(),
    day: model.text(),
  })
  .indexes([{ on: ["type", "day"] }])

export default SiteEvent
