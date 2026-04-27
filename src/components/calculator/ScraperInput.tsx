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

      if (data.prix) { patch.prix = data.prix; labels.push("Prix d'achat") }
      if (data.surface) { patch.surface = data.surface; labels.push("Surface") }
      if (data.type_bien) { patch.type_bien = data.type_bien; labels.push("Type") }
      if (data.zone_toulouse) { patch.zone_toulouse = data.zone_toulouse; labels.push("Zone") }
      if (data.loyer_estime) { patch.loyer_hc = data.loyer_estime; labels.push("Loyer estimé") }
      if (data.travaux) { patch.travaux = data.travaux; labels.push("Travaux") }
      if (data.age_bien) { patch.age_bien = data.age_bien; labels.push("Âge") }

      if (labels.length === 0) {
        setStatus("error")
        setMessage("Aucune donnée exploitable trouvée dans cette annonce.")
        return
      }

      onFill(patch)
      setFilled(labels)
      setStatus("success")
      setMessage(`Données importées depuis ${data.source ?? "l'annonce"}`)
    } catch {
      setStatus("error")
      setMessage("Impossible de contacter le serveur de scraping.")
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
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Champs remplis : {filled.join(", ")}. Vérifiez et complétez les valeurs manquantes.
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
