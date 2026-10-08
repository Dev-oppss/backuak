import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useEffect, useState } from "react"
import { Container, Heading, Select, Button, Badge, toast } from "@medusajs/ui"

/**
 * Widget affiché sur la page détail d'une commande, pour suivre et faire
 * avancer le statut détaillé (point 7 du cahier des charges) :
 * Nouvelle → Confirmée → Préparation → Expédition → Livrée
 * (+ Annulée / Échec / Retour).
 *
 * Ce statut est distinct du payment_status / fulfillment_status natifs de
 * Medusa — voir la spec technique, section 4, pour le détail de la
 * correspondance.
 */

const STAGES: { value: string; label: string; color: React.ComponentProps<typeof Badge>["color"] }[] = [
  { value: "nouvelle", label: "Nouvelle", color: "blue" },
  { value: "confirmee", label: "Confirmée", color: "green" },
  { value: "preparation", label: "Préparation", color: "orange" },
  { value: "expedition", label: "Expédition", color: "purple" },
  { value: "livree", label: "Livrée", color: "green" },
  { value: "annulee", label: "Annulée", color: "red" },
  { value: "echec", label: "Échec", color: "red" },
  { value: "retour", label: "Retour", color: "red" },
]

const OrderDeliveryStageWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [stage, setStage] = useState<string>("nouvelle")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/admin/orders/${data.id}/delivery-stage`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ delivery_stage }) => {
        if (delivery_stage?.stage) {
          setStage(delivery_stage.stage)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [data.id])

  const currentLabel = STAGES.find((s) => s.value === stage)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/orders/${data.id}/delivery-stage`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Statut de livraison mis à jour")
    } catch {
      toast.error("Échec de la mise à jour, réessayez")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Statut de livraison</Heading>
        {currentLabel && <Badge color={currentLabel.color}>{currentLabel.label}</Badge>}
      </div>

      <div className="flex items-center gap-x-3 px-6 py-4">
        <Select value={stage} onValueChange={setStage}>
          <Select.Trigger>
            <Select.Value placeholder="Choisir un statut" />
          </Select.Trigger>
          <Select.Content>
            {STAGES.map((s) => (
              <Select.Item key={s.value} value={s.value}>
                {s.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Button size="small" onClick={handleSave} isLoading={saving}>
          Mettre à jour
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderDeliveryStageWidget
