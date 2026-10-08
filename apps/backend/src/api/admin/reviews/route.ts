import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"

/**
 * GET /admin/reviews?status=flagged
 * File de modération réactive — la vraie file de travail au quotidien est
 * `?status=flagged` (les avis mis de côté par le filtre anti-spam, en
 * attente d'un examen). Sans paramètre, renvoie tout (utile pour retirer
 * un avis "published" a posteriori suite à un signalement).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { status } = req.query as { status?: string }
  const reviewService = req.scope.resolve(REVIEW_MODULE)

  const reviews = await reviewService.listReviews(
    status ? { status } : {},
    { order: { created_at: "DESC" } }
  )

  res.json({ reviews })
}
