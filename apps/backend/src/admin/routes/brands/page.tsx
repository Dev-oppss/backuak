import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Container, Heading, Table, Button, Input, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Gestion des marques dans le menu de gauche de l'admin : créer,
 * renommer, supprimer. Les produits et catégories, eux, se gèrent déjà
 * dans les écrans natifs de Medusa (Produits / Catégories).
 */
type Brand = { id: string; name: string; logo_url?: string | null }

const BrandsPage = () => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const load = () => {
    setLoading(true)
    fetch("/admin/brands", { credentials: "include" })
      .then((r) => r.json())
      .then(({ brands }) => setBrands(brands ?? []))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const call = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error("Échec de la requête")
    return res.json()
  }

  const create = async () => {
    if (!newName.trim()) return toast.error("Le nom est obligatoire")
    try {
      await call("/admin/brands", "POST", { name: newName.trim() })
      setNewName("")
      load()
      toast.success("Marque créée")
    } catch {
      toast.error("Impossible de créer la marque")
    }
  }

  const rename = async (id: string) => {
    if (!editingName.trim()) return toast.error("Le nom est obligatoire")
    try {
      await call(`/admin/brands/${id}`, "POST", { name: editingName.trim() })
      setEditingId(null)
      load()
      toast.success("Marque renommée")
    } catch {
      toast.error("Impossible de renommer la marque")
    }
  }

  const uploadLogo = async (b: Brand, file: File) => {
    try {
      const form = new FormData()
      form.append("files", file)
      const up = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: form })
      if (!up.ok) throw new Error()
      const { files } = await up.json()
      await call(`/admin/brands/${b.id}`, "POST", { logo_url: files[0].url })
      load()
      toast.success(`Logo de « ${b.name} » enregistré`)
    } catch {
      toast.error("Impossible d'envoyer le logo")
    }
  }

  const removeLogo = async (b: Brand) => {
    try {
      await call(`/admin/brands/${b.id}`, "POST", { logo_url: null })
      load()
      toast.success("Logo retiré")
    } catch {
      toast.error("Impossible de retirer le logo")
    }
  }

  const remove = async (b: Brand) => {
    if (!window.confirm(`Supprimer la marque « ${b.name} » ? Les produits liés resteront, sans marque.`)) return
    try {
      await call(`/admin/brands/${b.id}`, "DELETE")
      load()
      toast.success("Marque supprimée")
    } catch {
      toast.error("Impossible de supprimer la marque")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Marques</Heading>
        <div className="flex gap-2">
          <Input
            placeholder="Nouvelle marque"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button onClick={create}>Ajouter</Button>
        </div>
      </div>
      <div className="px-6 py-4">
        {loading ? (
          "Chargement…"
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Logo</Table.HeaderCell>
                <Table.HeaderCell>Nom</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {brands.map((b) => (
                <Table.Row key={b.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      {b.logo_url ? (
                        <img src={b.logo_url} alt={b.name} className="h-9 w-20 rounded border object-contain bg-white p-1" />
                      ) : (
                        <span className="text-ui-fg-muted text-xs">Aucun</span>
                      )}
                      <label
                        htmlFor={`logo-${b.id}`}
                        className="cursor-pointer rounded-md border px-2 py-1 text-xs hover:bg-ui-bg-base-hover"
                      >
                        {b.logo_url ? "Changer" : "Ajouter"}
                      </label>
                      <input
                        id={`logo-${b.id}`}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) uploadLogo(b, f)
                          e.target.value = ""
                        }}
                      />
                      {b.logo_url && (
                        <button type="button" className="text-xs text-ui-fg-error" onClick={() => removeLogo(b)}>
                          Retirer
                        </button>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {editingId === b.id ? (
                      <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                    ) : (
                      b.name
                    )}
                  </Table.Cell>
                  <Table.Cell className="flex justify-end gap-2">
                    {editingId === b.id ? (
                      <>
                        <Button size="small" onClick={() => rename(b.id)}>Enregistrer</Button>
                        <Button size="small" variant="secondary" onClick={() => setEditingId(null)}>Annuler</Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => { setEditingId(b.id); setEditingName(b.name) }}
                        >
                          Modifier
                        </Button>
                        <Button size="small" variant="danger" onClick={() => remove(b)}>Supprimer</Button>
                      </>
                    )}
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

export const config = defineRouteConfig({ label: "Marques", icon: Tag })
export default BrandsPage
