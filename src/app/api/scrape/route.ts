import { NextRequest, NextResponse } from "next/server"
import * as cheerio from "cheerio"

export interface ScrapeResult {
  prix?: number
  surface?: number
  nb_pieces?: number
  type_bien?: "ancien" | "neuf"
  zone_toulouse?: string
  loyer_estime?: number
  travaux?: number
  age_bien?: number
  titre?: string
  source?: string
  error?: string
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "fr-FR,fr;q=0.9",
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

function parsePrice(text: string): number | undefined {
  const clean = text.replace(/\s/g, "").replace(/[^\d]/g, "")
  const n = parseInt(clean)
  return n > 10000 && n < 10_000_000 ? n : undefined
}

function parseSurface(text: string): number | undefined {
  const m = text.match(/(\d+[\.,]?\d*)\s*m/i)
  if (!m) return undefined
  const n = parseFloat(m[1].replace(",", "."))
  return n > 5 && n < 1000 ? n : undefined
}

function detectTypeBien(text: string): "ancien" | "neuf" | undefined {
  const lower = text.toLowerCase()
  if (/neuf|programme|vefa|promotion|livraison/i.test(lower)) return "neuf"
  if (/ancien|réno|rénov|années|construi/i.test(lower)) return "ancien"
  return undefined
}

function matchToulouseZone(text: string): string | undefined {
  const zones: { keywords: string[]; zone: string }[] = [
    { keywords: ["capitole", "carmes", "saint-étienne", "esquirol", "daurade"], zone: "Centre (Capitole, Carmes)" },
    { keywords: ["saint-cyprien", "côte pavée", "côté pavée", "rangueil", "st-cyprien"], zone: "Proche centre (Saint-Cyprien, Côte Pavée)" },
    { keywords: ["minimes", "bonnefoy", "croix-daurade", "papus", "barrière de paris"], zone: "Péri-centre (Minimes, Bonnefoy)" },
    { keywords: ["blagnac", "colomiers", "tournefeuille"], zone: "Blagnac / Colomiers / Tournefeuille" },
    { keywords: ["muret", "ramonville", "labège", "escalquens", "castanet"], zone: "Sud Toulouse (Muret, Ramonville)" },
    { keywords: ["balma", "quint-fonsegrives", "montrabé"], zone: "Est Toulouse (Balma, Quint-Fonsegrives)" },
    { keywords: ["toulouse"], zone: "Péri-centre (Minimes, Bonnefoy)" },
  ]
  const lower = text.toLowerCase()
  for (const { keywords, zone } of zones) {
    if (keywords.some(k => lower.includes(k))) return zone
  }
  return undefined
}

// ── SeLoger ──────────────────────────────────────────────────────────────────

function parseSeLoger(html: string): ScrapeResult {
  const $ = cheerio.load(html)
  const result: ScrapeResult = { source: "SeLoger" }

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "")
      if (data.offers?.price) result.prix = parsePrice(String(data.offers.price))
      if (data.floorSize?.value) result.surface = parseSurface(String(data.floorSize.value))
      if (data.name) result.titre = data.name
      if (data.description) {
        result.type_bien = result.type_bien ?? detectTypeBien(data.description)
        result.zone_toulouse = result.zone_toulouse ?? matchToulouseZone(data.description)
      }
    } catch { /* ignore */ }
  })

  // __NEXT_DATA__ / window.__data__
  $("script").each((_, el) => {
    const text = $(el).html() || ""
    if (text.includes("listingDetail") || text.includes("\"price\"")) {
      try {
        const m = text.match(/\{[\s\S]{200,}\}/)
        if (m) {
          const raw = JSON.parse(m[0])
          const price = raw?.props?.pageProps?.listing?.price ?? raw?.price
          if (price) result.prix = result.prix ?? parsePrice(String(price))
          const surface = raw?.props?.pageProps?.listing?.surface ?? raw?.surface
          if (surface) result.surface = result.surface ?? parseSurface(String(surface))
        }
      } catch { /* ignore */ }
    }
  })

  // Fallback: meta tags
  if (!result.prix) {
    const og = $('meta[property="og:description"]').attr("content") || ""
    const priceM = og.match(/(\d[\d\s]*)\s*€/)
    if (priceM) result.prix = parsePrice(priceM[1])
    if (!result.surface) result.surface = parseSurface(og)
  }

  // HTML selectors
  if (!result.prix) {
    const priceText = $('[data-testid="price"], .price, [class*="price"]').first().text()
    result.prix = parsePrice(priceText)
  }
  if (!result.surface) {
    $('[class*="surface"], [class*="criteria"]').each((_, el) => {
      const t = $(el).text()
      if (/m²/i.test(t) && !result.surface) result.surface = parseSurface(t)
    })
  }

  // Address for zone detection
  const addr = $('[class*="address"], [class*="localisation"], [class*="location"]').first().text()
  if (addr) result.zone_toulouse = result.zone_toulouse ?? matchToulouseZone(addr)

  return result
}

// ── LeBonCoin ─────────────────────────────────────────────────────────────────

