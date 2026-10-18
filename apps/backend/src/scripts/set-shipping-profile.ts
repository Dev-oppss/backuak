import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Donne à TOUS les produits le même profil d'expédition que ton option
 * d'expédition. Medusa refuse en effet de finaliser une commande si le profil
 * du produit n'est pas celui de l'option choisie ("The cart items require
 * shipping profiles that are not satisfied by the current shipping methods"),
 * et il ne donne aucun profil aux produits créés sans le préciser (import).
 *
 *   npx medusa exec ./src/scripts/set-shipping-profile.ts         -> relie les produits SANS profil
 *   npx medusa exec ./src/scripts/set-shipping-profile.ts tous    -> relie aussi ceux qui ont un AUTRE profil
 *
 * Profil visé : celui de ton option d'expédition (créée dans Settings →
 * Locations & Shipping). Rejouable sans danger. Ne touche à rien d'autre :
 * ni prix, ni stock, ni commandes.
 */
export default async function setShippingProfile({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const relinkAll = (args?.[0] ?? "").toLowerCase() === "tous"

  // 1. Profil cible = celui de l'option d'expédition.
  const options = await fulfillment.listShippingOptions({}, { select: ["id", "name", "shipping_profile_id"] })
  if (options.length === 0) {
    throw new Error("Aucune option d'expédition : crée-la d'abord dans Settings → Locations & Shipping.")
  }
  const optionProfileIds = [...new Set(options.map((o) => o.shipping_profile_id))]
  const profiles = await fulfillment.listShippingProfiles({})
  const target =
    optionProfileIds.length === 1
      ? optionProfileIds[0]
      : (profiles.find((p) => p.type === "default")?.id ?? optionProfileIds[0])
  const targetName = profiles.find((p) => p.id === target)?.name ?? target
  logger.info(
    `Profil visé : « ${targetName} » (${target}) — utilisé par ${options.filter((o) => o.shipping_profile_id === target).length} option(s) d'expédition.`
  )
  if (optionProfileIds.length > 1) {
    logger.warn("Tes options d'expédition utilisent plusieurs profils : le profil « default » a été choisi.")
  }

  // 2. Produits à relier.
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "shipping_profile.id"],
    pagination: { take: 20000 },
  })
  const noProfile = products.filter((p: any) => !p.shipping_profile?.id)
  const otherProfile = products.filter((p: any) => p.shipping_profile?.id && p.shipping_profile.id !== target)
  logger.info(
    `${products.length} produit(s) : ${noProfile.length} sans profil, ${otherProfile.length} avec un autre profil, ${products.length - noProfile.length - otherProfile.length} déjà bon.`
  )
  const toChange = [...noProfile, ...(relinkAll ? otherProfile : [])].map((p: any) => p.id as string)
  if (!relinkAll && otherProfile.length > 0) {
    logger.warn(`${otherProfile.length} produit(s) ont un autre profil : relance avec l'argument « tous » pour les changer aussi.`)
  }

  // 3. Mise à jour par lots (Medusa crée / remplace le lien produit ↔ profil).
  const BATCH = 50
  for (let i = 0; i < toChange.length; i += BATCH) {
    const ids = toChange.slice(i, i + BATCH)
    await updateProductsWorkflow(container).run({
      input: { selector: { id: ids }, update: { shipping_profile_id: target } },
    })
    logger.info(`  ${Math.min(i + BATCH, toChange.length)} / ${toChange.length}`)
  }
  logger.info("Terminé.")
}
