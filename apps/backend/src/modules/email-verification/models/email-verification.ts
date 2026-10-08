import { model } from "@medusajs/framework/utils"

/**
 * Vérification de l'adresse email d'un compte client par code à 6 chiffres.
 * Stocké dans un module à part (et NON dans customer.metadata) : une
 * cliente peut modifier ses propres metadata via l'API publique, elle
 * aurait donc pu se déclarer "vérifiée" elle-même.
 *
 * Le code n'est jamais stocké en clair, seulement son empreinte (hash).
 * `email` mémorise l'adresse vérifiée : si la cliente change d'email plus
 * tard, elle doit re-vérifier.
 */
const EmailVerification = model.define("email_verification", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  email: model.text(),
  code_hash: model.text().nullable(),
  expires_at: model.dateTime().nullable(),
  attempts: model.number().default(0),
  last_sent_at: model.dateTime().nullable(),
  verified_at: model.dateTime().nullable(),
})

export default EmailVerification
