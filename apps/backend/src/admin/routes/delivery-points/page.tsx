import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MapPin } from "@medusajs/icons"
import {
  Container,
  Heading,
  Table,
  Button,
  Input,
  Label,
  Badge,
  toast,
} from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Page listée dans le menu de gauche de l'admin ("Points de livraison",
 * visible dans la maquette d'origine). Liste + formulaire de création
 * simple ; l'édition/suppression peut être ajoutée de la même façon une
 * fois ce premier jet validé.
 */

type DeliveryPoint = {
  id: string
  name: string
  city: string
  fee: number
  estimated_delay: string | null
  active: boolean
}

const EMPTY_NEW_POINT = { name: "", city: "", fee: "", estimated_delay: "" }

const DeliveryPointsPage = () => {
  const [points, setPoints] = useState<DeliveryPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newPoint, setNewPoint] = useState(EMPTY_NEW_POINT)

  const loadPoints = () => {
    setLoading(true)
    fetch("/admin/delivery-points", { credentials: "include" })
      .then((res) => res.json())
      .then(({ delivery_points }) => setPoints(delivery_points ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPoints()
  }, [])

  const handleCreate = async () => {
    if (!newPoint.name || !newPoint.city || !newPoint.fee) {
      toast.error("Nom, ville et frais sont obligatoires")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/admin/delivery-points", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newPoint.name,
          city: newPoint.city,
          fee: Number(newPoint.fee),
          estimated_delay: newPoint.estimated_delay || undefined,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Point de livraison ajouté")
      setNewPoint(EMPTY_NEW_POINT)
      loadPoints()
    } catch {
      toast.error("Échec de la création, réessayez")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Points de livraison</Heading>
      </div>

      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Nom</Table.HeaderCell>
              <Table.HeaderCell>Ville</Table.HeaderCell>
              <Table.HeaderCell>Frais</Table.HeaderCell>
              <Table.HeaderCell>Délai estimé</Table.HeaderCell>
              <Table.HeaderCell>Statut</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {!loading && points.length === 0 && (
              <Table.Row>
                <Table.Cell colSpan={5}>Aucun point de livraison pour l'instant.</Table.Cell>
              </Table.Row>
            )}
            {points.map((point) => (
              <Table.Row key={point.id}>
                <Table.Cell>{point.name}</Table.Cell>
                <Table.Cell>{point.city}</Table.Cell>
                <Table.Cell>{point.fee} FCFA</Table.Cell>
                <Table.Cell>{point.estimated_delay ?? "—"}</Table.Cell>
                <Table.Cell>
                  <Badge color={point.active ? "green" : "grey"}>
                    {point.active ? "Actif" : "Inactif"}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4">
        <Heading level="h3">Ajouter un point de livraison</Heading>
        <div className="grid grid-cols-4 gap-x-4">
          <div className="flex flex-col gap-y-2">
            <Label size="small">Nom</Label>
            <Input
              placeholder="ex. Akwa, Douala"
              value={newPoint.name}
              onChange={(e) => setNewPoint((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label size="small">Ville</Label>
            <Input
              placeholder="ex. Douala"
              value={newPoint.city}
              onChange={(e) => setNewPoint((p) => ({ ...p, city: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label size="small">Frais (FCFA)</Label>
            <Input
              type="number"
              placeholder="1500"
              value={newPoint.fee}
              onChange={(e) => setNewPoint((p) => ({ ...p, fee: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-y-2">
            <Label size="small">Délai estimé</Label>
            <Input
              placeholder="24-48h"
              value={newPoint.estimated_delay}
              onChange={(e) =>
                setNewPoint((p) => ({ ...p, estimated_delay: e.target.value }))
              }
            />
          </div>
        </div>
        <div>
          <Button size="small" onClick={handleCreate} isLoading={creating}>
            Ajouter
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Points de livraison",
  icon: MapPin,
})

export default DeliveryPointsPage
