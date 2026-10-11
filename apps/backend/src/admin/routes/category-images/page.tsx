import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Photo } from "@medusajs/icons"
import { Container, Heading, Table, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Images des catégories : chaque catégorie peut avoir une image illustrative,
 * affichée dans le rond de la section "Un besoin particulier ?" de la
 * vitrine. L'image est enregistrée dans le metadata de la catégorie
 * (metadata.image_url) — aucun changement de base de données.
 */
type Category = {
  id: string
  name: string
  metadata?: Record<string, unknown> | null
}

const CategoryImagesPage = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch("/admin/product-categories?limit=200&fields=id,name,metadata", {
      credentials: "include",
    })
      .then((r) => r.json())
      .then(({ product_categories }) =>
        setCategories(
          [...(product_categories ?? [])].sort((a: Category, b: Category) =>
            a.name.localeCompare(b.name)
          )
        )
      )
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const saveImage = async (c: Category, image_url: string) => {
    const res = await fetch(`/admin/product-categories/${c.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      // Chaîne vide = retire la clé du metadata.
      body: JSON.stringify({ metadata: { ...(c.metadata ?? {}), image_url } }),
    })
    if (!res.ok) throw new Error("Échec de la requête")
  }

  const upload = async (c: Category, file: File) => {
    try {
      const form = new FormData()
      form.append("files", file)
      const up = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: form })
      if (!up.ok) throw new Error()
      const { files } = await up.json()
      await saveImage(c, files[0].url)
      load()
      toast.success(`Image de « ${c.name} » enregistrée`)
    } catch {
      toast.error("Impossible d'envoyer l'image")
    }
  }

  const remove = async (c: Category) => {
    try {
      await saveImage(c, "")
      load()
      toast.success("Image retirée")
    } catch {
      toast.error("Impossible de retirer l'image")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Images des catégories</Heading>
        <p className="mt-1 text-sm text-ui-fg-subtle">
          Image carrée conseillée (ex. 400 × 400 px, png / jpg / webp). Elle s'affiche dans un rond sur la page d'accueil.
        </p>
      </div>
      <div className="px-6 py-4">
        {loading ? (
          "Chargement…"
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Image</Table.HeaderCell>
                <Table.HeaderCell>Catégorie</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categories.map((c) => {
                const url = (c.metadata?.image_url as string | undefined) || ""
                return (
                  <Table.Row key={c.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-3">
                        {url ? (
                          <img src={url} alt={c.name} className="h-12 w-12 rounded-full border object-cover" />
                        ) : (
                          <span className="flex h-12 w-12 items-center justify-center rounded-full border text-ui-fg-muted text-xs">
                            Aucune
                          </span>
                        )}
                        <label
                          htmlFor={`cat-${c.id}`}
                          className="cursor-pointer rounded-md border px-2 py-1 text-xs hover:bg-ui-bg-base-hover"
                        >
                          {url ? "Changer" : "Ajouter"}
                        </label>
                        <input
                          id={`cat-${c.id}`}
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (f) upload(c, f)
                            e.target.value = ""
                          }}
                        />
                        {url && (
                          <button type="button" className="text-xs text-ui-fg-error" onClick={() => remove(c)}>
                            Retirer
                          </button>
                        )}
                      </div>
                    </Table.Cell>
                    <Table.Cell>{c.name}</Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Images catégories", icon: Photo })
export default CategoryImagesPage
