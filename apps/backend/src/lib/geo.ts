import fs from "node:fs"
import path from "node:path"
import { open, type CityResponse, type Reader } from "maxmind"

/**
 * Localisation d'un visiteur (pays / région / ville) à partir de son IP.
 *
 * L'IP n'est JAMAIS enregistrée : elle sert une seule fois, ici, à retrouver
 * un lieu approximatif, puis elle est oubliée. Seuls le pays, la région et la
 * ville sont conservés avec l'évènement.
 *
 * Base de localisation : fichier .mmdb local (DB-IP "City Lite", gratuit et
 * sans compte, ou MaxMind GeoLite2-City). Chemin : GEOIP_DB_PATH, sinon
 * ./data/geoip-city.mmdb. Sans fichier, la localisation reste simplement vide.
 *
 * Précision : le pays est fiable ; la région et la ville sont APPROXIMATIVES
 * (un abonné mobile peut être localisé au "centre" de son opérateur, souvent
 * Douala ou Yaoundé). Pour les commandes, la ville exacte vient du point de
 * livraison choisi (voir geo-stats.ts).
 */

export type Geo = { country: string | null; region: string | null; city: string | null }
export const NO_GEO: Geo = { country: null, region: null, city: null }

// ---------------------------------------------------------------------------
// Référentiel Cameroun
// ---------------------------------------------------------------------------
export const CAMEROON_REGIONS = [
  "Adamaoua",
  "Centre",
  "Est",
  "Extrême-Nord",
  "Littoral",
  "Nord",
  "Nord-Ouest",
  "Ouest",
  "Sud",
  "Sud-Ouest",
] as const

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()

/** Ville (graphie officielle) -> région. Sert à compléter la région et à normaliser les noms. */
const CITY_REGION: Record<string, string> = {
  Douala: "Littoral", Édéa: "Littoral", Nkongsamba: "Littoral", Loum: "Littoral", Mbanga: "Littoral", Yabassi: "Littoral",
  Yaoundé: "Centre", Mbalmayo: "Centre", Obala: "Centre", Mfou: "Centre", Bafia: "Centre", Eseka: "Centre", Akonolinga: "Centre",
  Bafoussam: "Ouest", Dschang: "Ouest", Bafang: "Ouest", Foumban: "Ouest", Mbouda: "Ouest", Bangangté: "Ouest",
  Bamenda: "Nord-Ouest", Kumbo: "Nord-Ouest", Wum: "Nord-Ouest", Ndop: "Nord-Ouest",
  Buea: "Sud-Ouest", Limbé: "Sud-Ouest", Kumba: "Sud-Ouest", Tiko: "Sud-Ouest", Mamfe: "Sud-Ouest", Muyuka: "Sud-Ouest",
  Garoua: "Nord", Guider: "Nord", Figuil: "Nord",
  Maroua: "Extrême-Nord", Kousséri: "Extrême-Nord", Mokolo: "Extrême-Nord", Yagoua: "Extrême-Nord",
  Ngaoundéré: "Adamaoua", Meiganga: "Adamaoua", Tibati: "Adamaoua", Banyo: "Adamaoua",
  Bertoua: "Est", Batouri: "Est", "Abong-Mbang": "Est", Yokadouma: "Est",
  Ebolowa: "Sud", Kribi: "Sud", Sangmélima: "Sud", Ambam: "Sud",
}
const CITY_BY_KEY = new Map(Object.keys(CITY_REGION).map((c) => [strip(c), c]))

