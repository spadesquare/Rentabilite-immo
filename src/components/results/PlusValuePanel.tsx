"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"
import { formatEur } from "@/lib/calculator"

interface Props { result: CalculatorResult }

export function PlusValuePanel({ result }: Props) {
  const { plus_value, inputs } = result
  const { prix_revente, pv_brute, abattement_ir_pct, abattement_ps_pct, tax_pv, net_revente } = plus_value

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Plus-value à la revente</h3>
        <p className="text-xs text-slate-500 mt-0.5">Après {inputs.duree_detention} ans de détention</p>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-xs py-2 border-b border-white/40">
          <span className="text-slate-500">Prix de revente estimé</span>
          <span className="font-semibold text-slate-800">{formatEur(prix_revente, 0)}</span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-white/40">
          <span className="text-slate-500">Plus-value brute</span>
          <span className={`font-semibold ${pv_brute >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {pv_brute >= 0 ? '+' : ''}{formatEur(pv_brute, 0)}
          </span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-white/40">
          <span className="text-slate-500">Abattement IR ({abattement_ir_pct.toFixed(0)}%)</span>
          <span className="font-medium text-slate-600">
            {inputs.duree_detention >= 22 ? 'Exonéré ✓' : `${abattement_ir_pct.toFixed(0)}%`}
          </span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-white/40">
          <span className="text-slate-500">Abattement PS ({abattement_ps_pct.toFixed(0)}%)</span>
          <span className="font-medium text-slate-600">
            {inputs.duree_detention >= 30 ? 'Exonéré ✓' : `${abattement_ps_pct.toFixed(0)}%`}
          </span>
        </div>
        <div className="flex justify-between text-xs py-2 border-b border-white/40">
          <span className="text-slate-500">Imposition plus-value</span>
          <span className="font-semibold text-red-500">-{formatEur(tax_pv, 0)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-sm font-bold text-slate-800">Revente nette</span>
          <span className={`text-lg font-bold ${net_revente >= inputs.prix ? 'text-emerald-600' : 'text-orange-500'}`}>
            {formatEur(net_revente, 0)}
          </span>
        </div>
      </div>

      {inputs.duree_detention < 6 && (
        <div className="mt-3 glass rounded-xl p-3 text-xs text-orange-600 bg-orange-50/40">
          ⚠️ Moins de 6 ans : aucun abattement sur la plus-value — imposition pleine (19% IR + 17.2% PS)
        </div>
      )}
    </GlassCard>
  )
}
