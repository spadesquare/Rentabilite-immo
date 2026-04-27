"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"

interface Props { result: CalculatorResult }

export function RiskScore({ result }: Props) {
  const { risk } = result
  const pct = (risk.score / 10) * 100

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800">Score de risque</h3>
        <p className="text-xs text-slate-500 mt-0.5">Évaluation multi-critères pondérée</p>
      </div>

      {/* Score display */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="32"
              fill="none"
              stroke={risk.color}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color: risk.color }}>{risk.score.toFixed(1)}</span>
            <span className="text-xs text-slate-400">/10</span>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: risk.color }}>{risk.label}</p>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            {risk.label === 'Faible' && 'Profil d\'investissement solide'}
            {risk.label === 'Modéré' && 'Quelques points à surveiller'}
            {risk.label === 'Élevé' && 'Risques significatifs identifiés'}
            {risk.label === 'Très élevé' && 'Risques importants — revoyez les paramètres'}
          </p>
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-2">
        {risk.factors.map(f => (
          <div key={f.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-medium text-slate-700">{f.label}</span>
              <span className="text-slate-500">{f.score.toFixed(1)}/10</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${f.score * 10}%`,
                  background: f.score < 3 ? '#10b981' : f.score < 5.5 ? '#f59e0b' : f.score < 7.5 ? '#f97316' : '#ef4444',
                }}
              />
            </div>
            <p className="text-xs text-slate-400 leading-tight">{f.detail}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  )
}
