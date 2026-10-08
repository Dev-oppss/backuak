import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CogSixTooth } from "@medusajs/icons"
import { Container, Heading, Input, Textarea, Button, Label, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Réglages du site — coordonnées, WhatsApp, réseaux sociaux, messages de
 * la bannière défilante. Modifiable directement ici par l'équipe, sans
 * toucher au code ni redéployer le front : le site lit ces valeurs à
 * chaque affichage (voir /store/site-settings côté vitrine).
 */
type Settings = {
  phone: string; whatsapp: string; email: string; address: string; hours: string
  instagram: string; facebook: string; tiktok: string; banner_messages: string
}

const EMPTY: Settings = {
  phone: "", whatsapp: "", email: "", address: "", hours: "",
  instagram: "", facebook: "", tiktok: "", banner_messages: "",
}

const SiteSettingsPage = () => {
  const [form, setForm] = useState<Settings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/admin/site-settings", { credentials: "include" })
      .then((r) => r.json())
      .then(({ settings }) => {
        if (settings) {
          setForm({
            phone: settings.phone ?? "",
            whatsapp: settings.whatsapp ?? "",
            email: settings.email ?? "",
            address: settings.address ?? "",
            hours: settings.hours ?? "",
            instagram: settings.instagram ?? "",
            facebook: settings.facebook ?? "",
            tiktok: settings.tiktok ?? "",
            banner_messages: (settings.banner_messages ?? []).join("\n"),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/site-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          banner_messages: form.banner_messages.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Réglages enregistrés")
    } catch {
      toast.error("Échec de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Container><Heading>Chargement…</Heading></Container>

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Réglages du site</Heading>
        <Button onClick={save} isLoading={saving}>Enregistrer</Button>
      </div>
      <div className="grid grid-cols-2 gap-4 px-6 py-4">
        <Field label="Téléphone" value={form.phone} onChange={set("phone")} placeholder="+237 6XX XXX XXX" />
        <Field label="WhatsApp (format international, sans +, ex. 2376XXXXXXXX)" value={form.whatsapp} onChange={set("whatsapp")} placeholder="237612345678" />
        <Field label="Email de contact" value={form.email} onChange={set("email")} placeholder="contact@kuakumarket.com" />
        <Field label="Adresse" value={form.address} onChange={set("address")} placeholder="Douala, Cameroun" />
        <Field label="Horaires" value={form.hours} onChange={set("hours")} placeholder="Lundi – Samedi, 8h – 18h" />
        <Field label="Instagram (lien complet)" value={form.instagram} onChange={set("instagram")} placeholder="https://instagram.com/..." />
        <Field label="Facebook (lien complet)" value={form.facebook} onChange={set("facebook")} placeholder="https://facebook.com/..." />
        <Field label="TikTok (lien complet)" value={form.tiktok} onChange={set("tiktok")} placeholder="https://tiktok.com/@..." />
      </div>
      <div className="px-6 py-4">
        <Label>Messages de la bannière défilante (un par ligne)</Label>
        <Textarea className="mt-2" rows={5} value={form.banner_messages} onChange={set("banner_messages")} />
      </div>
    </Container>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (e: any) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input className="mt-2" value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  )
}

export const config = defineRouteConfig({ label: "Réglages du site", icon: CogSixTooth })
export default SiteSettingsPage
