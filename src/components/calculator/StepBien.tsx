"use client"

import { NumInput } from "@/components/shared/NumInput"
import type { CalculatorInputs, TypeBien, DPE } from "@/types/calculator"
import { TOULOUSE_ZONES } from "@/data/toulouse"
import { MapPin, Info } from "lucide-react"

interface Props {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

const DPE_OPTIONS: DPE[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']
const DPE_COLORS: Record<DPE, string> = {
  A: 'bg-green-100 text-green-700', B: 'bg-emerald-100 text-emerald-700',
  C: 'bg-lime-100 text-lime-700', D: 'bg-yellow-100 text-yellow-700',
  E: 'bg-orange-100 text-orange-700', F: 'bg-red-100 text-red-700',
  G: 'bg-red-200 text-red-800',
}

export function StepBien({ inputs, onChange }: Props) {
  const zone = TOULOUSE_ZONES.find(z => z.zone === inputs.zone_toulouse)

  return (
    <div className="space-y-6">
      {/* Zone Toulouse */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Zone géographique
        </label>
        <select
          value={inputs.zone_toulouse}
          onChange={e => onChange({ zone_toulouse: e.target.value })}
          className="glass-input rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium"
        >
          {TOULOUSE_ZONES.map(z => (
            <option key={z.zone} value={z.zone}>{z.zone}</option>
          ))}
        </select>
        {zone && (
          <div className="glass rounded-xl p-3 flex gap-3 items-start mt-1">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
            <div className="text-xs text-slate-600 space-y-0.5">
              <p><span className="font-semibold text-slate-700">Prix :</span> {zone.prix_m2[0].toLocaleString('fr-FR')} – {zone.prix_m2[1].toLocaleString('fr-FR')} €/m²</p>
              <p><span className="font-semibold text-slate-700">Loyer :</span> {zone.loyer_m2[0]} – {zone.loyer_m2[1]} €/m²/mois</p>
              <p><span className="font-semibold text-slate-700">Tension :</span> <span className="capitalize">{zone.tension}</span> — vacance estimée {zone.vacance}%</p>
              <p className="text-slate-500 italic">{zone.profil}</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Prix d'achat"
          value={inputs.prix}
          onChange={v => onChange({ prix: v })}
          unit="€"
          min={0}
          step={1000}
          hint={zone ? `Ref. zone: ${zone.prix_m2[0].toLocaleString('fr-FR')}–${zone.prix_m2[1].toLocaleString('fr-FR')} €/m²` : undefined}
        />
        <NumInput
          label="Surface"
          value={inputs.surface}
          onChange={v => onChange({ surface: v })}
          unit="m²"
          min={1}
          hint={inputs.surface > 0 && inputs.prix > 0 ? `${(inputs.prix / inputs.surface).toFixed(0)} €/m²` : undefined}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type de bien</label>
          <div className="flex gap-2">
            {(['ancien', 'neuf'] as TypeBien[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => onChange({ type_bien: t })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  inputs.type_bien === t
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                    : 'glass text-slate-600 hover:bg-white/80'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">
            Frais notaire : {inputs.type_bien === 'neuf' ? '2.5%' : '7.5%'}
          </p>
        </div>

        <NumInput
          label="Frais d'agence"
          value={inputs.frais_agence}
          onChange={v => onChange({ frais_agence: v })}
          unit="€"
          min={0}
          step={500}
          hint="Si achat via agence"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Budget travaux"
          value={inputs.travaux}
          onChange={v => onChange({ travaux: v })}
          unit="€"
          min={0}
          step={500}
          hint="Rénovation avant mise en location"
        />
        <NumInput
          label="Mobilier (LMNP)"
          value={inputs.mobilier}
          onChange={v => onChange({ mobilier: v })}
          unit="€"
          min={0}
          step={200}
          hint="Amortissable sur 7 ans en LMNP Réel"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Âge du bien"
          value={inputs.age_bien}
          onChange={v => onChange({ age_bien: v })}
          unit="ans"
          min={0}
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">DPE</label>
          <div className="flex gap-1.5 flex-wrap">
            {DPE_OPTIONS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ dpe: d })}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  inputs.dpe === d
                    ? DPE_COLORS[d] + ' ring-2 ring-offset-1 ring-current shadow-sm'
                    : 'glass text-slate-500 hover:bg-white/70'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          {(inputs.dpe === 'F' || inputs.dpe === 'G') && (
            <p className="text-xs text-orange-500 font-medium">⚠️ Logement à énergie E/F/G — interdiction progressive de location 2025-2028</p>
          )}
        </div>
      </div>
    </div>
  )
}
