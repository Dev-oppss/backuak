import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useEffect, useState } from "react"
import {
  Container,
  Heading,
  Label,
  Textarea,
  Input,
  Select,
  Checkbox,
  Button,
  Text,
  toast,
} from "@medusajs/ui"

/**
 * Widget affiché sur la page détail d'un produit, dans la colonne de droite
 * (comme le panneau "Organize"), pour éditer les champs beauté définis dans
 * le cahier des charges sans passer par des requêtes API à la main.
 *
 * Zone "product.details.side.after" : sous les panneaux natifs (Organize,
 * Variants...), voir la doc des zones du module Product si vous préférez
 * la déplacer en "product.details.side.before" (au-dessus).
 */

const SKIN_TYPES = ["Grasse", "Sèche", "Mixte", "Sensible", "Tous types"]
const APPLICATION_ZONES = [
  "Visage",
  "Corps",
  "Bras",
  "Jambes",
  "Cheveux",
  "Cuir chevelu",
  "Lèvres",
]
const USAGE_TIMES = [
  "Matin",
  "Après-midi",
  "Soir",
  "Avant soleil",
  "Après soleil",
]
const USAGE_MODES = [
  { value: "application_directe", label: "Application directe" },
  { value: "dilution", label: "Dilution" },
  { value: "melange", label: "Mélange avec un autre produit" },
  { value: "apres_un_autre_produit", label: "Après un autre produit" },
  { value: "seul", label: "Seul, sans autre produit" },
]

type BeautyAttributesForm = {
  skin_type: string[]
  application_zone: string[]
  usage_time: string[]
  usage_mode: string | undefined
  precautions: string
  side_effects: string
  ingredients: string
  net_content: string
}

const EMPTY_FORM: BeautyAttributesForm = {
  skin_type: [],
  application_zone: [],
  usage_time: [],
  usage_mode: undefined,
  precautions: "",
  side_effects: "",
  ingredients: "",
  net_content: "",
}

function CheckboxGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small" weight="plus">
        {title}
      </Label>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-x-2">
            <Checkbox
              checked={selected.includes(option)}
              onCheckedChange={() => onToggle(option)}
            />
            <Text size="small">{option}</Text>
          </label>
        ))}
      </div>
    </div>
  )
}

const BeautyAttributesWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [form, setForm] = useState<BeautyAttributesForm>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/admin/products/${data.id}/beauty-attributes`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then(({ beauty_attributes }) => {
        if (beauty_attributes) {
          setForm({
            skin_type: beauty_attributes.skin_type ?? [],
            application_zone: beauty_attributes.application_zone ?? [],
            usage_time: beauty_attributes.usage_time ?? [],
            usage_mode: beauty_attributes.usage_mode ?? undefined,
            precautions: beauty_attributes.precautions ?? "",
            side_effects: beauty_attributes.side_effects ?? "",
            ingredients: beauty_attributes.ingredients ?? "",
            net_content: beauty_attributes.net_content ?? "",
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [data.id])

  const toggle = (field: "skin_type" | "application_zone" | "usage_time", value: string) => {
    setForm((prev) => {
      const current = prev[field]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      return { ...prev, [field]: next }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${data.id}/beauty-attributes`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      toast.success("Attributs beauté enregistrés")
    } catch (err) {
      toast.error("Échec de l'enregistrement, réessayez")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Container className="p-6">
        <Text size="small">Chargement des attributs beauté…</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Attributs beauté</Heading>
      </div>

      <div className="flex flex-col gap-y-6 px-6 py-4">
        <CheckboxGroup
          title="Zone d'application"
          options={APPLICATION_ZONES}
          selected={form.application_zone}
          onToggle={(v) => toggle("application_zone", v)}
        />

        <CheckboxGroup
          title="Moment d'utilisation"
          options={USAGE_TIMES}
          selected={form.usage_time}
          onToggle={(v) => toggle("usage_time", v)}
        />

        <CheckboxGroup
          title="Type de peau"
          options={SKIN_TYPES}
          selected={form.skin_type}
          onToggle={(v) => toggle("skin_type", v)}
        />

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Mode d'utilisation
          </Label>
          <Select
            value={form.usage_mode}
            onValueChange={(value) =>
              setForm((prev) => ({ ...prev, usage_mode: value }))
            }
          >
            <Select.Trigger>
              <Select.Value placeholder="Choisir un mode" />
            </Select.Trigger>
            <Select.Content>
              {USAGE_MODES.map((mode) => (
                <Select.Item key={mode.value} value={mode.value}>
                  {mode.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Contenance
          </Label>
          <Input
            placeholder="ex. 30 ml"
            value={form.net_content}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, net_content: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Précautions
          </Label>
          <Textarea
            rows={3}
            value={form.precautions}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, precautions: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Effets secondaires éventuels
          </Label>
          <Textarea
            rows={2}
            value={form.side_effects}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, side_effects: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-y-2">
          <Label size="small" weight="plus">
            Ingrédients (liste INCI)
          </Label>
          <Textarea
            rows={3}
            value={form.ingredients}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, ingredients: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-end px-6 py-4">
        <Button size="small" onClick={handleSave} isLoading={saving}>
          Enregistrer
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
})

export default BeautyAttributesWidget
