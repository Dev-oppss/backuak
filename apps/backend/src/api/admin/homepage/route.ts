import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "@medusajs/framework/zod"
import { HOMEPAGE_MODULE } from "../../../modules/homepage"
import type { PostAdminHomepage } from "./validators"

type Body = z.infer<typeof PostAdminHomepage>

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: any = req.scope.resolve(HOMEPAGE_MODULE)
  const [content] = await service.listHomepageContents({})
  res.json({ content: content ?? null })
}

export async function POST(req: MedusaRequest<Body>, res: MedusaResponse) {
  const service: any = req.scope.resolve(HOMEPAGE_MODULE)
  const [existing] = await service.listHomepageContents({})

  const content = existing
    ? (await service.updateHomepageContents([{ id: existing.id, ...req.validatedBody }]))[0]
    : (await service.createHomepageContents([req.validatedBody]))[0]

  res.json({ content })
}
