import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { issueCode, isEmailVerified } from "../../../../lib/email-verification"

/**
 * GET  /store/customers/email-verification → statut (vérifié ou non)
 * POST /store/customers/email-verification → (ré)envoie un code par email
 * Les deux réservés au client authentifié (voir middlewares.ts).
 */
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const verified = await isEmailVerified(req.scope, customerId)
  res.json({ verified })
}

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const result = await issueCode(req.scope, customerId)

  if (!result.ok) {
    if (result.reason === "cooldown") {
      res.status(429).json({
        message: `Patiente ${result.retryIn}s avant de redemander un code.`,
        retry_in: result.retryIn,
      })
      return
    }
    res.status(404).json({ message: "Compte introuvable." })
    return
  }

  res.json({
    sent: true,
    already_verified: result.alreadyVerified ?? false,
  })
}
