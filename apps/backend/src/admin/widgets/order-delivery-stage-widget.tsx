import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useEffect, useState } from "react"
import { Container, Heading, Select, Button, Badge, Text, toast } from "@medusajs/ui"

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

// Mode de paiement choisi par la cliente (enregistré avec la commande par la boutique).
const PAYMENT_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  in_store: "Paiement en boutique",
  mobile_money: "Mobile Money (MTN MoMo / Orange Money)",
}

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
  const paymentMethod = data.metadata?.payment_method as string | undefined
  const paymentReference = data.metadata?.payment_reference as string | undefined

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

      {paymentMethod && (
        <div className="px-6 py-4">
          <Text size="small" weight="plus" leading="compact">
            Paiement choisi
          </Text>
          <Text size="small" leading="compact" className="mt-1">
            {PAYMENT_LABELS[paymentMethod] ?? paymentMethod}
          </Text>
          {paymentMethod === "mobile_money" && (
            <div className="mt-3 rounded-md bg-ui-bg-subtle px-3 py-2">
              <Text size="small" leading="compact">
                ID de transaction : <code className="font-mono font-semibold">{paymentReference ?? "non renseigné"}</code>
              </Text>
              <Text size="xsmall" leading="compact" className="mt-1 text-ui-fg-subtle">
                Retrouvez cet ID dans l&apos;historique MTN MoMo ou Orange Money. Si le paiement y figure, marquez la
                commande comme payée.
              </Text>
            </div>
          )}
        </div>
      )}

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
