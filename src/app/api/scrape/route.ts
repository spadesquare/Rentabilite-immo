import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"
import type { DPE } from "@/types/calculator"

export interface ScrapeResult {
  // Bien
  prix?: number
  surface?: number
  type_bien?: "ancien" | "neuf"
  frais_agence?: number
  travaux?: number
  mobilier?: number
  age_bien?: number
  annee_construction?: number
  dpe?: DPE
  zone_toulouse?: string
  meuble?: boolean

  // Charges
  charges_copro_annuelles?: number
  taxe_fonciere?: number

  // Revenus (si annonce locative)
  loyer_hc?: number
  charges_recuperables?: number

  // Meta
  titre?: string
  source?: string
  nb_pieces?: number
  error?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.5",
      "Cache-Control": "no-cache",
    },
    redirect: "follow",
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function parsePrice(text: string): number | undefined {
  if (!text) return undefined
  const clean = text.replace(/\s/g, "").replace(/[€$£]/g, "").replace(",", ".")
  const m = clean.match(/(\d+(?:\.\d+)?)/)
  if (!m) return undefined
  const n = parseFloat(m[1])
  return n > 10_000 && n < 10_000_000 ? Math.round(n) : undefined
}

function parseSurface(text: string): number | undefined {
  if (!text) return undefined
  const m = text.replace(/\s/g, "").match(/(\d+[,.]?\d*)\s*m[²2]/i)
  if (!m) return undefined
  const n = parseFloat(m[1].replace(",", "."))
  return n > 5 && n < 1000 ? Math.round(n) : undefined
}

function parseYear(text: string): number | undefined {
  const m = text.match(/(?:construit|construction|bâti|année|built|year)\D{0,20}(19\d{2}|20[012]\d)/i)
    ?? text.match(/\b(19[5-9]\d|200\d|201\d|202[0-5])\b/)
  if (!m) return undefined
  const y = parseInt(m[1])
  return y >= 1800 && y <= 2025 ? y : undefined
}

function parseDPE(text: string): DPE | undefined {
  const m = text.match(/\bDPE\s*[:\-–]?\s*([A-G])\b/i)
    ?? text.match(/\b(?:classe|class|étiquette|lettre)\s*[:\-–]?\s*([A-G])\b/i)
    ?? text.match(/\bénergie\s*[:\-–]?\s*([A-G])\b/i)
    ?? text.match(/\b([A-G])\s*(?:DPE|classe énergie)/i)
  return m ? m[1].toUpperCase() as DPE : undefined
}

function parseChargesCopro(text: string): number | undefined {
  const m = text.match(/charges?\s*(?:de\s*)?(?:copro(?:priété)?|syndicat)\D{0,10}([\d\s]+)\s*€?(?:\s*\/\s*an)?/i)
    ?? text.match(/([\d\s]{3,7})\s*€?\s*(?:de\s*)?charges?\s*(?:annuelles?|\/\s*an)/i)
  if (!m) return undefined
  const n = parsePrice(m[1])
  return n && n > 100 && n < 30_000 ? n : undefined
}

function parseTaxeFonciere(text: string): number | undefined {
  const m = text.match(/taxe\s*foncière\s*[:\-–]?\s*([\d\s]+)\s*€?/i)
    ?? text.match(/([\d\s]{3,6})\s*€?\s*de\s*taxe\s*foncière/i)
  if (!m) return undefined
  const n = parsePrice(m[1])
  return n && n > 50 && n < 10_000 ? n : undefined
}

function parseLoyer(text: string): number | undefined {
  const m = text.match(/loyer\s*(?:mensuel|hc|h\.c\.?|nu)?\s*[:\-–]?\s*([\d\s]+)\s*€?(?:\s*\/\s*mois)?/i)
    ?? text.match(/([\d\s]{3,5})\s*€?\s*\/\s*mois/i)
  if (!m) return undefined
  const n = parsePrice(m[1])
  return n && n > 100 && n < 10_000 ? n : undefined
}

function detectTypeBien(text: string): "ancien" | "neuf" | undefined {
  if (/\b(?:neuf|programme neuf|vefa|livraison|promotion|résidence neuve|immeuble neuf)\b/i.test(text)) return "neuf"
  if (/\b(?:ancien|rénov|réhabilit|années \d{2}|construit en 1[0-9])\b/i.test(text)) return "ancien"
  return undefined
}

