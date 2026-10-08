import type { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { checkEmail } from "./email-check"

/**
 * Ce fichier ne redéfinit PAS la route native /store/customers (déjà
 * fournie par Medusa) : il l'intercepte juste en middleware pour rejeter
 * les adresses manifestement fausses (j@k.com, domaines jetables, fautes
 * de frappe) avant que Medusa ne crée le compte. Voir middlewares.ts —
 * c'est là que ce fichier est branché, pas ici.
 *
 * Séparé en middleware plutôt qu'en route POST complète : Medusa gère
 * déjà toute la logique de création de compte (auth, identités liées,
 * etc.), inutile et risqué de la dupliquer.
 */
export async function validateRegisterEmail(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const email = (req.body as any)?.email
  const result = await checkEmail(email)
  if (!result.ok) {
    res.status(400).json({ message: result.message })
    return
  }
  next()
}