function parseLeBonCoin(html: string): ScrapeResult {
  const $ = cheerio.load(html)
  const result: ScrapeResult = { source: "LeBonCoin" }

  // JSON-LD
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "")
      const price = data.offers?.price ?? data.price
      if (price) result.prix = result.prix ?? parsePrice(String(price))
      if (data.name) result.titre = data.name
      if (data.address) {
        const addr = typeof data.address === "string" ? data.address : JSON.stringify(data.address)
        result.zone_toulouse = result.zone_toulouse ?? matchToulouseZone(addr)
      }
    } catch { /* ignore */ }
  })

  // __NEXT_DATA__
  const nextData = $('script#__NEXT_DATA__').html()
  if (nextData) {
    try {
      const data = JSON.parse(nextData)
      const ad = data?.props?.pageProps?.ad ?? data?.props?.pageProps?.listing
      if (ad) {
        if (ad.price) result.prix = result.prix ?? parsePrice(String(ad.price))
        if (ad.subject) result.titre = result.titre ?? ad.subject
        const atts: { key: string; value: string }[] = ad.attributes ?? []
        for (const att of atts) {
          if (att.key === "square" || att.key === "surface") result.surface = result.surface ?? parseSurface(att.value)
          if (att.key === "rooms") result.nb_pieces = parseInt(att.value) || undefined
          if (att.key === "estate_type" && /neuf/i.test(att.value)) result.type_bien = "neuf"
        }
        const loc = ad.location ?? {}
        const locStr = [loc.city, loc.zipcode, loc.label].filter(Boolean).join(" ")
        result.zone_toulouse = result.zone_toulouse ?? matchToulouseZone(locStr)
      }
    } catch { /* ignore */ }
  }

  // HTML fallback
  if (!result.prix) {
    const priceText = $('[data-qa-id="adview_price"], [class*="price"]').first().text()
    result.prix = parsePrice(priceText)
  }
  if (!result.surface) {
    $('[data-qa-id*="criteria"] span, [class*="criteria"]').each((_, el) => {
      const t = $(el).text()
      if (/m²/i.test(t)) result.surface = result.surface ?? parseSurface(t)
    })
  }

  return result
}

// ── PAP ───────────────────────────────────────────────────────────────────────

function parsePAP(html: string): ScrapeResult {
  const $ = cheerio.load(html)
  const result: ScrapeResult = { source: "PAP" }

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "")
      if (data.offers?.price) result.prix = result.prix ?? parsePrice(String(data.offers.price))
      if (data.floorSize?.value) result.surface = result.surface ?? parseSurface(String(data.floorSize.value))
      if (data.name) result.titre = data.name
    } catch { /* ignore */ }
  })

  if (!result.prix) {
    const priceText = $(".prix, [class*='prix'], [itemprop='price']").first().text()
    result.prix = parsePrice(priceText)
  }
  if (!result.surface) {
    $(".critere-criteres, [class*='surface'], [itemprop='floorSize']").each((_, el) => {
      const t = $(el).text()
      if (/m²/i.test(t)) result.surface = result.surface ?? parseSurface(t)
    })
  }

  const addr = $(".zone-address, [class*='address'], [class*='localisation']").first().text()
  result.zone_toulouse = matchToulouseZone(addr || $("title").text())

  return result
}

// ── BienIci ───────────────────────────────────────────────────────────────────

function parseBienIci(html: string): ScrapeResult {
  const $ = cheerio.load(html)
  const result: ScrapeResult = { source: "BienIci" }

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "")
      if (data.offers?.price) result.prix = result.prix ?? parsePrice(String(data.offers.price))
      if (data.floorSize?.value) result.surface = result.surface ?? parseSurface(String(data.floorSize.value))
      if (data.name) result.titre = data.name
    } catch { /* ignore */ }
  })

  const nextData = $('script#__NEXT_DATA__').html()
  if (nextData) {
    try {
      const data = JSON.parse(nextData)
      const listing = data?.props?.pageProps?.listing ?? data?.props?.pageProps?.propertyListing
      if (listing) {
        if (listing.price) result.prix = result.prix ?? parsePrice(String(listing.price))
        if (listing.surface) result.surface = result.surface ?? parseSurface(String(listing.surface))
        if (listing.title) result.titre = result.titre ?? listing.title
        const loc = listing.city ?? listing.location ?? ""
        result.zone_toulouse = result.zone_toulouse ?? matchToulouseZone(loc)
      }
    } catch { /* ignore */ }
  }

  return result
}

// ── Router ────────────────────────────────────────────────────────────────────

function detectSource(url: string): "seloger" | "leboncoin" | "pap" | "bienici" | "unknown" {
  if (url.includes("seloger.com")) return "seloger"
  if (url.includes("leboncoin.fr")) return "leboncoin"
  if (url.includes("pap.fr")) return "pap"
  if (url.includes("bienici.com")) return "bienici"
  return "unknown"
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL manquante" }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 })
    }

    const allowed = ["seloger.com", "leboncoin.fr", "pap.fr", "bienici.com"]
    const hostname = parsedUrl.hostname.replace("www.", "")
    if (!allowed.some(d => hostname.endsWith(d))) {
      return NextResponse.json({ error: "Site non supporté. Utilisez SeLoger, LeBonCoin, PAP ou BienIci." }, { status: 400 })
    }

    const html = await fetchHtml(url)
    const source = detectSource(url)

    let result: ScrapeResult
    if (source === "seloger") result = parseSeLoger(html)
    else if (source === "leboncoin") result = parseLeBonCoin(html)
    else if (source === "pap") result = parsePAP(html)
    else if (source === "bienici") result = parseBienIci(html)
    else result = { error: "Site non reconnu", source: "unknown" }

    // Always default type to ancien if not detected
    if (!result.type_bien) result.type_bien = "ancien"

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: `Impossible de récupérer l'annonce : ${msg}` }, { status: 500 })
  }
}
