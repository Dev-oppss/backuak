import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"

/**
 * GET /store/site-settings — route PUBLIQUE : coordonnées, WhatsApp,
 * réseaux sociaux et messages de bannière, lus par le front. Modifiables
 * uniquement depuis l'admin (voir /admin/site-settings).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SITE_SETTINGS_MODULE)
  const [settings] = await service.listSiteSettings({})
  res.json({ settings: settings ?? null })
}
