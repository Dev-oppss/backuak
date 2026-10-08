import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Container, Heading, Table, Button, Input, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"

/**
 * Gestion des marques dans le menu de gauche de l'admin : créer,
 * renommer, supprimer. Les produits et catégories, eux, se gèrent déjà
 * dans les écrans natifs de Medusa (Produits / Catégories).
 */
type Brand = { id: string; name: string }

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
                <Table.HeaderCell>Nom</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Actions</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {brands.map((b) => (
                <Table.Row key={b.id}>
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
