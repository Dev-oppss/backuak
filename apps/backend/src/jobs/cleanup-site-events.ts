import type { MedusaContainer } from "@medusajs/framework/types"
import { SITE_ANALYTICS_MODULE } from "../modules/site-analytics"

/**
 * Purge quotidienne des évènements de fréquentation de plus de 90 jours —
 * évite que la table grossisse indéfiniment sur un hébergement à
 * ressources limitées. Les totaux par jour/mois déjà affichés dans les
 * statistiques ne sont pas affectés : seuls les évènements bruts très
 * anciens sont supprimés, pas les commandes ni aucune autre donnée.
 */
export default async function cleanupSiteEventsJob(container: MedusaContainer) {
  const service: any = container.resolve(SITE_ANALYTICS_MODULE)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)
  const cutoffDay = cutoff.toISOString().slice(0, 10)

  const [old] = await service.listAndCountSiteEvents(
    { day: { $lt: cutoffDay } },
    { take: 5000, select: ["id"] }
  )
  if (old.length > 0) {
    await service.deleteSiteEvents(old.map((e: any) => e.id))
  }
}

export const config = {
  name: "cleanup-site-events",
  schedule: "0 3 * * *", // tous les jours à 3h du matin
}
