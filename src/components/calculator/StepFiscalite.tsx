"use client"

import type { CalculatorInputs, TaxRegime, TMI } from "@/types/calculator"
import { REGIME_LABELS, REGIME_DESCRIPTIONS } from "@/lib/tax"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { NumInput } from "@/components/shared/NumInput"
import { InfoFlipCard } from "@/components/shared/InfoFlipCard"

interface Props {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

const REGIMES: TaxRegime[] = ['micro_foncier', 'reel_nu', 'lmnp_micro_bic', 'lmnp_reel']
const TMI_OPTIONS: TMI[] = [0, 11, 30, 41, 45]

const REGIME_ICONS: Record<TaxRegime, string> = {
  micro_foncier: '📄',
  reel_nu: '📊',
  lmnp_micro_bic: '🏠',
  lmnp_reel: '⭐',
}

export function StepFiscalite({ inputs, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Tax regime */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Régime fiscal</p>
        <div className="grid grid-cols-1 gap-2">
          {REGIMES.map(regime => {
            const active = inputs.regime === regime
            const isBest = regime === 'lmnp_reel'
            return (
              <button
                key={regime}
                type="button"
                onClick={() => onChange({ regime })}
                className={cn(
                  "relative w-full text-left rounded-xl px-4 py-3 transition-all border",
                  active
                    ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-200"
                    : "glass border-white/60 hover:bg-white/80 text-slate-700"
                )}
              >
                {isBest && !active && (
                  <span className="absolute top-2 right-3 text-xs bg-indigo-100 text-indigo-600 font-semibold rounded-full px-2 py-0.5">
                    Souvent le + avantageux
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-lg">{REGIME_ICONS[regime]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-semibold text-sm", active ? "text-white" : "text-slate-800")}>
                        {REGIME_LABELS[regime]}
                      </span>
                      {active && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <p className={cn("text-xs mt-0.5 leading-snug", active ? "text-indigo-100" : "text-slate-500")}>
                      {REGIME_DESCRIPTIONS[regime]}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* TMI */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Tranche marginale d'imposition (TMI)
          </p>
          <InfoFlipCard
            title="Tranche Marginale d'Imposition"
            definition="Taux d'IR appliqué à la dernière tranche de vos revenus. Les revenus fonciers s'ajoutent à vos revenus actuels et sont taxés à ce taux marginal + 17.2% de prélèvements sociaux."
            example="Avec un TMI de 30% et des revenus fonciers nets de 5 000 €, vous payez 1 500 € d'IR + 860 € de PS = 2 360 € de taxes au total."
            warning="C'est le taux MARGINAL, pas le taux moyen. Seul le dernier euro de revenu est taxé à ce taux — vos autres revenus restent taxés à leurs tranches respectives."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {TMI_OPTIONS.map(tmi => (
            <button
              key={tmi}
              type="button"
              onClick={() => onChange({ tmi })}
              className={cn(
                "flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold transition-all",
                inputs.tmi === tmi
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-200"
                  : "glass text-slate-600 hover:bg-white/80"
              )}
            >
              {tmi}%
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Votre TMI dépend de l'ensemble de vos revenus imposables. Les revenus locatifs s'ajoutent à vos autres revenus.
        </p>
      </div>

      {/* Revenus foyer */}
      <NumInput
        label="Revenus nets mensuels du foyer"
        value={inputs.revenus_mensuels_foyer}
        onChange={v => onChange({ revenus_mensuels_foyer: v })}
        unit="€/mois"
        min={0}
        step={100}
        hint="Utilisé pour calculer le taux d'effort (effort mensuel / revenus)"
        info={{
          title: "Revenus nets du foyer",
          definition: "Revenus nets mensuels de l'ensemble du foyer fiscal (salaires nets, autres revenus). Sert uniquement à calculer votre taux d'effort — n'est pas transmis ni stocké.",
          example: "Un foyer gagnant 4 500 € nets/mois avec une mensualité de 900 € a un taux d'effort de 20% — bien en dessous du seuil bancaire de 35%.",
          warning: "Les banques calculent le taux d'effort sur les revenus bruts (avant IR). En investissement locatif, elles peuvent intégrer 70% des loyers futurs dans les revenus."
        }}
      />

      {/* LMNP note */}
      {(inputs.regime === 'lmnp_reel' || inputs.regime === 'lmnp_micro_bic') && (
        <div className="glass rounded-xl p-3 text-xs text-slate-600 space-y-1 border-l-2 border-indigo-300">
          <p className="font-semibold text-indigo-700">Location meublée (LMNP)</p>
          <p>Le bien doit être loué meublé conformément au décret du 31/07/2015 (lit, table, chaises, plaques, réfrigérateur, ustensiles…).</p>
          {inputs.regime === 'lmnp_reel' && (
            <p>En LMNP Réel, un expert-comptable est recommandé pour l'amortissement — prévoir ~800–1 200 €/an de frais.</p>
          )}
        </div>
      )}
    </div>
  )
}
