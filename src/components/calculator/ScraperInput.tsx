"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link2, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react"
import type { CalculatorInputs } from "@/types/calculator"
import type { ScrapeResult } from "@/app/api/scrape/route"

interface Props {
  onFill: (patch: Partial<CalculatorInputs>) => void
}

type Status = "idle" | "loading" | "success" | "error"

const FIELD_LABELS: Record<string, string> = {
  prix: "Prix d'achat",
  surface: "Surface",
  type_bien: "Type (ancien/neuf)",
  frais_agence: "Frais d'agence",
  travaux: "Travaux",
  mobilier: "Mobilier",
  age_bien: "Âge du bien",
  dpe: "DPE",
  zone_toulouse: "Zone",
  charges_copro_annuelles: "Charges copro",
  taxe_fonciere: "Taxe foncière",
  loyer_hc: "Loyer HC",
  charges_recuperables: "Charges locataire",
}

export function ScraperInput({ onFill }: Props) {
  const [url, setUrl] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  const [filled, setFilled] = useState<string[]>([])

  async function handleScrape() {
    if (!url.trim()) return
    setStatus("loading")
    setMessage("")
    setFilled([])

    try {
      const res = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data: ScrapeResult = await res.json()

      if (data.error) {
        setStatus("error")
        setMessage(data.error)
        return
      }

      const patch: Partial<CalculatorInputs> = {}
      const labels: string[] = []

      function set<K extends keyof CalculatorInputs>(key: K, val: CalculatorInputs[K] | undefined) {
        if (val === undefined || val === null) return
        ;(patch as Record<string, unknown>)[key] = val
        labels.push(FIELD_LABELS[key] ?? key)
      }

      set("prix", data.prix)
      set("surface", data.surface)
      set("type_bien", data.type_bien)
      set("frais_agence", data.frais_agence)
      set("travaux", data.travaux)
      set("mobilier", data.mobilier)
      set("age_bien", data.age_bien)
      set("dpe", data.dpe)
      set("zone_toulouse", data.zone_toulouse)
      set("charges_copro_annuelles", data.charges_copro_annuelles)
      set("taxe_fonciere", data.taxe_fonciere)
      set("loyer_hc", data.loyer_hc)
      set("charges_recuperables", data.charges_recuperables)

      // Infer regime from meublé
      if (data.meuble && !patch.regime) {
        set("regime", "lmnp_reel")
        labels.push("Régime LMNP")
      }

      if (labels.length === 0) {
        setStatus("error")
        setMessage("Aucune donnée exploitable trouvée dans cette annonce. Le site bloque peut-être le scraping.")
        return
      }

      onFill(patch)
      setFilled(labels)
      setStatus("success")
      setMessage(`Données importées depuis ${data.source ?? "l'annonce"}`)
    } catch {
      setStatus("error")
      setMessage("Impossible de contacter le serveur.")
    }
  }

  function reset() {
    setUrl("")
    setStatus("idle")
    setMessage("")
    setFilled([])
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Remplir depuis une annonce
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleScrape()}
          placeholder="Coller l'URL SeLoger, LeBonCoin, PAP ou BienIci…"
          disabled={status === "loading"}
          className="glass-input flex-1 rounded-xl px-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 disabled:opacity-50 min-w-0"
        />
        <button
          type="button"
          onClick={status === "success" ? reset : handleScrape}
          disabled={status === "loading" || (!url.trim() && status !== "success")}
          className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200 disabled:cursor-not-allowed"
        >
          {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
          {status === "success" && <X className="w-4 h-4" />}
          {status !== "loading" && status !== "success" && <Link2 className="w-4 h-4" />}
          <span>
            {status === "loading" ? "Lecture…" : status === "success" ? "Effacer" : "Importer"}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {(status === "success" || status === "error") && (
          <motion.div
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-2"
          >
            {status === "success" && (
              <div className="flex items-start gap-2 rounded-xl bg-emerald-50/80 border border-emerald-200/60 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-700">{message}</p>
                  <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                    <span className="font-medium">{filled.length} champ{filled.length > 1 ? "s" : ""} rempli{filled.length > 1 ? "s" : ""} :</span>{" "}
                    {filled.join(", ")}. Vérifiez et complétez les valeurs manquantes.
                  </p>
                </div>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50/80 border border-red-200/60 px-3 py-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{message}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
