import { promises as dns } from "node:dns"

/**
 * Contrôle d'une adresse email à l'inscription. Trois barrières
 * automatiques (format, domaines jetables/fautes de frappe, domaine qui
 * reçoit réellement du courrier) — mais AUCUNE ne peut prouver qu'une
 * adresse appartient bien à la personne : seule la vérification par code
 * (voir modules/email-verification) le garantit. Ces contrôles servent à
 * refuser tôt les adresses manifestement fausses (j@k.com, gmial.com…).
 */

const DISPOSABLE = new Set([
  "mailinator.com", "yopmail.com", "yopmail.fr", "guerrillamail.com",
  "guerrillamail.net", "guerrillamail.org", "sharklasers.com", "10minutemail.com",
  "tempmail.com", "temp-mail.org", "throwawaymail.com", "trashmail.com",
  "getnada.com", "maildrop.cc", "dispostable.com", "fakeinbox.com",
  "mailnesia.com", "mintemail.com", "mohmal.com", "moakt.com", "tempail.com",
  "emailondeck.com", "burnermail.io", "jetable.org", "tmpmail.org",
  "discard.email", "spamgourmet.com", "trashmail.net", "tempr.email",
  "mail.tm", "10minutemail.net", "fakemailgenerator.com", "mytemp.email",
])

const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gamil.com": "gmail.com",
  "gmail.co": "gmail.com", "gmail.con": "gmail.com", "gmaill.com": "gmail.com",
  "gnail.com": "gmail.com", "hotmial.com": "hotmail.com", "hotmai.com": "hotmail.com",
  "hotmail.con": "hotmail.com", "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com", "outlok.com": "outlook.com", "outlook.con": "outlook.com",
}

export async function checkEmail(
  raw: unknown
): Promise<{ ok: true } | { ok: false; message: string }> {
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : ""

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return { ok: false, message: "Adresse email invalide." }
  }

  const [local, domain] = email.split("@")
  const labels = domain.split(".")
  const name = labels[labels.length - 2] ?? ""

  if (local.length < 2 || name.length < 2) {
    return {
      ok: false,
      message: "Cette adresse email semble incorrecte. Utilise ta vraie adresse.",
    }
  }

  if (TYPOS[domain]) {
    return {
      ok: false,
      message: `Adresse email incorrecte — voulais-tu dire @${TYPOS[domain]} ?`,
    }
  }

  if (DISPOSABLE.has(domain)) {
    return {
      ok: false,
      message: "Les adresses email temporaires ne sont pas acceptées.",
    }
  }

  // Le domaine reçoit-il du courrier ? (enregistrement MX, ou à défaut A)
  // Une panne DNS passagère ne doit jamais bloquer une vraie cliente :
  // seules les réponses "domaine inexistant / sans serveur mail" refusent.
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 3000)
    if (mx.length > 0) return { ok: true }
  } catch (err: any) {
    if (err?.code !== "ENODATA" && err?.code !== "ENOTFOUND") return { ok: true }
    try {
      const a = await withTimeout(dns.resolve4(domain), 3000)
      if (a.length > 0) return { ok: true }
    } catch (err2: any) {
      if (err2?.code !== "ENODATA" && err2?.code !== "ENOTFOUND") return { ok: true }
    }
  }

  return {
    ok: false,
    message: "Ce domaine email n'existe pas ou ne reçoit pas de courrier.",
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) }
    )
  })
}
