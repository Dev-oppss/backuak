import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Star } from "@medusajs/icons"
import { Container, Heading, Table, Button, Badge, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Avis clients. Par défaut : file "à examiner" (avis mis de côté par le
 * filtre anti-spam). Bouton "Tous" pour retirer a posteriori un avis
 * publié suite à un signalement fondé — jamais pour trier par note.
 */
type Review = {
  id: string
  customer_name: string
  rating: number
  comment: string | null
  status: "published" | "flagged" | "removed"
  created_at: string
}

const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<"flagged" | "all">("flagged")
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const qs = filter === "flagged" ? "?status=flagged" : ""
    fetch(`/admin/reviews${qs}`, { credentials: "include" })
      .then((r) => r.json())
      .then(({ reviews }) => setReviews(reviews ?? []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [filter])

  const setStatus = async (id: string, status: "published" | "removed") => {
    const res = await fetch(`/admin/reviews/${id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      toast.success(status === "published" ? "Avis publié" : "Avis retiré")
      load()
    } else {
      toast.error("Action impossible")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Avis clients</Heading>
        <div className="flex gap-2">
          <Button size="small" variant={filter === "flagged" ? "primary" : "secondary"} onClick={() => setFilter("flagged")}>À examiner</Button>
          <Button size="small" variant={filter === "all" ? "primary" : "secondary"} onClick={() => setFilter("all")}>Tous</Button>
        </div>
      </div>
      <div className="px-6 py-4">
        {loading ? "Chargement…" : reviews.length === 0 ? (
          <Text className="text-ui-fg-subtle">Aucun avis à afficher.</Text>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Cliente</Table.HeaderCell>
                <Table.HeaderCell>Note</Table.HeaderCell>
                <Table.HeaderCell>Commentaire</Table.HeaderCell>
                <Table.HeaderCell>Statut</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {reviews.map((r) => (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.customer_name}</Table.Cell>
                  <Table.Cell>{r.rating} ★</Table.Cell>
                  <Table.Cell className="max-w-xs whitespace-normal">{r.comment ?? "—"}</Table.Cell>
                  <Table.Cell><Badge color={r.status === "published" ? "green" : r.status === "flagged" ? "orange" : "red"}>{r.status}</Badge></Table.Cell>
                  <Table.Cell className="flex justify-end gap-2">
                    {r.status !== "published" && <Button size="small" onClick={() => setStatus(r.id, "published")}>Publier</Button>}
                    {r.status !== "removed" && <Button size="small" variant="danger" onClick={() => setStatus(r.id, "removed")}>Retirer</Button>}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Avis", icon: Star })
export default ReviewsPage
