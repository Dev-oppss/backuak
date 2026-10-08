import { model } from "@medusajs/framework/utils"

/**
 * Contenu éditorial de la page d'accueil. `promo_slides` remplace l'ancien
 * `promo_banner` (un seul objet) par un TABLEAU de promos — chaque entrée
 * peut être soit une bannière texte+fond (title/text/cta/tone), soit une
 * affiche pure (mode "poster", juste une image cliquable), exactement le
 * fonctionnement déjà en place dans PromoBanner.tsx avant ce patch.
 */
const HomepageContent = model.define("homepage_content", {
  id: model.id().primaryKey(),
  hero_slides: model.json().nullable(),
  promo_slides: model.json().nullable(),
  featured_product_ids: model.json().nullable(),
})

export default HomepageContent