/** Nom de ville "propre" : graphie officielle si connue, sinon casse corrigée. */
export function normalizeCity(raw?: string | null): string | null {
  const t = raw?.trim()
  if (!t) return null
  const known = CITY_BY_KEY.get(strip(t))
  if (known) return known
  return t.replace(/\p{L}[\p{L}'’]*/gu, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

/** Région du Cameroun en français, à partir du nom renvoyé par la base ("Far North", "South-West Region"…). */
export function normalizeCameroonRegion(raw?: string | null): string | null {
  if (!raw) return null
  const s = strip(raw).replace(/\b(region|province)\b/g, "").replace(/\s+/g, " ").trim()
  if (!s) return null
  if (s.includes("littoral") || s === "coastal") return "Littoral"
  if (s.includes("adam")) return "Adamaoua"
  if (s.includes("extreme") || s.includes("far north")) return "Extrême-Nord"
  if ((s.includes("north") && s.includes("west")) || s.includes("nord ouest") || s === "northwest") return "Nord-Ouest"
  if ((s.includes("south") && s.includes("west")) || s.includes("sud ouest") || s === "southwest") return "Sud-Ouest"
  if (s.includes("centre") || s.includes("center") || s.includes("central")) return "Centre"
  if (s === "est" || s.includes("east")) return "Est"
  if (s === "ouest" || s.includes("west")) return "Ouest"
  if (s === "sud" || s.includes("south")) return "Sud"
  if (s === "nord" || s.includes("north")) return "Nord"
  return null
}

/** Région d'une ville du Cameroun, si on la connaît. */
export function regionOfCity(city?: string | null): string | null {
  const c = normalizeCity(city)
  return c ? CITY_REGION[c] ?? null : null
}

// ---------------------------------------------------------------------------
// Lecture de l'IP et recherche
// ---------------------------------------------------------------------------
type HeaderBag = { headers: Record<string, string | string[] | undefined>; socket?: { remoteAddress?: string } }

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/**
 * IP du visiteur derrière nginx. On préfère X-Real-IP (posée par nginx avec
 * $remote_addr, donc non falsifiable), sinon la DERNIÈRE entrée de
 * X-Forwarded-For (celle que nginx ajoute lui-même ; la première pourrait être
 * écrite par le visiteur).
 */
export function clientIp(req: HeaderBag): string | null {
  let ip = first(req.headers["x-real-ip"])?.trim()
  if (!ip) {
    const xff = first(req.headers["x-forwarded-for"])
    if (xff) {
      const parts = xff.split(",").map((p) => p.trim()).filter(Boolean)
      ip = parts[parts.length - 1]
    }
  }
  if (!ip) ip = req.socket?.remoteAddress
  if (!ip) return null
  return ip.replace(/^::ffff:/, "")
}

function isPrivate(ip: string): boolean {
  return (
    ip === "::1" ||
    /^(10\.|127\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip) ||
    /^(fc|fd|fe80)/i.test(ip)
  )
}

let readerPromise: Promise<Reader<CityResponse> | null> | null = null
let warned = false
let warnedPrivate = false

/**
 * Où chercher la base : GEOIP_DB_PATH si défini, sinon le dossier data/ du
 * backend. En production, Medusa tourne depuis apps/backend/.medusa/server :
 * "./data" y serait introuvable, d'où les chemins de remplacement.
 */
function candidatePaths(): string[] {
  const rel = path.join("data", "geoip-city.mmdb")
  const here = typeof __dirname !== "undefined" ? __dirname : null
  return [
    process.env.GEOIP_DB_PATH,
    path.join(process.cwd(), rel),
    path.join(process.cwd(), "..", "..", rel), // cwd = apps/backend/.medusa/server
    here ? path.resolve(here, "..", "..", rel) : undefined, // dev : src/lib -> racine du backend
    here ? path.resolve(here, "..", "..", "..", "..", rel) : undefined, // prod : .medusa/server/src/lib -> racine
  ].filter((p): p is string => Boolean(p))
}

function getReader() {
  readerPromise ??= (async () => {
    const tried = candidatePaths()
    const file = tried.find((f) => fs.existsSync(f))
    if (!file) {
      if (!warned) {
        warned = true
        console.warn(`[geo] base de localisation introuvable, chemins essayés : ${tried.join(" | ")}`)
      }
      return null
    }
    try {
      return await open<CityResponse>(file)
    } catch (e) {
      console.warn("[geo] base de localisation illisible :", (e as Error).message)
      return null
    }
  })()
  return readerPromise
}

/** Localise une IP. Ne lève jamais d'erreur : en cas de doute, renvoie "inconnu". */
export async function locateIp(ip: string | null): Promise<Geo> {
  try {
    if (!ip) return NO_GEO
    if (isPrivate(ip)) {
      if (!warnedPrivate) {
        warnedPrivate = true
        console.warn(
          "[geo] IP de visiteur locale/privée reçue : nginx ne transmet probablement pas X-Real-IP (proxy_set_header X-Real-IP $remote_addr;)."
        )
      }
      return NO_GEO
    }
    const reader = await getReader()
    const r = reader?.get(ip)
    if (!r) return NO_GEO
    const country = r.country?.iso_code ?? null
    const rawCity = r.city?.names?.en ?? null
    const rawRegion = r.subdivisions?.[0]?.names?.en ?? null
    if (country === "CM") {
      const city = normalizeCity(rawCity)
      return { country, region: normalizeCameroonRegion(rawRegion) ?? regionOfCity(city), city }
    }
    return { country, region: rawRegion, city: normalizeCity(rawCity) }
  } catch {
    return NO_GEO
  }
}
