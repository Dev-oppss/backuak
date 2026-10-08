import {
  defineMiddlewares,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http"
import { PostAdminBeautyAttributes } from "./admin/products/[id]/beauty-attributes/validators"
import { PostAdminDeliveryStage, PostAdminDeliveryPoint } from "./admin/validators"
import { PostAdminBrand, PostAdminProductBrand } from "./admin/brand-validators"
import { PostStoreReview } from "./store/reviews/validators"
import { PostAdminReview } from "./admin/reviews/validators"
import { PostSiteEvent } from "./store/site-events/validators"
import { PostAdminSiteSettings } from "./admin/site-settings/validators"
import { PostVerifyCode } from "./store/customers/email-verification/validators"
import { validateRegisterEmail } from "../lib/validate-register-email"
import { PostAdminHomepage } from "./admin/homepage/validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/products/:id/beauty-attributes",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminBeautyAttributes)],
    },
    {
      matcher: "/admin/orders/:id/delivery-stage",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminDeliveryStage)],
    },
    {
      matcher: "/admin/delivery-points",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminDeliveryPoint)],
    },
    {
      matcher: "/admin/delivery-points/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminDeliveryPoint)],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminBrand)],
    },
    {
      matcher: "/admin/products/:id/brand",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminProductBrand)],
    },
    {
      matcher: "/store/orders/:id/delivery-stage",
      method: "GET",
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/reviews",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReview),
      ],
    },
    {
      matcher: "/admin/reviews/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminReview)],
    },
    // ---------- Nouveau : fréquentation, réglages, vérification email ----------
    {
      matcher: "/store/site-events",
      method: "POST",
      middlewares: [validateAndTransformBody(PostSiteEvent)],
    },
    {
      matcher: "/admin/site-settings",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminSiteSettings)],
    },
    {
      // Intercepte la création de compte NATIVE de Medusa (fournie par le
      // coeur, pas par nous) pour rejeter les emails manifestement faux
      // avant que le compte ne soit créé.
      matcher: "/store/customers",
      method: "POST",
      middlewares: [validateRegisterEmail],
    },
    {
      matcher: "/store/customers/email-verification",
      method: ["GET", "POST"],
      middlewares: [authenticate("customer", ["session", "bearer"])],
    },
    {
      matcher: "/store/customers/email-verification/confirm",
      method: "POST",
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostVerifyCode),
      ],
    },
    {
      matcher: "/admin/homepage",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminHomepage)],
    },
  ],
})
