import { model } from "@medusajs/framework/utils"

/**
 * Avis client (Étape 4 de la spec) — modèle "publication auto, modération
 * réactive", comme Amazon et Google Play : un avis d'achat vérifié part
 * en ligne immédiatement, sans validation manuelle systématique. Faire
 * valider chaque avis un par un donnerait à la propriétaire le pouvoir de
 * n'afficher que les avis favorables, ce qui casse la confiance que les
 * avis sont censés apporter — et c'est justement ce qu'Amazon interdit
 * explicitement à ses vendeurs.
 *
 * `status` :
 * - "published"  → visible immédiatement (cas normal, immense majorité)
 * - "flagged"    → le filtre anti-spam automatique a détecté quelque
 *                  chose de suspect (lien, spam, contenu quasi vide...) ;
 *                  reste invisible jusqu'à un examen manuel
 * - "removed"    → retiré a posteriori (signalement, violation constatée
 *                  après coup) — jamais utilisé juste parce que la note
 *                  est basse
 *
 * `verified_purchase` : calculé côté serveur, condition obligatoire pour
 * pouvoir déposer un avis du tout (voir route POST) — pas juste un badge
 * décoratif comme chez Amazon (qui autorise aussi les avis non vérifiés).
 */
const Review = model.define("review", {
  id: model.id().primaryKey(),

  customer_id: model.text(),
  customer_name: model.text(),

  rating: model.number(),
  comment: model.text().nullable(),

  status: model
    .enum(["published", "flagged", "removed"])
    .default("published"),
  verified_purchase: model.boolean().default(true),
})

export default Review
