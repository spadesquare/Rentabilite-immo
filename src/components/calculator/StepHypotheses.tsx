"use client"

import { NumInput } from "@/components/shared/NumInput"
import type { CalculatorInputs, TypeLocataire, GestionType } from "@/types/calculator"
import { cn } from "@/lib/utils"

interface Props {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

const LOCATAIRE_OPTIONS: { value: TypeLocataire; label: string; detail: string }[] = [
  { value: 'etudiant', label: 'Étudiant', detail: 'Turnover élevé, faible risque de défaut mais rotations fréquentes' },
  { value: 'jeune_actif', label: 'Jeune actif', detail: 'Bon compromis stabilité / solvabilité' },
  { value: 'famille', label: 'Famille', detail: 'Stabilité élevée, turnover faible' },
  { value: 'professionnel', label: 'Professionnel', detail: 'Solvabilité maximale, risque minimum' },
]

const GESTION_OPTIONS: { value: GestionType; label: string; detail: string }[] = [
  { value: 'directe', label: 'Gestion directe', detail: 'Vous gérez tout — 0% de frais mais temps et implication' },
  { value: 'mandataire', label: 'Gestion mandataire', detail: 'Agence professionnelle — 7–10% du loyer' },
]

export function StepHypotheses({ inputs, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Durée de détention"
          value={inputs.duree_detention}
          onChange={v => onChange({ duree_detention: v })}
          unit="ans"
          min={1}
          max={50}
          hint="Horizon de simulation et calcul de plus-value"
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Taux de vacance : {inputs.taux_vacance}%
          </label>
          <input
            type="range"
            min={0} max={20} step={0.5}
            value={inputs.taux_vacance}
            onChange={e => onChange({ taux_vacance: parseFloat(e.target.value) })}
            className="mt-3 accent-indigo-500"
          />
          <p className="text-xs text-slate-400">
            {inputs.taux_vacance === 0 ? 'Loyer à 100% — hypothèse optimiste' :
             inputs.taux_vacance <= 4 ? 'Zone tendue — réaliste' :
             inputs.taux_vacance <= 8 ? 'Vacance modérée — prudent' : 'Vacance élevée — pessimiste'}
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Évolutions annuelles</p>
        <div className="grid grid-cols-3 gap-4">
          <NumInput
            label="Prix immobilier"
            value={inputs.evolution_prix_annuelle}
            onChange={v => onChange({ evolution_prix_annuelle: v })}
            unit="% /an"
            min={-5} max={10} step={0.1}
            hint="Historique Toulouse : ~2–3% /an"
          />
          <NumInput
            label="Loyer (IRL)"
            value={inputs.evolution_loyer_annuelle}
            onChange={v => onChange({ evolution_loyer_annuelle: v })}
            unit="% /an"
            min={0} max={8} step={0.1}
            hint="IRL 2024 : ~2.5%"
          />
          <NumInput
            label="Charges"
            value={inputs.evolution_charges_annuelle}
            onChange={v => onChange({ evolution_charges_annuelle: v })}
            unit="% /an"
            min={0} max={8} step={0.1}
            hint="Inflation charges : ~2%"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Profil locataire cible</p>
        <div className="grid grid-cols-2 gap-2">
          {LOCATAIRE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ type_locataire: opt.value })}
              className={cn(
                "text-left rounded-xl px-3 py-2.5 transition-all",
                inputs.type_locataire === opt.value
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  : "glass text-slate-700 hover:bg-white/80"
              )}
            >
              <p className={cn("text-sm font-semibold", inputs.type_locataire === opt.value ? "text-white" : "text-slate-800")}>
                {opt.label}
              </p>
              <p className={cn("text-xs mt-0.5 leading-snug", inputs.type_locataire === opt.value ? "text-indigo-100" : "text-slate-500")}>
                {opt.detail}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Mode de gestion</p>
        <div className="grid grid-cols-2 gap-2">
          {GESTION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange({ gestion_type: opt.value })}
              className={cn(
                "text-left rounded-xl px-3 py-2.5 transition-all",
                inputs.gestion_type === opt.value
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  : "glass text-slate-700 hover:bg-white/80"
              )}
            >
              <p className={cn("text-sm font-semibold", inputs.gestion_type === opt.value ? "text-white" : "text-slate-800")}>
                {opt.label}
              </p>
              <p className={cn("text-xs mt-0.5 leading-snug", inputs.gestion_type === opt.value ? "text-indigo-100" : "text-slate-500")}>
                {opt.detail}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
