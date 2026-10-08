import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HOMEPAGE_MODULE } from "../../../modules/homepage"

/**
 * GET /store/homepage — route PUBLIQUE : carrousel principal, TABLEAU de
 * promos (chacune "banner" ou "poster"), et ids "indispensables" choisis
 * à la main. Le front résout ensuite les ids en vraies données produit.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(HOMEPAGE_MODULE)
  const [content] = await service.listHomepageContents({})

  res.json({
    hero_slides: content?.hero_slides ?? [],
    promo_slides: content?.promo_slides ?? [],
    featured_product_ids: content?.featured_product_ids ?? [],
  })
}
