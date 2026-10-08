import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Input, Textarea, Button, Label, Select, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Slide = { image_url: string; title: string; subtitle: string; cta_label: string; cta_href: string }
type PromoSlide = {
  mode: "banner" | "poster"
  image_url: string
  tone: "rose" | "teal"
  title: string
  text: string
  cta: string
  href: string
}
type ProductHit = { id: string; title: string; thumbnail: string | null }

const EMPTY_SLIDE: Slide = { image_url: "", title: "", subtitle: "", cta_label: "", cta_href: "" }
const EMPTY_PROMO: PromoSlide = {
  mode: "banner", image_url: "", tone: "rose", title: "", text: "", cta: "", href: "",
}

/**
 * Page "Page d'accueil" — carrousel principal, promos (plusieurs,
 * bannière texte ou affiche pure), produits "indispensables". Les images
 * passent par l'upload natif de Medusa (POST /admin/uploads), le même
 * mécanisme que pour les images produit.
 */
const HomepagePage = () => {
  const [slides, setSlides] = useState<Slide[]>([])
  const [promos, setPromos] = useState<PromoSlide[]>([])
  const [featuredIds, setFeaturedIds] = useState<string[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<ProductHit[]>([])
  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState<ProductHit[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)

  useEffect(() => {
    fetch("/admin/homepage", { credentials: "include" })
      .then((r) => r.json())
      .then(async ({ content }) => {
        setSlides(content?.hero_slides ?? [])
        setPromos(content?.promo_slides ?? [])
        const fids = content?.featured_product_ids ?? []
        setFeaturedIds(fids)
        if (fids.length > 0) {
          const res = await fetch(
            `/admin/products?id[]=${fids.join("&id[]=")}&fields=id,title,thumbnail`,
            { credentials: "include" }
          )
          const { products } = await res.json()
          setFeaturedProducts(products ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const uploadImage = async (file: File): Promise<string> => {
    const form = new FormData()
    form.append("files", file)
    const res = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: form })
    if (!res.ok) throw new Error()
    const { files } = await res.json()
    return files[0].url
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch("/admin/homepage", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hero_slides: slides, promo_slides: promos, featured_product_ids: featuredIds }),
      })
      if (!res.ok) throw new Error()
      toast.success("Page d'accueil mise à jour")
    } catch {
      toast.error("Échec de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const updateSlide = (i: number, patch: Partial<Slide>) =>
    setSlides((s) => s.map((sl, idx) => (idx === i ? { ...sl, ...patch } : sl)))
  const updatePromo = (i: number, patch: Partial<PromoSlide>) =>
    setPromos((p) => p.map((pr, idx) => (idx === i ? { ...pr, ...patch } : pr)))

  const searchProducts = async (q: string) => {
    setSearch(q)
    if (q.trim().length < 2) return setSearchResults([])
    const res = await fetch(`/admin/products?q=${encodeURIComponent(q)}&limit=6&fields=id,title,thumbnail`, { credentials: "include" })
    const { products } = await res.json()
    setSearchResults(products ?? [])
  }
  const addFeatured = (p: ProductHit) => {
    if (featuredIds.includes(p.id)) return
    setFeaturedIds((ids) => [...ids, p.id])
    setFeaturedProducts((ps) => [...ps, p])
    setSearch("")
    setSearchResults([])
  }
  const removeFeatured = (id: string) => {
    setFeaturedIds((ids) => ids.filter((i) => i !== id))
    setFeaturedProducts((ps) => ps.filter((p) => p.id !== id))
  }

  if (loading) return <Container><Heading>Chargement…</Heading></Container>

  return (
    <div className="flex flex-col gap-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <Heading>Page d'accueil</Heading>
          <Button onClick={save} isLoading={saving}>Enregistrer</Button>
        </div>

        {/* ---------- Carrousel principal ---------- */}
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-3">Carrousel principal</Heading>
          <div className="flex flex-col gap-4">
            {slides.map((slide, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="flex items-start gap-4">
                  <ImageBox
                    url={slide.image_url}
                    uploading={uploading === `hero-${i}`}
                    onFile={async (file) => {
                      setUploading(`hero-${i}`)
                      try { updateSlide(i, { image_url: await uploadImage(file) }) }
                      catch { toast.error("Échec de l'envoi de l'image") }
                      finally { setUploading(null) }
                    }}
                  />
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input placeholder="Titre" value={slide.title} onChange={(e) => updateSlide(i, { title: e.target.value })} />
                    <Input placeholder="Sous-titre" value={slide.subtitle} onChange={(e) => updateSlide(i, { subtitle: e.target.value })} />
                    <Input placeholder="Texte du bouton" value={slide.cta_label} onChange={(e) => updateSlide(i, { cta_label: e.target.value })} />
                    <Input placeholder="Lien (ex: /catalogue)" value={slide.cta_href} onChange={(e) => updateSlide(i, { cta_href: e.target.value })} />
                  </div>
                  <Button size="small" variant="danger" onClick={() => setSlides((s) => s.filter((_, idx) => idx !== i))}>Retirer</Button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3" variant="secondary" onClick={() => setSlides((s) => [...s, { ...EMPTY_SLIDE }])}>
            + Ajouter une image au carrousel
          </Button>
        </div>

        {/* ---------- Promos (plusieurs) ---------- */}
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-1">Promos / publicités</Heading>
          <p className="mb-3 text-xs text-ui-fg-subtle">
            "Bannière" = texte sur fond coloré (avec ou sans image). "Affiche" = juste ton image, cliquable,
            sans texte par-dessus — pour un visuel déjà conçu (Canva, Photoshop...).
          </p>
          <div className="flex flex-col gap-4">
            {promos.map((promo, i) => (
              <div key={i} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center gap-3">
                  <Select value={promo.mode} onValueChange={(v) => updatePromo(i, { mode: v as "banner" | "poster" })}>
                    <Select.Trigger className="w-40"><Select.Value /></Select.Trigger>
                    <Select.Content>
                      <Select.Item value="banner">Bannière (texte)</Select.Item>
                      <Select.Item value="poster">Affiche (image seule)</Select.Item>
                    </Select.Content>
                  </Select>
                  {promo.mode === "banner" && (
                    <Select value={promo.tone} onValueChange={(v) => updatePromo(i, { tone: v as "rose" | "teal" })}>
                      <Select.Trigger className="w-32"><Select.Value /></Select.Trigger>
                      <Select.Content>
                        <Select.Item value="rose">Rose</Select.Item>
                        <Select.Item value="teal">Bleu-vert</Select.Item>
                      </Select.Content>
                    </Select>
                  )}
                  <Button size="small" variant="danger" className="ml-auto" onClick={() => setPromos((p) => p.filter((_, idx) => idx !== i))}>
                    Retirer
                  </Button>
                </div>
                <div className="flex items-start gap-4">
                  <ImageBox
                    url={promo.image_url}
                    uploading={uploading === `promo-${i}`}
                    onFile={async (file) => {
                      setUploading(`promo-${i}`)
                      try { updatePromo(i, { image_url: await uploadImage(file) }) }
                      catch { toast.error("Échec de l'envoi de l'image") }
                      finally { setUploading(null) }
                    }}
                  />
                  <div className="flex-1">
                    {promo.mode === "banner" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Titre" value={promo.title} onChange={(e) => updatePromo(i, { title: e.target.value })} />
                        <Input placeholder="Texte du bouton" value={promo.cta} onChange={(e) => updatePromo(i, { cta: e.target.value })} />
                        <Textarea className="col-span-2" placeholder="Texte" value={promo.text} onChange={(e) => updatePromo(i, { text: e.target.value })} />
                      </div>
                    )}
                    <Input
                      className="mt-2"
                      placeholder="Lien (ex: /catalogue?marque=CeraVe)"
                      value={promo.href}
                      onChange={(e) => updatePromo(i, { href: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-3" variant="secondary" onClick={() => setPromos((p) => [...p, { ...EMPTY_PROMO }])}>
            + Ajouter une promo
          </Button>
        </div>

        {/* ---------- Indispensables ---------- */}
        <div className="px-6 py-4">
          <Heading level="h2" className="mb-3">Nos indispensables (produits mis en avant)</Heading>
          <div className="relative">
            <Input placeholder="Rechercher un produit à ajouter…" value={search} onChange={(e) => searchProducts(e.target.value)} />
            {searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border bg-ui-bg-base shadow-lg">
                {searchResults.map((p) => (
                  <button key={p.id} onClick={() => addFeatured(p)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ui-bg-subtle">
                    {p.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {featuredProducts.map((p) => (
              <span key={p.id} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                {p.title}
                <button onClick={() => removeFeatured(p.id)} className="font-bold text-ui-fg-error">×</button>
              </span>
            ))}
            {featuredProducts.length === 0 && <p className="text-xs text-ui-fg-subtle">Aucun produit choisi pour l'instant.</p>}
          </div>
        </div>
      </Container>
    </div>
  )
}

function ImageBox({ url, uploading, onFile }: { url: string; uploading: boolean; onFile: (f: File) => void }) {
  return (
    <div className="shrink-0">
      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-ui-bg-subtle">
        {url ? <img src={url} className="h-full w-full object-cover" /> : <Photo />}
      </div>
      <input
        type="file"
        accept="image/*"
        className="mt-1 w-20 text-[10px]"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      {uploading && <p className="text-[10px] text-ui-fg-subtle">Envoi…</p>}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Page d'accueil", icon: Photo })
export default HomepagePage