function detectMeuble(text: string): boolean {
  return /\b(?:meublé|meublee|furnished|lmnp|location meublée)\b/i.test(text)
}

function detectFraisAgence(text: string): number | undefined {
  const m = text.match(/honoraires?\s*(?:d['']agence|acheteur|acquéreur)?\s*[:\-–]?\s*([\d\s]+)\s*€?/i)
    ?? text.match(/frais\s*d['']agence\s*[:\-–]?\s*([\d\s]+)\s*€?/i)
    ?? text.match(/([\d\s]{4,6})\s*€?\s*(?:d['']honoraires|d['']agence)/i)
  if (!m) return undefined
  const n = parsePrice(m[1])
  return n && n > 500 && n < 100_000 ? n : undefined
}

function matchToulouseZone(text: string): string | undefined {
  const lower = text.toLowerCase()
  const zones: { keywords: string[]; zone: string }[] = [
    { keywords: ["capitole", "carmes", "saint-étienne", "esquirol", "daurade", "wilson", "jean-jaurès", "place du parlement"], zone: "Centre (Capitole, Carmes)" },
    { keywords: ["saint-cyprien", "st-cyprien", "côte pavée", "rangueil", "guilhemery", "saint-aubin", "st aubin"], zone: "Proche centre (Saint-Cyprien, Côte Pavée)" },
    { keywords: ["minimes", "bonnefoy", "croix-daurade", "papus", "barrière de paris", "sept deniers", "izards", "trois cocus"], zone: "Péri-centre (Minimes, Bonnefoy)" },
    { keywords: ["blagnac"], zone: "Blagnac / Colomiers / Tournefeuille" },
    { keywords: ["colomiers"], zone: "Blagnac / Colomiers / Tournefeuille" },
    { keywords: ["tournefeuille"], zone: "Blagnac / Colomiers / Tournefeuille" },
    { keywords: ["muret"], zone: "Sud Toulouse (Muret, Ramonville)" },
    { keywords: ["ramonville", "labège", "escalquens", "castanet"], zone: "Sud Toulouse (Muret, Ramonville)" },
    { keywords: ["balma", "quint-fonsegrives", "montrabé", "pin-balma"], zone: "Est Toulouse (Balma, Quint-Fonsegrives)" },
    { keywords: ["toulouse", "31000", "31100", "31200", "31300", "31400", "31500"], zone: "Péri-centre (Minimes, Bonnefoy)" },
  ]
  for (const { keywords, zone } of zones) {
    if (keywords.some(k => lower.includes(k))) return zone
  }
  return undefined
}

// Deep-search an arbitrary JS object for a key, returning first match
function deepFind(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined
  for (const key of keys) {
    if (key in (obj as Record<string, unknown>)) {
      const v = (obj as Record<string, unknown>)[key]
      if (v !== null && v !== undefined) return v
    }
  }
  for (const val of Object.values(obj as Record<string, unknown>)) {
    const found = deepFind(val, keys)
    if (found !== undefined) return found
  }
  return undefined
}

function deepFindAll(obj: unknown, keys: string[]): unknown[] {
  const results: unknown[] = []
  function walk(o: unknown) {
    if (!o || typeof o !== "object") return
    for (const key of keys) {
      if (key in (o as Record<string, unknown>)) {
        const v = (o as Record<string, unknown>)[key]
        if (v !== null && v !== undefined) results.push(v)
      }
    }
    for (const val of Object.values(o as Record<string, unknown>)) walk(val)
  }
  walk(obj)
  return results
}

// ── Generic text enrichment (applied to all sources) ─────────────────────────

function enrichFromText(text: string, result: ScrapeResult): void {
  if (!result.dpe) result.dpe = parseDPE(text)
  if (!result.charges_copro_annuelles) result.charges_copro_annuelles = parseChargesCopro(text)
  if (!result.taxe_fonciere) result.taxe_fonciere = parseTaxeFonciere(text)
  if (!result.type_bien) result.type_bien = detectTypeBien(text)
  if (!result.zone_toulouse) result.zone_toulouse = matchToulouseZone(text)
  if (!result.frais_agence) result.frais_agence = detectFraisAgence(text)
  if (!result.loyer_hc) result.loyer_hc = parseLoyer(text)
  if (!result.meuble) result.meuble = detectMeuble(text)

  // Year of construction → age_bien
  if (!result.annee_construction) {
    const y = parseYear(text)
    if (y) {
      result.annee_construction = y
      result.age_bien = new Date().getFullYear() - y
    }
  }
}

