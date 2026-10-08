import { MedusaService } from "@medusajs/framework/utils"
import Review from "./models/review"

/**
 * Génère createReviews, updateReviews, retrieveReview, listReviews,
 * deleteReviews...
 */
class ReviewModuleService extends MedusaService({
  Review,
}) {}

export default ReviewModuleService
