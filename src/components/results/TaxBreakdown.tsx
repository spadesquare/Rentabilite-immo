"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { REGIME_LABELS } from "@/lib/tax"

interface Props { result: CalculatorResult }

export function TaxBreakdown({ result }: Props) {
  const { regime_comparison, inputs } = result

  const data = regime_comparison.map(r => ({
    name: r.label,
    regime: r.regime,
    "Impôt (IR)": Math.max(0, Math.round(r.ir)),
    "Prélèvements sociaux": Math.max(0, Math.round(r.ps)),
    rnn: r.rendement_net_net,
  }))

  const fmtEur = (v: number) => `${v.toLocaleString('fr-FR')} €`

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Comparaison des régimes fiscaux</h3>
        <p className="text-xs text-slate-500 mt-0.5">Impact de chaque régime sur votre imposition (année 1)</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 12, fontSize: 12 }}
            formatter={(v, name) => [fmtEur(Number(v)), String(name)]}
          />
          <Bar dataKey="Impôt (IR)" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.regime === inputs.regime ? '#6366f1' : '#c7d2fe'} />
            ))}
          </Bar>
          <Bar dataKey="Prélèvements sociaux" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.regime === inputs.regime ? '#a78bfa' : '#e0e7ff'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Regime comparison table */}
      <div className="mt-4 space-y-1.5">
        {regime_comparison.map(r => (
          <div
            key={r.regime}
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs transition-all ${
              r.regime === inputs.regime
                ? 'bg-indigo-50/80 border border-indigo-200/60'
                : 'bg-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {r.regime === inputs.regime && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              <span className={`font-medium ${r.regime === inputs.regime ? 'text-indigo-700' : 'text-slate-600'}`}>
                {r.label}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-500">{(r.ir + r.ps).toFixed(0)} € impôt</span>
              <span className={`font-bold ${
                r.rendement_net_net === Math.max(...regime_comparison.map(x => x.rendement_net_net))
                  ? 'text-emerald-600'
                  : r.regime === inputs.regime ? 'text-indigo-600' : 'text-slate-700'
              }`}>
                {r.rendement_net_net.toFixed(2)} % net-net
              </span>
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
