import nodemailer from "nodemailer"

/**
 * Envoi d'emails via le compte email de ton hébergement (SMTP du cPanel),
 * sans service externe. À renseigner dans .env :
 *   SMTP_HOST=mail.tondomaine.com
 *   SMTP_PORT=465
 *   SMTP_USER=noreply@tondomaine.com
 *   SMTP_PASS=le-mot-de-passe-du-compte-email
 *   SMTP_FROM="KuakuMarket <noreply@tondomaine.com>"   (facultatif)
 *
 * Sans configuration SMTP (typiquement en développement local), le
 * message est simplement affiché dans le terminal du backend : le code de
 * vérification y est lisible, ce qui permet de tout tester sans email réel.
 */
export async function sendMail(opts: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<{ sent: boolean }> {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.log(
      `\n[mailer] SMTP non configuré — email NON envoyé.\n  À: ${opts.to}\n  Objet: ${opts.subject}\n  ${opts.text}\n`
    )
    return { sent: false }
  }

  const port = Number(process.env.SMTP_PORT ?? 465)
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? user,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  })
  return { sent: true }
}
