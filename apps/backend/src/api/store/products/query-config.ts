/**
 * Étend les champs que l'API Store renvoie pour un produit, afin d'inclure
 * la marque liée (module custom "brand") — par défaut Medusa ne renvoie
 * que les champs natifs du produit aux clients store, pas les modules
 * liés par defineLink.
 *
 * Champs Price List (calculated_price avec original_amount vs
 * calculated_amount) déjà inclus nativement dès qu'une région est passée
 * en paramètre de product.list — pas besoin de les lister ici.
 */
export const storeProductQueryConfig = {
  defaultFields: [
    "id",
    "title",
    "handle",
    "thumbnail",
    "images.*",
    "description",
    "categories.id",
    "categories.name",
    "variants.id",
    "variants.title",
    "variants.calculated_price.*",
    "options.*",
    "brand.id",
    "brand.name",
  ],
  defaultLimit: 20,
  isList: true,
}
