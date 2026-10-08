import { model } from "@medusajs/framework/utils"

/**
 * Réglages du site modifiables depuis l'admin par l'équipe (sans toucher
 * au code) : coordonnées, WhatsApp, réseaux sociaux, messages de la
 * bannière défilante. Une seule ligne dans cette table.
 */
const SiteSetting = model.define("site_setting", {
  id: model.id().primaryKey(),
  phone: model.text().nullable(),
  whatsapp: model.text().nullable(),
  email: model.text().nullable(),
  address: model.text().nullable(),
  hours: model.text().nullable(),
  instagram: model.text().nullable(),
  facebook: model.text().nullable(),
  tiktok: model.text().nullable(),
  banner_messages: model.json().nullable(),
})

export default SiteSetting