// ── JSON-LD enrichment ────────────────────────────────────────────────────────

function enrichFromJsonLd(data: unknown, result: ScrapeResult): void {
  const price = deepFind(data, ["price", "prix"]) as string | number | undefined
  if (price && !result.prix) result.prix = parsePrice(String(price))

  const surface = deepFind(data, ["floorSize", "surface", "livingArea"]) as unknown
  if (surface) {
    const val = typeof surface === "object" ? (surface as Record<string, unknown>).value : surface
    if (val && !result.surface) result.surface = parseSurface(String(val))
  }

  const name = deepFind(data, ["name", "title"]) as string | undefined
  if (name && !result.titre) result.titre = name

  const desc = deepFind(data, ["description"]) as string | undefined
  if (desc) enrichFromText(desc, result)

  const addr = deepFind(data, ["address", "addressLocality", "streetAddress"]) as string | unknown
  if (addr) {
    const addrStr = typeof addr === "string" ? addr : JSON.stringify(addr)
    if (!result.zone_toulouse) result.zone_toulouse = matchToulouseZone(addrStr)
  }

  // DPE often in energyEfficiencyScaleMin/Max or energyClass
  const energyClass = deepFind(data, ["energyEfficiencyScaleMin", "energyClass", "energyRating", "dpe"]) as string | undefined
  if (energyClass && !result.dpe) result.dpe = parseDPE(String(energyClass))

  // nb rooms
  const rooms = deepFind(data, ["numberOfRooms", "rooms", "pieces", "nb_pieces"]) as string | number | undefined
  if (rooms && !result.nb_pieces) result.nb_pieces = parseInt(String(rooms)) || undefined

  // Year built
  const yearBuilt = deepFind(data, ["yearBuilt", "constructionYear", "anneeConstruction", "buildingYear"]) as string | number | undefined
  if (yearBuilt && !result.annee_construction) {
    const y = parseInt(String(yearBuilt))
    if (y >= 1800 && y <= 2025) {
      result.annee_construction = y
      result.age_bien = new Date().getFullYear() - y
    }
  }
}

// ── __NEXT_DATA__ / window data enrichment ────────────────────────────────────

function enrichFromNextData(data: unknown, result: ScrapeResult): void {
  enrichFromJsonLd(data, result)

  // Attributes array (LeBonCoin style)
  const atts = deepFindAll(data, ["attributes"]).flat()
  for (const att of atts) {
    if (!att || typeof att !== "object") continue
    const a = att as Record<string, unknown>
    const key = String(a.key ?? a.name ?? "").toLowerCase()
    const val = String(a.value ?? a.values ?? "")
    if (!result.surface && (key.includes("surface") || key.includes("square"))) result.surface = parseSurface(val)
    if (!result.nb_pieces && (key.includes("rooms") || key.includes("pieces") || key.includes("pièces"))) result.nb_pieces = parseInt(val) || undefined
    if (!result.dpe && (key.includes("dpe") || key.includes("energy") || key.includes("energie"))) result.dpe = parseDPE(val) ?? parseDPE(key)
    if (!result.annee_construction && (key.includes("year") || key.includes("annee") || key.includes("construction"))) {
      const y = parseInt(val)
      if (y >= 1800 && y <= 2025) { result.annee_construction = y; result.age_bien = new Date().getFullYear() - y }
    }
    if (!result.charges_copro_annuelles && key.includes("charge")) result.charges_copro_annuelles = parseChargesCopro(val)
    if (!result.taxe_fonciere && key.includes("taxe")) result.taxe_fonciere = parseTaxeFonciere(val)
    if (!result.frais_agence && key.includes("honoraire")) result.frais_agence = parsePrice(val)
    if (!result.type_bien && key.includes("type")) result.type_bien = detectTypeBien(val)
  }

  // Criteria / features arrays
  const criteria = deepFindAll(data, ["criteria", "features", "details", "caracteristiques"]).flat()
  for (const c of criteria) {
    if (typeof c === "string") enrichFromText(c, result)
    else if (c && typeof c === "object") {
      const label = String((c as Record<string, unknown>).label ?? (c as Record<string, unknown>).name ?? "")
      const value = String((c as Record<string, unknown>).value ?? (c as Record<string, unknown>).values ?? "")
      enrichFromText(`${label} ${value}`, result)
    }
  }

  // Location
  const city = deepFind(data, ["city", "ville", "commune", "addressLocality"]) as string | undefined
  const zip = deepFind(data, ["zipcode", "postalCode", "codePostal"]) as string | undefined
  const locStr = [city, zip].filter(Boolean).join(" ")
  if (locStr && !result.zone_toulouse) result.zone_toulouse = matchToulouseZone(locStr)
}

