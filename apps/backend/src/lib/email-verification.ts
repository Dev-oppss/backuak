import crypto from "node:crypto"
import type { MedusaContainer } from "@medusajs/framework/types"
import { EMAIL_VERIFICATION_MODULE } from "../modules/email-verification"
import { sendMail } from "./mailer"

const CODE_TTL_MS = 15 * 60 * 1000
const RESEND_COOLDOWN_MS = 60 * 1000
const MAX_ATTEMPTS = 5

function hashCode(code: string, customerId: string) {
  return crypto
    .createHash("sha256")
    .update(`${customerId}:${code}:${process.env.JWT_SECRET ?? ""}`)
    .digest("hex")
}

async function getCustomer(container: MedusaContainer, customerId: string) {
  const query = container.resolve("query")
  const { data } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "first_name"],
    filters: { id: customerId },
  })
  return data[0] as { id: string; email: string; first_name?: string } | undefined
}

async function getRecord(container: MedusaContainer, customerId: string) {
  const service: any = container.resolve(EMAIL_VERIFICATION_MODULE)
  const [record] = await service.listEmailVerifications({ customer_id: customerId })
  return { service, record }
}

/** Le compte est-il vérifié pour son adresse email ACTUELLE ? */
export async function isEmailVerified(
  container: MedusaContainer,
  customerId: string
): Promise<boolean> {
  const customer = await getCustomer(container, customerId)
  if (!customer) return false
  const { record } = await getRecord(container, customerId)
  return Boolean(
    record?.verified_at &&
      record.email?.toLowerCase() === customer.email?.toLowerCase()
  )
}

/** Génère un code, l'enregistre (haché) et l'envoie par email. */
export async function issueCode(
  container: MedusaContainer,
  customerId: string
): Promise<
  | { ok: true; alreadyVerified?: boolean }
  | { ok: false; reason: "cooldown"; retryIn: number }
  | { ok: false; reason: "no_customer" }
> {
  const customer = await getCustomer(container, customerId)
  if (!customer) return { ok: false, reason: "no_customer" }

  const { service, record } = await getRecord(container, customerId)
  const now = Date.now()

  if (
    record?.verified_at &&
    record.email?.toLowerCase() === customer.email?.toLowerCase()
  ) {
    return { ok: true, alreadyVerified: true }
  }

  if (record?.last_sent_at) {
    const elapsed = now - new Date(record.last_sent_at).getTime()
    if (elapsed < RESEND_COOLDOWN_MS) {
      return {
        ok: false,
        reason: "cooldown",
        retryIn: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000),
      }
    }
  }

  const code = crypto.randomInt(100000, 1000000).toString()
  const data = {
    email: customer.email,
    code_hash: hashCode(code, customerId),
    expires_at: new Date(now + CODE_TTL_MS),
    attempts: 0,
    last_sent_at: new Date(now),
    verified_at: null,
  }

  if (record) {
    await service.updateEmailVerifications([{ id: record.id, ...data }])
  } else {
    await service.createEmailVerifications([{ customer_id: customerId, ...data }])
  }

  await sendMail({
    to: customer.email,
    subject: `Ton code de vérification KuakuMarket : ${code}`,
    text:
      `Bonjour${customer.first_name ? " " + customer.first_name : ""},\n\n` +
      `Ton code de vérification est : ${code}\n` +
      `Il est valable 15 minutes.\n\n` +
      `Si tu n'as pas créé de compte sur KuakuMarket, ignore simplement cet email.`,
  })

  return { ok: true }
}

/** Vérifie le code saisi. */
export async function checkCode(
  container: MedusaContainer,
  customerId: string,
  code: string
): Promise<
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many" }
  | { ok: false; reason: "wrong"; remaining: number }
> {
  const { service, record } = await getRecord(container, customerId)
  if (!record || !record.code_hash || !record.expires_at) {
    return { ok: false, reason: "no_code" }
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" }
  }
  if ((record.attempts ?? 0) >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many" }
  }

  const expected = Buffer.from(record.code_hash, "hex")
  const given = Buffer.from(hashCode(code, customerId), "hex")
  const match =
    expected.length === given.length && crypto.timingSafeEqual(expected, given)

  if (!match) {
    const attempts = (record.attempts ?? 0) + 1
    await service.updateEmailVerifications([{ id: record.id, attempts }])
    return { ok: false, reason: "wrong", remaining: Math.max(0, MAX_ATTEMPTS - attempts) }
  }

  await service.updateEmailVerifications([
    { id: record.id, verified_at: new Date(), code_hash: null, expires_at: null, attempts: 0 },
  ])
  return { ok: true }
}
