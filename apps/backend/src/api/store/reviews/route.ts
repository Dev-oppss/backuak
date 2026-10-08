import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEW_MODULE } from "../../../modules/review"
import { shouldFlagReview } from "../../../modules/review/spam-filter"
import type { z } from "@medusajs/framework/zod"
import type { PostStoreReview } from "./validators"

type PostStoreReviewType = z.infer<typeof PostStoreReview>

/**
 * GET /store/reviews?product_id=...
 * Route PUBLIQUE — ne renvoie que les avis "published" (jamais "flagged"
 * ni "removed"), avec la moyenne et le total.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.query as { product_id?: string }
  if (!product_id) {
    res.status(400).json({ message: "product_id est requis." })
    return
  }

  const query = req.scope.resolve("query")
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "reviews.*"],
    filters: { id: product_id },
  })

  const reviews = (data[0]?.reviews ?? []).filter(
    (r: any) => r.status === "published"
  )
  const average =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) /
        reviews.length
      : 0

  res.json({
    reviews: reviews.map((r: any) => ({
      id: r.id,
      customer_name: r.customer_name,
      rating: r.rating,
      comment: r.comment,
      verified_purchase: r.verified_purchase,
      created_at: r.created_at,
    })),
    average: Math.round(average * 10) / 10,
    count: reviews.length,
  })
}

/**
 * POST /store/reviews
 * Réservé au client authentifié (voir middlewares.ts).
 *
 * Modèle "publication auto, modération réactive" — comme Amazon/Google
 * Play : un avis part en ligne immédiatement, sans validation manuelle
 * systématique. Seuls deux garde-fous automatiques s'appliquent :
 * - achat vérifié obligatoire pour pouvoir déposer un avis
 * - filtre anti-spam structurel (liens, coordonnées, spam évident) qui
 *   met l'avis en file de modération au lieu de le publier directement
 *
 * Un même client ne peut avoir qu'un avis par produit : une nouvelle
 * soumission met à jour l'avis existant plutôt que d'en créer un
 * doublon (comme Amazon, qui permet de modifier son avis).
 */
export async function POST(
  req: MedusaRequest<PostStoreReviewType>,
  res: MedusaResponse
) {
  const customerId = (req.auth_context as any)?.actor_id
  const query = req.scope.resolve("query")

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name", "email"],
    filters: { id: customerId },
  })
  const customer = customers[0]
  if (!customer) {
    res.status(401).json({ message: "Non authentifié." })
    return
  }

  // Achat vérifié obligatoire : sans commande contenant ce produit, pas
  // d'avis possible du tout — condition plus stricte qu'Amazon (qui
  // autorise les avis non vérifiés), adaptée à une boutique mono-vendeur
  // où la seule vraie protection anti-faux-avis est l'achat réel.
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "items.product_id"],
    filters: { customer_id: customerId },
  })
  const verifiedPurchase = orders.some((o: any) =>
    (o.items ?? []).some((i: any) => i.product_id === req.validatedBody.product_id)
  )
  if (!verifiedPurchase) {
    res.status(403).json({
      message: "Seules les clientes ayant acheté ce produit peuvent laisser un avis.",
    })
    return
  }

  const reviewService = req.scope.resolve(REVIEW_MODULE)

  // Un avis existant pour ce produit par cette cliente ? On le met à
  // jour plutôt que d'en créer un second.
  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["id", "reviews.id", "reviews.customer_id"],
    filters: { id: req.validatedBody.product_id },
  })
  const existingReview = (existing[0]?.reviews ?? []).find(
    (r: any) => r.customer_id === customerId
  )

  const { flagged, reason } = shouldFlagReview(req.validatedBody.comment)
  const status = flagged ? "flagged" : "published"

  if (existingReview) {
    const [updated] = await reviewService.updateReviews([
      {
        id: existingReview.id,
        rating: req.validatedBody.rating,
        comment: req.validatedBody.comment ?? null,
        status,
      },
    ])
    res.json({
      review: { id: updated.id, status: updated.status },
      message: flagged
        ? "Avis enregistré — en cours de vérification avant publication."
        : "Avis mis à jour.",
    })
    return
  }

  const [review] = await reviewService.createReviews([
    {
      customer_id: customerId,
      customer_name:
        [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
        customer.email,
      rating: req.validatedBody.rating,
      comment: req.validatedBody.comment ?? null,
      status,
      verified_purchase: true,
    },
  ])

  const link = req.scope.resolve("link")
  await link.create({
    product: { product_id: req.validatedBody.product_id },
    [REVIEW_MODULE]: { review_id: review.id },
  })

  res.status(201).json({
    review: { id: review.id, status: review.status },
    message: flagged
      ? "Avis enregistré — en cours de vérification avant publication."
      : "Merci pour ton avis !",
  })
}
