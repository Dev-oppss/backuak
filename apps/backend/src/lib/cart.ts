import { sdk, getRegionId } from "./medusa"

const CART_ID_KEY = "kuakumarket_cart_id"

/**
 * Aide minimale pour que le bouton "Ajouter au panier" de la fiche produit
 * fasse quelque chose de réel dès l'Étape 1, sans construire toute la page
 * panier/tunnel de commande — ça, c'est le périmètre de l'Étape 2.
 */
export async function getOrCreateCart() {
  if (typeof window === "undefined") return null
  const existingId = window.localStorage.getItem(CART_ID_KEY)

  if (existingId) {
    try {
      const { cart } = await sdk.store.cart.retrieve(existingId)
      return cart
    } catch {
      window.localStorage.removeItem(CART_ID_KEY)
    }
  }

  const region_id = await getRegionId()
  const { cart } = await sdk.store.cart.create({ region_id })
  window.localStorage.setItem(CART_ID_KEY, cart.id)
  return cart
}

/**
 * Contrairement à getOrCreateCart, ne crée rien : sert à afficher la page
 * panier, où un panier vide (jamais créé) doit rester un vrai état "vide",
 * pas déclencher la création d'un panier pour rien.
 */
export async function getCart() {
  if (typeof window === "undefined") return null
  const existingId = window.localStorage.getItem(CART_ID_KEY)
  if (!existingId) return null

  try {
    const { cart } = await sdk.store.cart.retrieve(existingId)
    return cart
  } catch {
    window.localStorage.removeItem(CART_ID_KEY)
    return null
  }
}

export async function addToCart(variantId: string, quantity: number) {
  const cart = await getOrCreateCart()
  if (!cart) throw new Error("Impossible de créer le panier")

  await sdk.store.cart.createLineItem(cart.id, {
    variant_id: variantId,
    quantity,
  })
}

export async function updateLineItemQuantity(
  cartId: string,
  lineItemId: string,
  quantity: number
) {
  await sdk.store.cart.updateLineItem(cartId, lineItemId, { quantity })
}

export async function removeLineItem(cartId: string, lineItemId: string) {
  await sdk.store.cart.deleteLineItem(cartId, lineItemId)
}

/**
 * Étape "Infos" du tunnel : email + adresse minimale + point de livraison
 * choisi (stocké en metadata, lu par le subscriber order-placed côté
 * backend pour rattacher le bon delivery_point à la commande créée).
 */
export async function updateCartCheckoutInfo(
  cartId: string,
  data: {
    email: string
    first_name: string
    last_name: string
    phone: string
    address_1: string
    city: string
    delivery_point_id?: string
    country_code: string
  }
) {
  const { cart } = await sdk.store.cart.update(cartId, {
    email: data.email,
    shipping_address: {
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      address_1: data.address_1,
      city: data.city,
      country_code: data.country_code,
    },
    // Sans point de livraison (lancement : l'adresse saisie suffit), on ne touche pas aux métadonnées.
    ...(data.delivery_point_id ? { metadata: { delivery_point_id: data.delivery_point_id } } : {}),
  })
  return cart
}

/**
 * Options d'expédition Medusa disponibles pour ce panier — distinctes des
 * "points de livraison" custom (qui ne servent qu'à choisir une zone et
 * afficher des frais) : Medusa exige toujours au moins une méthode
 * d'expédition (Settings → Shipping, à configurer sur la région "Afrique"
 * dans l'admin) pour pouvoir finaliser une commande.
 */
export async function listShippingOptions(cartId: string) {
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  })
  return shipping_options
}

export async function addShippingMethod(cartId: string, optionId: string) {
  const { cart } = await sdk.store.cart.addShippingMethod(cartId, {
    option_id: optionId,
  })
  return cart
}

/**
 * Paiement "manuel" (à la livraison / en boutique) — utilise le provider
 * système de Medusa (pp_system_default), qui ne fait aucun appel externe
 * et pose juste un statut "en attente de capture", conforme au point 6 de
 * la spec. `method` est stocké en metadata pour que l'admin sache lequel
 * des deux la cliente a choisi.
 *
 * CinetPay/PayDunya (paiement en ligne réel) ne sont pas branchés : ça
 * demande un module provider dédié avec de vraies clés API, hors
 * périmètre tant que ces identifiants ne sont pas fournis.
 */
export async function initiateManualPayment(
  cartId: string,
  method: "cash_on_delivery" | "in_store"
) {
  const { cart } = await sdk.store.cart.update(cartId, {
    metadata: { payment_method: method },
  })
  await sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_system_default",
  })
}

/**
 * Finalise la commande. En cas d'erreur métier (stock insuffisant, panier
 * invalide…), Medusa renvoie { type: "cart", error } plutôt que de lever
 * une exception — donc bien vérifier `type` avant de considérer que la
 * commande est passée.
 */
export async function completeCart(cartId: string) {
  const result = await sdk.store.cart.complete(cartId)
  if (result.type === "order") {
    window.localStorage.removeItem(CART_ID_KEY)
    return { order: result.order, error: null }
  }
  return { order: null, error: result.error?.message ?? "Impossible de finaliser la commande." }
}
