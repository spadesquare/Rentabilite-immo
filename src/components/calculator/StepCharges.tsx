"use client"

import { NumInput } from "@/components/shared/NumInput"
import type { CalculatorInputs } from "@/types/calculator"
import { TOULOUSE_ZONES } from "@/data/toulouse"

interface Props {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

export function StepCharges({ inputs, onChange }: Props) {
  const zone = TOULOUSE_ZONES.find(z => z.zone === inputs.zone_toulouse)
  const loyer_annuel = inputs.loyer_hc * 12
  const charges_non_recup = inputs.charges_copro_annuelles * (inputs.part_non_recuperable_pct / 100)
  const gestion = loyer_annuel * (inputs.frais_gestion_pct / 100)
  const gli_cost = inputs.gli ? loyer_annuel * (inputs.gli_pct / 100) : 0
  const vacance_cost = loyer_annuel * (inputs.taux_vacance / 100)
  const total_charges = charges_non_recup + inputs.taxe_fonciere + inputs.assurance_pno + inputs.entretien_annuel + gestion + gli_cost + vacance_cost

  return (
    <div className="space-y-6">
      {/* Revenus */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Revenus locatifs</p>
        <div className="grid grid-cols-2 gap-4">
          <NumInput
            label="Loyer mensuel HC"
            value={inputs.loyer_hc}
            onChange={v => onChange({ loyer_hc: v })}
            unit="€/mois"
            min={0}
            hint={zone && inputs.surface > 0 ? `Ref: ${(zone.loyer_m2[0] * inputs.surface).toFixed(0)}–${(zone.loyer_m2[1] * inputs.surface).toFixed(0)} €` : undefined}
          />
          <NumInput
            label="Charges récupérables"
            value={inputs.charges_recuperables}
            onChange={v => onChange({ charges_recuperables: v })}
            unit="€/mois"
            min={0}
            hint="Payées par le locataire (provisions)"
          />
        </div>
      </div>

      {/* Charges copropriété */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Copropriété & taxes</p>
        <div className="grid grid-cols-2 gap-4">
          <NumInput
            label="Charges copro (total)"
            value={inputs.charges_copro_annuelles}
            onChange={v => onChange({ charges_copro_annuelles: v })}
            unit="€/an"
            min={0}
            hint="Total annuel (charges appelées)"
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Part non récupérable : {inputs.part_non_recuperable_pct}%
            </label>
            <input
              type="range"
              min={0} max={100} step={5}
              value={inputs.part_non_recuperable_pct}
              onChange={e => onChange({ part_non_recuperable_pct: parseInt(e.target.value) })}
              className="mt-3 accent-indigo-500"
            />
            <p className="text-xs text-slate-400">Part propriétaire : {charges_non_recup.toFixed(0)} €/an</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <NumInput
            label="Taxe foncière"
            value={inputs.taxe_fonciere}
            onChange={v => onChange({ taxe_fonciere: v })}
            unit="€/an"
            min={0}
            hint={inputs.surface > 0 ? `Ref. Toulouse: ~${(inputs.surface * 18).toFixed(0)} €/an` : undefined}
          />
          <NumInput
            label="Assurance PNO"
            value={inputs.assurance_pno}
            onChange={v => onChange({ assurance_pno: v })}
            unit="€/an"
            min={0}
            hint="Propriétaire Non Occupant — ~150–300 €/an"
          />
        </div>
      </div>

      {/* Gestion & entretien */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gestion & entretien</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Frais de gestion : {inputs.frais_gestion_pct}%
            </label>
            <input
              type="range"
              min={0} max={15} step={0.5}
              value={inputs.frais_gestion_pct}
              onChange={e => onChange({ frais_gestion_pct: parseFloat(e.target.value) })}
              className="mt-3 accent-indigo-500"
            />
            <p className="text-xs text-slate-400">{gestion.toFixed(0)} €/an · 0% direct, 7–10% mandataire</p>
          </div>
          <NumInput
            label="Entretien / réparations"
            value={inputs.entretien_annuel}
            onChange={v => onChange({ entretien_annuel: v })}
            unit="€/an"
            min={0}
            hint={`Ref: ~${(inputs.surface * 5).toFixed(0)}–${(inputs.surface * 10).toFixed(0)} €/an`}
          />
        </div>

        {/* GLI */}
        <div className="mt-4 glass rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">Garantie Loyers Impayés (GLI)</p>
            <p className="text-xs text-slate-400">
              {inputs.gli ? `${gli_cost.toFixed(0)} €/an (${inputs.gli_pct}% du loyer)` : 'Non souscrite — risque impayé non couvert'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {inputs.gli && (
              <input
                type="number"
                value={inputs.gli_pct}
                onChange={e => onChange({ gli_pct: parseFloat(e.target.value) || 0 })}
                step={0.1} min={0} max={8}
                className="glass-input w-16 rounded-lg px-2 py-1.5 text-xs text-center"
              />
            )}
            <button
              type="button"
              onClick={() => onChange({ gli: !inputs.gli })}
              className={`relative w-11 h-6 rounded-full transition-colors ${inputs.gli ? 'bg-indigo-500' : 'bg-slate-200'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${inputs.gli ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Total charges summary */}
      <div className="glass-strong rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-500 mb-0.5">Total charges annuelles estimées</p>
          <p className="text-xs text-slate-400">Hors financement et fiscalité</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold text-slate-800">{total_charges.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €</p>
          <p className="text-xs text-slate-500">{loyer_annuel > 0 ? ((total_charges / loyer_annuel) * 100).toFixed(1) : 0}% du loyer brut</p>
        </div>
      </div>
    </div>
  )
}
