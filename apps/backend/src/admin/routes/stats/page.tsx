import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Tableau de bord statistiques — ventes (données réelles Medusa) ET
 * fréquentation (visites, pages vues, clics — table site_event, voir
 * /store/site-events côté front). La route /admin/stats renvoie déjà les
 * deux depuis le patch "tout dans Medusa" ; cet écran manquait juste
 * l'affichage de la partie fréquentation jusqu'ici.
 */
type Stats = {
  totals: { orders: number; revenue: number; customers: number }
  orders_by_day: Record<string, number>
  orders_by_month: Record<string, number>
  top_products: { id: string; title: string; units: number }[]
  least_popular_products: { id: string; title: string; units: number }[]
  top_customers: { email: string; orders: number; spent: number }[]
  top_brands: { name: string; units: number }[]
  top_categories: { name: string; units: number }[]
  best_rated: { id: string; title: string; average: number; count: number }[]
  worst_rated: { id: string; title: string; average: number; count: number }[]
  traffic?: {
    visits_by_day: Record<string, number>
    visits_by_month: Record<string, number>
    total_page_views: number
    total_add_to_cart: number
    top_pages: { path: string; views: number }[]
    top_clicked_products: { title: string; clicks: number }[]
  }
}

const fmt = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`

const StatsPage = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/admin/stats", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => setError(true))
  }, [])

  if (error) return <Container><Text>Impossible de charger les statistiques.</Text></Container>
  if (!stats) return <Container><Text>Chargement…</Text></Container>

  const days = Object.entries(stats.orders_by_day).sort().slice(-14)
  const months = Object.entries(stats.orders_by_month).sort().slice(-12)
  const t = stats.traffic
  const visitDays = t ? Object.entries(t.visits_by_day).sort().slice(-14) : []
  const visitMonths = t ? Object.entries(t.visits_by_month).sort().slice(-12) : []

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <Heading className="mb-4">Vue d'ensemble — ventes</Heading>
        <div className="grid grid-cols-3 gap-4">
          <Kpi label="Commandes" value={String(stats.totals.orders)} />
          <Kpi label="Chiffre d'affaires" value={fmt(stats.totals.revenue)} />
          <Kpi label="Clients ayant commandé" value={String(stats.totals.customers)} />
        </div>
      </Container>

      {t && (
        <Container>
          <Heading className="mb-4">Vue d'ensemble — fréquentation du site</Heading>
          <div className="grid grid-cols-2 gap-4">
            <Kpi label="Pages vues (total)" value={String(t.total_page_views)} />
            <Kpi label="Ajouts au panier (total)" value={String(t.total_add_to_cart)} />
          </div>
          <Text size="small" className="mt-3 text-ui-fg-subtle">
            Les visites comptent un visiteur une seule fois par jour ou par mois (pas chaque page vue).
            Les données de plus de 90 jours sont purgées automatiquement chaque nuit.
          </Text>
        </Container>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Panel title="Commandes par jour (14 derniers jours actifs)" rows={days.map(([d, n]) => [d, String(n)])} head={["Jour", "Commandes"]} />
        <Panel title="Commandes par mois" rows={months.map(([m, n]) => [m, String(n)])} head={["Mois", "Commandes"]} />

        {t && (
          <>
            <Panel title="Visiteurs par jour (14 derniers jours actifs)" rows={visitDays.map(([d, n]) => [d, String(n)])} head={["Jour", "Visiteurs uniques"]} />
            <Panel title="Visiteurs par mois" rows={visitMonths.map(([m, n]) => [m, String(n)])} head={["Mois", "Visiteurs uniques"]} />
            <Panel title="Pages les plus vues" rows={t.top_pages.map((p) => [p.path, String(p.views)])} head={["Page", "Vues"]} />
            <Panel title="Produits les plus cliqués" rows={t.top_clicked_products.map((p) => [p.title, String(p.clicks)])} head={["Produit", "Clics"]} />
          </>
        )}

        <Panel title="Produits les plus commandés" rows={stats.top_products.map((p) => [p.title, String(p.units)])} head={["Produit", "Unités"]} />
        <Panel title="Produits les moins populaires" rows={stats.least_popular_products.map((p) => [p.title, String(p.units)])} head={["Produit", "Unités"]} />
        <Panel title="Meilleurs clients" rows={stats.top_customers.map((c) => [c.email, `${c.orders} cmd · ${fmt(c.spent)}`])} head={["Client", "Achats"]} />
        <Panel title="Marques les plus achetées" rows={stats.top_brands.map((b) => [b.name, String(b.units)])} head={["Marque", "Unités"]} />
        <Panel title="Catégories les plus achetées" rows={stats.top_categories.map((c) => [c.name, String(c.units)])} head={["Catégorie", "Unités"]} />
        <Panel title="Produits les mieux notés" rows={stats.best_rated.map((p) => [p.title, `${p.average.toFixed(1)} ★ (${p.count})`])} head={["Produit", "Note"]} />
        <Panel title="Produits les moins bien notés" rows={stats.worst_rated.map((p) => [p.title, `${p.average.toFixed(1)} ★ (${p.count})`])} head={["Produit", "Note"]} />
      </div>
    </div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Text size="small" className="text-ui-fg-subtle">{label}</Text>
      <Heading level="h2">{value}</Heading>
    </div>
  )
}

function Panel({ title, head, rows }: { title: string; head: [string, string]; rows: string[][] }) {
  return (
    <Container className="p-0">
      <div className="px-6 py-4"><Heading level="h2">{title}</Heading></div>
      <div className="px-6 pb-4">
        {rows.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">Pas encore de données.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{head[0]}</Table.HeaderCell>
                <Table.HeaderCell className="text-right">{head[1]}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {rows.map(([a, b], i) => (
                <Table.Row key={i}>
                  <Table.Cell>{a}</Table.Cell>
                  <Table.Cell className="text-right">{b}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Statistiques", icon: ChartBar })
export default StatsPage
