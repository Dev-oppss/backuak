import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { checkCode } from "../../../../../lib/email-verification"
import type { PostVerifyCode } from "../validators"

type Body = z.infer<typeof PostVerifyCode>

/** POST /store/customers/email-verification/confirm — body: { code } */
export async function POST(req: AuthenticatedMedusaRequest<Body>, res: MedusaResponse) {
  const customerId = req.auth_context.actor_id
  const result = await checkCode(req.scope, customerId, req.validatedBody.code)

  if (result.ok) {
    res.json({ verified: true })
    return
  }

  const messages: Record<string, string> = {
    no_code: "Demande d'abord un code.",
    expired: "Ce code a expiré, redemandes-en un.",
    too_many: "Trop d'essais. Redemande un nouveau code.",
  }
  if (result.reason === "wrong") {
    res.status(400).json({
      message: `Code incorrect (${result.remaining} essai${result.remaining > 1 ? "s" : ""} restant${result.remaining > 1 ? "s" : ""}).`,
    })
    return
  }
  res.status(400).json({ message: messages[result.reason] })
}