// ── HTML selectors helpers ────────────────────────────────────────────────────

function scrapeWithCheerio(html: string, source: string): ScrapeResult {
  const $ = cheerio.load(html)
  const result: ScrapeResult = { source }

  // 1. JSON-LD (multiple blocks)
  $('script[type="application/ld+json"]').each((_, el) => {
    try { enrichFromJsonLd(JSON.parse($(el).html() || ""), result) } catch { /* ignore */ }
  })

  // 2. __NEXT_DATA__
  const nextDataRaw = $('script#__NEXT_DATA__').html()
  if (nextDataRaw) {
    try { enrichFromNextData(JSON.parse(nextDataRaw), result) } catch { /* ignore */ }
  }

  // 3. window.__data__ / window.initialState / window.APP_STATE in inline scripts
  $("script:not([src])").each((_, el) => {
    const txt = $(el).html() || ""
    if (txt.length < 100) return

    // Try to extract JSON from common patterns
    const patterns = [
      /window\.__(?:data|state|initialState|APP_STATE|pageData|listingData|adData)\s*=\s*(\{[\s\S]+?\});?\s*(?:window|$)/,
      /window\[['"]__data['"]\]\s*=\s*(\{[\s\S]+?\});/,
      /"listing"\s*:\s*(\{[\s\S]{50,5000}\})/,
      /"property"\s*:\s*(\{[\s\S]{50,5000}\})/,
      /"ad"\s*:\s*(\{[\s\S]{50,5000}\})/,
    ]
    for (const pat of patterns) {
      const m = txt.match(pat)
      if (m) {
        try { enrichFromNextData(JSON.parse(m[1]), result); break } catch { /* ignore */ }
      }
    }
  })

  // 4. Meta tags
  const ogDesc = $('meta[property="og:description"]').attr("content") || ""
  const ogTitle = $('meta[property="og:title"], meta[name="title"]').attr("content") || ""
  if (!result.titre && ogTitle) result.titre = ogTitle
  if (ogDesc) enrichFromText(ogDesc, result)

  // 5. Visible page text — build a focused text blob from key sections
  const sections = [
    '[data-testid*="price"], [class*="price"], [class*="prix"], [itemprop="price"]',
    '[data-testid*="surface"], [class*="surface"], [itemprop="floorSize"]',
    '[data-testid*="criteria"], [class*="criteria"], [class*="critere"], [class*="detail"]',
    '[class*="description"], [class*="content"], [itemprop="description"]',
    '[class*="location"], [class*="address"], [class*="localisation"], [itemprop="address"]',
    '[class*="dpe"], [class*="energy"], [class*="energie"], [class*="diagnostic"]',
    '[class*="charge"], [class*="copro"]',
    '[class*="taxe"], [class*="foncier"]',
    '[class*="feature"], [class*="caracteristique"]',
    "h1, h2",
  ]

  const pageText = sections
    .flatMap(sel => $(sel).map((_, el) => $(el).text().trim()).get())
    .filter(Boolean)
    .join(" | ")

  enrichFromText(pageText, result)

  // 6. Full body text fallback for anything missed
  const bodyText = $("body").text().replace(/\s+/g, " ").slice(0, 8000)
  enrichFromText(bodyText, result)

  return result
}

// ── Site-specific post-processing ─────────────────────────────────────────────

function postProcessSeLoger(result: ScrapeResult, html: string): ScrapeResult {
  const $ = cheerio.load(html)

  // SeLoger often buries price in a data attribute or specific class
  if (!result.prix) {
    const candidates = [
      $('[data-testid="adview-price-label"]').text(),
      $('[class*="TagPrice"]').first().text(),
      $('span[data-testid*="price"]').first().text(),
      $('[class*="price__value"]').first().text(),
    ]
    for (const c of candidates) { result.prix = result.prix ?? parsePrice(c) }
  }

  // DPE badge
  if (!result.dpe) {
    const dpeBadge = $('[class*="Dpe"], [class*="dpe"], [class*="Energy"], [data-testid*="dpe"]').first().text()
    result.dpe = parseDPE(dpeBadge)
  }

  return result
}

function postProcessLeBonCoin(result: ScrapeResult, html: string): ScrapeResult {
  const $ = cheerio.load(html)

  if (!result.prix) {
    const priceText = $('[data-qa-id="adview_price"], [class*="price"], [data-testid*="price"]').first().text()
    result.prix = parsePrice(priceText)
  }

  // LBC criteria list
  $('[data-qa-id*="criteria_item"], [class*="criteriaItem"], li[class*="item"]').each((_, el) => {
    enrichFromText($(el).text(), result)
  })

  return result
}

function postProcessPAP(result: ScrapeResult, html: string): ScrapeResult {
  const $ = cheerio.load(html)

  if (!result.prix) {
    result.prix = parsePrice($(".prix, [class*='prix'], [itemprop='price']").first().text())
  }
  if (!result.surface) {
    $(".critere-criteres li, .criteres li, [class*='surface']").each((_, el) => {
      result.surface = result.surface ?? parseSurface($(el).text())
    })
  }

  $(".bien-detail-description, .texte-annonce, [class*='description']").each((_, el) => {
    enrichFromText($(el).text(), result)
  })

  return result
}

function postProcessBienIci(result: ScrapeResult, html: string): ScrapeResult {
  const $ = cheerio.load(html)

  if (!result.prix) {
    result.prix = parsePrice($('[class*="price"], [data-testid*="price"]').first().text())
  }

  $('[class*="PropertyFeature"], [class*="feature"], li[class*="info"]').each((_, el) => {
    enrichFromText($(el).text(), result)
  })

  return result
}

// ── Router ────────────────────────────────────────────────────────────────────

type KnownSource = "seloger" | "leboncoin" | "pap" | "bienici" | "unknown"

function detectSource(url: string): KnownSource {
  if (url.includes("seloger.com")) return "seloger"
  if (url.includes("leboncoin.fr")) return "leboncoin"
  if (url.includes("pap.fr")) return "pap"
  if (url.includes("bienici.com")) return "bienici"
  return "unknown"
}

// ── POST handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 })
    }

    let parsedUrl: URL
    try { parsedUrl = new URL(url) } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 })
    }

    const allowed = ["seloger.com", "leboncoin.fr", "pap.fr", "bienici.com"]
    const hostname = parsedUrl.hostname.replace("www.", "")
    if (!allowed.some(d => hostname.endsWith(d))) {
      return NextResponse.json({ error: "Site non supporté. Utilisez SeLoger, LeBonCoin, PAP ou BienIci." }, { status: 400 })
    }

    const html = await fetchHtml(url)
    const source = detectSource(url)

    // Generic extraction first
    let result = scrapeWithCheerio(html, source)

    // Site-specific post-processing
    if (source === "seloger") result = postProcessSeLoger(result, html)
    else if (source === "leboncoin") result = postProcessLeBonCoin(result, html)
    else if (source === "pap") result = postProcessPAP(result, html)
    else if (source === "bienici") result = postProcessBienIci(result, html)

    // Defaults
    if (!result.type_bien) result.type_bien = "ancien"

    // If furnished detected, suggest mobilier budget based on surface
    if (result.meuble && !result.mobilier && result.surface) {
      result.mobilier = Math.round(result.surface * 80 / 100) * 100
    }

    // Sanity checks — drop implausible values
    if (result.prix && (result.prix < 10_000 || result.prix > 5_000_000)) delete result.prix
    if (result.surface && (result.surface < 5 || result.surface > 500)) delete result.surface
    if (result.charges_copro_annuelles && result.charges_copro_annuelles > 20_000) delete result.charges_copro_annuelles
    if (result.taxe_fonciere && result.taxe_fonciere > 8_000) delete result.taxe_fonciere

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: `Impossible de récupérer l'annonce : ${msg}` }, { status: 500 })
  }
}
