"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts"

interface Props { result: CalculatorResult }

export function CashFlowChart({ result }: Props) {
  const { projections, inputs } = result

  const data = projections.slice(0, Math.max(inputs.duree_pret, inputs.duree_detention)).map(p => ({
    annee: `A${p.annee}`,
    "Cash flow annuel": Math.round(p.cashflow_apres_financement),
    "Cumul cash flow": Math.round(p.cashflow_cumule),
    "Capital restant": Math.round(p.capital_restant),
  }))

  const fmtEur = (v: number) => `${v >= 0 ? '+' : ''}${v.toLocaleString('fr-FR')} €`

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Cash flow sur {Math.max(inputs.duree_pret, inputs.duree_detention)} ans</h3>
        <p className="text-xs text-slate-500 mt-0.5">Après charges, impôts et remboursement du crédit</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="cfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
          <XAxis dataKey="annee" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
            tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
            formatter={(v, name) => [fmtEur(Number(v)), String(name)]}
          />
          <ReferenceLine y={0} stroke="rgba(100,116,139,0.3)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="Cash flow annuel" stroke="#6366f1" strokeWidth={2} fill="url(#cfGrad)" dot={false} />
          <Area type="monotone" dataKey="Cumul cash flow" stroke="#10b981" strokeWidth={2} fill="url(#cumulGrad)" dot={false} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        </AreaChart>
      </ResponsiveContainer>
    </GlassCard>
  )
}
