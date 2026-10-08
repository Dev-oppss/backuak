import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../../modules/review"
import type { z } from "@medusajs/framework/zod"
import type { PostAdminReview } from "../validators"

type PostAdminReviewType = z.infer<typeof PostAdminReview>

/**
 * POST /admin/reviews/:id
 * Body : { status: "published" | "removed" }
 *
 * Deux usages légitimes seulement :
 * - publier un avis "flagged" une fois vérifié qu'il n'est pas du spam
 * - retirer un avis "published" suite à un signalement fondé (contenu
 *   choquant, coordonnées, etc. — jamais parce que la note est basse)
 */
export async function POST(
  req: MedusaRequest<PostAdminReviewType>,
  res: MedusaResponse
) {
  const { id } = req.params
  const reviewService = req.scope.resolve(REVIEW_MODULE)

  const [updated] = await reviewService.updateReviews([
    { id, status: req.validatedBody.status },
  ])

  res.json({ review: updated })
}
