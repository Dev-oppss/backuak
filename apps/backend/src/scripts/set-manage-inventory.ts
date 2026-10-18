import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Active ou désactive le suivi de stock ("Manage inventory") sur TOUTES les
 * variantes de produits, en une seule fois.
 *
 *   npx medusa exec ./src/scripts/set-manage-inventory.ts          -> désactive (false)
 *   npx medusa exec ./src/scripts/set-manage-inventory.ts true     -> réactive
 *
 * Désactivé : on peut ajouter au panier sans lieu de stock ni quantité.
 * Sans effet sur les variantes déjà dans l'état demandé (script rejouable).
 */
export default async function setManageInventory({ container, args }: ExecArgs) {
  const target = (args?.[0] ?? "false").toLowerCase() === "true"
  const logger = container.resolve("logger")
  const productService = container.resolve(Modules.PRODUCT)

  const variants = await productService.listProductVariants(
    {},
    { select: ["id", "manage_inventory"], take: null }
  )
  const toChange = variants.filter((v) => v.manage_inventory !== target).map((v) => v.id)

  logger.info(
    `${variants.length} variante(s) au total, ${toChange.length} à passer à manage_inventory=${target}.`
  )

  const BATCH = 100
  for (let i = 0; i < toChange.length; i += BATCH) {
    const ids = toChange.slice(i, i + BATCH)
    await productService.updateProductVariants({ id: ids }, { manage_inventory: target })
    logger.info(`  ${Math.min(i + BATCH, toChange.length)} / ${toChange.length}`)
  }

  logger.info("Terminé.")
}
