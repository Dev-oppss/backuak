import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Globe } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

/**
 * Statistiques par lieu : d'où viennent les visiteurs (pays, région, ville du
 * Cameroun), où il y a le plus de visites et de clics, et quels produits
 * intéressent le plus dans chaque lieu. Données : /admin/stats/geo.
 */
type Row = {
  key: string
  name: string
  country: string | null
  visitors: number
  page_views: number
  clicks: number
  add_to_cart: number
  orders: number
}
type ProductRow = { id: string; title: string; clicks: number; add_to_cart: number; ordered: number; score: number }
type Level = "country" | "region" | "city"
type GeoStats = {
  days: number
  truncated: boolean
  coverage: { located: number; total: number }
  weights: { click: number; add_to_cart: number; ordered: number }
  levels: Record<Level, Row[]>
  top_products: Record<Level, Record<string, ProductRow[]>>
}

const LEVELS: { id: Level; label: string; head: string }[] = [
  { id: "country", label: "Pays", head: "Pays" },
  { id: "region", label: "Régions", head: "Région" },
  { id: "city", label: "Villes", head: "Ville" },
]
const PERIODS = [7, 30, 90]

const countryName = (code: string | null) => {
  if (!code || code === "??") return "Inconnu"
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}

const GeoStatsPage = () => {
  const [days, setDays] = useState(30)
  const [level, setLevel] = useState<Level>("city")
  const [data, setData] = useState<GeoStats | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    setData(null)
    setError(false)
    fetch(`/admin/stats/geo?days=${days}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true))
  }, [days])

  const rows = data?.levels[level] ?? []
  const current = useMemo(
    () => rows.find((r) => r.key === selected) ?? rows[0] ?? null,
    [rows, selected]
  )
  const products = current && data ? data.top_products[level][current.key] ?? [] : []

  const label = (r: Row) =>
    level === "country"
      ? countryName(r.country)
      : r.country && r.country !== "CM"
        ? `${r.name} (${r.country})`
        : r.name

  if (error) return <Container><Text>Impossible de charger les statistiques par lieu.</Text></Container>

  const pct = data && data.coverage.total > 0 ? Math.round((data.coverage.located / data.coverage.total) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Heading>Statistiques par pays, région et ville</Heading>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <Button key={p} size="small" variant={days === p ? "primary" : "secondary"} onClick={() => setDays(p)}>
                {p} jours
              </Button>
            ))}
          </div>
        </div>
        {data && (
          <Text size="small" className="mt-3 text-ui-fg-subtle">
            {data.coverage.total === 0
              ? "Aucune visite enregistrée sur cette période."
              : `${pct} % des évènements ont un lieu connu (${data.coverage.located} sur ${data.coverage.total}). Les visites d'avant l'activation de la localisation n'ont pas de lieu.`}
            {data.truncated && " La période contient plus de 50 000 évènements : seuls les plus récents sont comptés."}
          </Text>
        )}
        <Text size="small" className="mt-1 text-ui-fg-subtle">
          Le pays est fiable ; la région et la ville sont approximatives (un abonné mobile peut apparaître à Douala ou
          Yaoundé). Les commandes, elles, sont placées selon la ville du point de livraison choisi.
        </Text>
      </Container>

      <div className="flex gap-2">
        {LEVELS.map((l) => (
          <Button
            key={l.id}
            size="small"
            variant={level === l.id ? "primary" : "secondary"}
            onClick={() => {
              setLevel(l.id)
              setSelected(null)
            }}
          >
            {l.label}
          </Button>
        ))}
      </div>

      {!data ? (
        <Container><Text>Chargement…</Text></Container>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Container className="p-0">
            <div className="px-6 py-4">
              <Heading level="h2">Visites et clics par {LEVELS.find((l) => l.id === level)?.head.toLowerCase()}</Heading>
            </div>
            <div className="px-6 pb-4">
              {rows.length === 0 ? (
                <Text size="small" className="text-ui-fg-subtle">Pas encore de données.</Text>
              ) : (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>{LEVELS.find((l) => l.id === level)?.head}</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Visiteurs</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Pages vues</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Clics</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Paniers</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Commandes</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rows.map((r) => (
                      <Table.Row
                        key={r.key}
                        className={`cursor-pointer ${current?.key === r.key ? "bg-ui-bg-highlight" : ""}`}
                        onClick={() => setSelected(r.key)}
                      >
                        <Table.Cell>{label(r)}</Table.Cell>
                        <Table.Cell className="text-right">{r.visitors}</Table.Cell>
                        <Table.Cell className="text-right">{r.page_views}</Table.Cell>
                        <Table.Cell className="text-right">{r.clicks}</Table.Cell>
                        <Table.Cell className="text-right">{r.add_to_cart}</Table.Cell>
                        <Table.Cell className="text-right">{r.orders}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </Container>

          <Container className="p-0">
            <div className="px-6 py-4">
              <Heading level="h2">Produits préférés{current ? ` — ${label(current)}` : ""}</Heading>
              <Text size="small" className="mt-1 text-ui-fg-subtle">
                Score = clics ×{data.weights.click} + ajouts au panier ×{data.weights.add_to_cart} + unités commandées ×
                {data.weights.ordered}. Cliquez une ligne à gauche pour changer de lieu.
              </Text>
            </div>
            <div className="px-6 pb-4">
              {products.length === 0 ? (
                <Text size="small" className="text-ui-fg-subtle">Pas encore de données.</Text>
              ) : (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.HeaderCell>Produit</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Clics</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Paniers</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Commandés</Table.HeaderCell>
                      <Table.HeaderCell className="text-right">Score</Table.HeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {products.map((p) => (
                      <Table.Row key={p.id}>
                        <Table.Cell>{p.title}</Table.Cell>
                        <Table.Cell className="text-right">{p.clicks}</Table.Cell>
                        <Table.Cell className="text-right">{p.add_to_cart}</Table.Cell>
                        <Table.Cell className="text-right">{p.ordered}</Table.Cell>
                        <Table.Cell className="text-right">{p.score}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </div>
          </Container>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Stats par région", icon: Globe })
export default GeoStatsPage
