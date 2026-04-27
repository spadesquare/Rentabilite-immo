"use client"

import { motion } from "framer-motion"
import type { CalculatorResult } from "@/types/calculator"
import { KpiCards } from "./KpiCards"
import { CashFlowChart } from "./CashFlowChart"
import { TaxBreakdown } from "./TaxBreakdown"
import { RiskScore } from "./RiskScore"
import { ScenarioTable } from "./ScenarioTable"
import { PlusValuePanel } from "./PlusValuePanel"
import { GlassCard } from "@/components/shared/GlassCard"
import { formatEur } from "@/lib/calculator"
import { REGIME_LABELS } from "@/lib/tax"
import { RefreshCw } from "lucide-react"

interface Props {
  result: CalculatorResult
  onReset: () => void
}

const fade = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

export function ResultsDashboard({ result, onReset }: Props) {
  const { inputs, acquisition, mensualite } = result

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={stagger}
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={fade} className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold grad-text">Résultats de l'analyse</h2>
          <p className="text-sm text-slate-500 mt-1">
            {inputs.surface}m² · {inputs.prix.toLocaleString('fr-FR')} € · {REGIME_LABELS[inputs.regime]} · TMI {inputs.tmi}%
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 glass rounded-xl px-3 py-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Modifier
        </button>
      </motion.div>

      {/* Acquisition summary */}
      <motion.div variants={fade}>
        <GlassCard className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
            <div>
              <p className="text-slate-500 mb-1">Prix total d'acquisition</p>
              <p className="font-bold text-slate-800 text-base">{formatEur(acquisition.total_acquisition, 0)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Dont frais notaire</p>
              <p className="font-bold text-slate-700 text-base">{formatEur(acquisition.frais_notaire, 0)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Montant emprunté</p>
              <p className="font-bold text-slate-700 text-base">{formatEur(acquisition.montant_emprunt, 0)}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">Mensualité crédit</p>
              <p className="font-bold text-indigo-600 text-base">{formatEur(mensualite, 0)}/mois</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* KPI strip */}
      <motion.div variants={fade}>
        <KpiCards result={result} />
      </motion.div>

      {/* Charts row */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CashFlowChart result={result} />
        <TaxBreakdown result={result} />
      </motion.div>

      {/* Risk + Scenarios row */}
      <motion.div variants={fade} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RiskScore result={result} />
        <ScenarioTable result={result} />
      </motion.div>

      {/* Plus-value */}
      <motion.div variants={fade}>
        <PlusValuePanel result={result} />
      </motion.div>

      {/* Disclaimer */}
      <motion.div variants={fade}>
        <p className="text-xs text-slate-400 text-center leading-relaxed max-w-2xl mx-auto">
          Ces calculs sont indicatifs et à visée pédagogique. Ils ne constituent pas un conseil fiscal ou financier.
          Consultez un expert-comptable ou un conseiller en gestion de patrimoine pour votre situation personnelle.
          Les données fiscales sont basées sur la législation française en vigueur en 2024-2025.
        </p>
      </motion.div>
    </motion.div>
  )
}
