"use client"

import type { CalculatorResult } from "@/types/calculator"
import { GlassCard } from "@/components/shared/GlassCard"
import { TrendingUp, TrendingDown, Wallet, Euro } from "lucide-react"
import { formatEur } from "@/lib/calculator"

interface Props { result: CalculatorResult }

function KpiCard({ label, value, sub, icon, positive, negative }: {
  label: string; value: string; sub: string
  icon: React.ReactNode; positive?: boolean; negative?: boolean
}) {
  return (
    <GlassCard strong className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
        <span className="text-slate-400">{icon}</span>
      </div>
      <div>
        <p className={`text-3xl font-bold tracking-tight ${
          positive ? 'text-emerald-600' : negative ? 'text-red-500' : 'text-slate-800'
        }`}>
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </div>
    </GlassCard>
  )
}

export function KpiCards({ result }: Props) {
  const { rendement_brut, rendement_net, rendement_net_net, cashflow_mensuel, effort_mensuel, taux_effort, acquisition } = result

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        label="Rendement brut"
        value={`${rendement_brut.toFixed(2)} %`}
        sub={`Loyers / ${formatEur(acquisition.total_acquisition, 0)}`}
        icon={<TrendingUp className="w-4 h-4" />}
        positive={rendement_brut > 5}
        negative={rendement_brut < 3}
      />
      <KpiCard
        label="Rendement net"
        value={`${rendement_net.toFixed(2)} %`}
        sub="Après charges, avant impôts"
        icon={<TrendingUp className="w-4 h-4" />}
        positive={rendement_net > 3.5}
        negative={rendement_net < 2}
      />
      <KpiCard
        label="Rendement net-net"
        value={`${rendement_net_net.toFixed(2)} %`}
        sub={`Après charges + impôts (TMI ${result.inputs.tmi}%)`}
        icon={<TrendingUp className="w-4 h-4" />}
        positive={rendement_net_net > 2.5}
        negative={rendement_net_net < 1}
      />
      <KpiCard
        label={cashflow_mensuel >= 0 ? "Cash flow" : "Effort mensuel"}
        value={cashflow_mensuel >= 0 ? `+${cashflow_mensuel.toFixed(0)} €/mois` : `${(-cashflow_mensuel).toFixed(0)} €/mois`}
        sub={cashflow_mensuel >= 0
          ? "Autofinancé ✓"
          : `${taux_effort.toFixed(1)}% des revenus du foyer`}
        icon={cashflow_mensuel >= 0 ? <Wallet className="w-4 h-4" /> : <Euro className="w-4 h-4" />}
        positive={cashflow_mensuel >= 0}
        negative={cashflow_mensuel < -500}
      />
    </div>
  )
}
