"use client"

import { useState } from "react"
import type { CalculatorInputs } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"
import { StepBien } from "./StepBien"
import { StepFinancement } from "./StepFinancement"
import { StepCharges } from "./StepCharges"
import { StepFiscalite } from "./StepFiscalite"
import { StepHypotheses } from "./StepHypotheses"
import { ScraperInput } from "./ScraperInput"
import { TOULOUSE_ZONES } from "@/data/toulouse"
import { Calculator as CalcIcon, ChevronRight, ChevronLeft } from "lucide-react"

const DEFAULT_INPUTS: CalculatorInputs = {
  prix: 200_000,
  surface: 45,
  type_bien: 'ancien',
  frais_agence: 8_000,
  travaux: 5_000,
  mobilier: 3_000,
  age_bien: 30,
  dpe: 'D',
  zone_toulouse: TOULOUSE_ZONES[2].zone,

  apport: 40_000,
  taux_interet: 3.5,
  duree_pret: 20,
  taux_assurance: 0.35,

  loyer_hc: 700,
  charges_recuperables: 80,

  charges_copro_annuelles: 1_800,
  part_non_recuperable_pct: 30,
  taxe_fonciere: 900,
  assurance_pno: 180,
  frais_gestion_pct: 0,
  gli: false,
  gli_pct: 3.5,
  entretien_annuel: 400,

  regime: 'lmnp_reel',
  tmi: 30,

  duree_detention: 15,
  evolution_prix_annuelle: 1.5,
  evolution_loyer_annuelle: 2,
  evolution_charges_annuelle: 2,
  taux_vacance: 5,
  type_locataire: 'jeune_actif',
  gestion_type: 'directe',
  revenus_mensuels_foyer: 3_500,
}

const STEPS = [
  { id: 'bien',         label: 'Le bien',      short: 'Bien' },
  { id: 'financement',  label: 'Financement',  short: 'Crédit' },
  { id: 'charges',      label: 'Charges',      short: 'Charges' },
  { id: 'fiscalite',    label: 'Fiscalité',    short: 'Fiscalité' },
  { id: 'hypotheses',   label: 'Hypothèses',   short: 'Hypo.' },
]

interface Props {
  onCalculate: (inputs: CalculatorInputs) => void
}

export function Calculator({ onCalculate }: Props) {
  const [inputs, setInputs] = useState<CalculatorInputs>(DEFAULT_INPUTS)
  const [step, setStep] = useState(0)

  const patch = (p: Partial<CalculatorInputs>) => setInputs(prev => ({ ...prev, ...p }))

  const stepContent = [
    <StepBien key="bien" inputs={inputs} onChange={patch} />,
    <StepFinancement key="fin" inputs={inputs} onChange={patch} />,
    <StepCharges key="charges" inputs={inputs} onChange={patch} />,
    <StepFiscalite key="fiscalite" inputs={inputs} onChange={patch} />,
    <StepHypotheses key="hypo" inputs={inputs} onChange={patch} />,
  ]

  return (
    <GlassCard strong className="p-6 md:p-8">
      {/* Scraper */}
      <ScraperInput onFill={patch} />

      {/* Step indicators */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStep(i)}
            className="flex items-center gap-1 shrink-0"
          >
            <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all text-sm font-medium ${
              i === step
                ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-200'
                : i < step
                ? 'text-indigo-500 bg-indigo-50/80'
                : 'text-slate-400 bg-white/40'
            }`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === step ? 'bg-white text-indigo-500' : i < step ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>{i + 1}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{s.short}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[340px]">
        {stepContent[step]}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/50">
        <button
          type="button"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium glass text-slate-600 hover:bg-white/80 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-200 transition-all"
          >
            Suivant <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCalculate(inputs)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:from-indigo-600 hover:to-violet-600 shadow-lg shadow-indigo-200 transition-all"
          >
            <CalcIcon className="w-4 h-4" /> Calculer la rentabilité
          </button>
        )}
      </div>
    </GlassCard>
  )
}
