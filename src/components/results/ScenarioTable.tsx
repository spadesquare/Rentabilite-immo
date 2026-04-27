"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"

interface Props { result: CalculatorResult }

const SCENARIO_STYLES = {
  Pessimiste: { bg: 'bg-red-50/60 border-red-100', header: 'text-red-600', badge: 'bg-red-100 text-red-600' },
  Base:       { bg: 'bg-indigo-50/60 border-indigo-200', header: 'text-indigo-700', badge: 'bg-indigo-500 text-white' },
  Optimiste:  { bg: 'bg-emerald-50/60 border-emerald-100', header: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-600' },
}

const SCENARIO_SUBTITLES = {
  Pessimiste: 'Vacance +3%, loyer -10%, charges +10%',
  Base: 'Vos hypothèses actuelles',
  Optimiste: 'Vacance -1%, loyer +5%, revente +10%',
}

export function ScenarioTable({ result }: Props) {
  const { scenarios, inputs } = result

  const rows = [
    { label: 'Rendement brut', key: 'rendement_brut', fmt: (v: number) => `${v.toFixed(2)} %` },
    { label: 'Rendement net', key: 'rendement_net', fmt: (v: number) => `${v.toFixed(2)} %` },
    { label: 'Rendement net-net', key: 'rendement_net_net', fmt: (v: number) => `${v.toFixed(2)} %` },
    { label: 'Cash flow / mois', key: 'cashflow_mensuel', fmt: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(0)} €` },
    { label: 'Effort mensuel', key: 'effort_mensuel', fmt: (v: number) => `${v.toFixed(0)} €` },
    { label: `Revente nette (${inputs.duree_detention}a)`, key: 'net_revente_total', fmt: (v: number) => `${(v / 1000).toFixed(0)}k €` },
  ]

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Analyse de scénarios</h3>
        <p className="text-xs text-slate-500 mt-0.5">Comparaison pessimiste / base / optimiste</p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {scenarios.map(s => {
          const style = SCENARIO_STYLES[s.label]
          return (
            <div key={s.label} className={`rounded-xl p-3 border ${style.bg}`}>
              <span className={`inline-block text-xs font-bold rounded-full px-2 py-0.5 mb-1.5 ${style.badge}`}>
                {s.label}
              </span>
              <p className="text-xs text-slate-500 leading-tight">{SCENARIO_SUBTITLES[s.label]}</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-1">
        {rows.map(row => (
          <div key={row.label} className="grid grid-cols-4 gap-2 py-1.5 border-b border-white/40 last:border-0">
            <span className="text-xs text-slate-500 col-span-1 self-center">{row.label}</span>
            {scenarios.map(s => {
              const val = s[row.key as keyof typeof s] as number
              const baseVal = scenarios[1][row.key as keyof typeof scenarios[1]] as number
              const isBetter = row.key !== 'effort_mensuel' ? val > baseVal : val < baseVal
              const isWorse = row.key !== 'effort_mensuel' ? val < baseVal : val > baseVal
              return (
                <span
                  key={s.label}
                  className={`text-xs font-semibold text-center ${
                    s.label === 'Base' ? 'text-indigo-700 font-bold' :
                    isBetter ? 'text-emerald-600' :
                    isWorse ? 'text-red-500' :
                    'text-slate-600'
                  }`}
                >
                  {row.fmt(val)}
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
