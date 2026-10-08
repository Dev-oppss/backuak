import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { SITE_SETTINGS_MODULE } from "../../../modules/site-settings"
import type { PostAdminSiteSettings } from "./validators"

type Body = z.infer<typeof PostAdminSiteSettings>

/**
 * GET/POST /admin/site-settings — une seule ligne de réglages, créée
 * automatiquement au premier enregistrement (pas besoin d'initialiser
 * quoi que ce soit à l'installation).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(SITE_SETTINGS_MODULE)
  const [settings] = await service.listSiteSettings({})
  res.json({ settings: settings ?? null })
}

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const service: any = req.scope.resolve(SITE_SETTINGS_MODULE)
  const [existing] = await service.listSiteSettings({})

  const settings = existing
    ? (await service.updateSiteSettings([{ id: existing.id, ...req.validatedBody }]))[0]
    : (await service.createSiteSettings([req.validatedBody]))[0]

  res.json({ settings })
}
