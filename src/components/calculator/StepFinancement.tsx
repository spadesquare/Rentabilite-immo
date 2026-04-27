"use client"

import { NumInput } from "@/components/shared/NumInput"
import type { CalculatorInputs } from "@/types/calculator"
import { computeResult } from "@/lib/calculator"
import { TrendingUp } from "lucide-react"

interface Props {
  inputs: CalculatorInputs
  onChange: (patch: Partial<CalculatorInputs>) => void
}

export function StepFinancement({ inputs, onChange }: Props) {
  const totalAcqEstim = inputs.prix + inputs.frais_agence + inputs.prix * (inputs.type_bien === 'neuf' ? 0.025 : 0.075) + inputs.travaux
  const emprunt = Math.max(0, totalAcqEstim - inputs.apport)
  const ltv = totalAcqEstim > 0 ? (emprunt / totalAcqEstim * 100) : 0

  const taux_mensuel = (inputs.taux_interet + inputs.taux_assurance) / 100 / 12
  const n = inputs.duree_pret * 12
  const mensualite_hors_assurance = taux_mensuel > 0 && n > 0
    ? emprunt * taux_mensuel / (1 - Math.pow(1 + taux_mensuel, -n))
    : (n > 0 ? emprunt / n : 0)
  const assurance_mensuelle = emprunt * inputs.taux_assurance / 100 / 12
  const mensualite_totale = mensualite_hors_assurance + assurance_mensuelle

  return (
    <div className="space-y-6">
      {/* Quick summary */}
      <div className="glass rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-500 mb-1">Montant emprunté</p>
          <p className="text-lg font-bold text-slate-800">{emprunt.toLocaleString('fr-FR')} €</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">LTV (taux financement)</p>
          <p className={`text-lg font-bold ${ltv > 90 ? 'text-orange-500' : ltv > 80 ? 'text-amber-500' : 'text-emerald-600'}`}>
            {ltv.toFixed(1)} %
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Mensualité estimée</p>
          <p className="text-lg font-bold text-indigo-600">{mensualite_totale.toFixed(0)} €/mois</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Apport personnel"
          value={inputs.apport}
          onChange={v => onChange({ apport: v })}
          unit="€"
          min={0}
          step={1000}
          hint="Frais de notaire généralement hors emprunt"
          info={{
            title: "Apport personnel",
            definition: "Somme investie de votre poche, déduite du montant à emprunter. Plus l'apport est élevé, moins vous empruntez mais moins vous profitez de l'effet de levier.",
            example: "Pour un bien à 200 000 €, un apport de 40 000 € (20%) donne un emprunt de ~175 000 € (prix + frais de notaire - apport).",
            warning: "Un apport trop faible augmente le LTV et peut faire refuser le prêt. Les banques demandent souvent au moins les frais de notaire."
          }}
        />
        <NumInput
          label="Taux d'intérêt"
          value={inputs.taux_interet}
          onChange={v => onChange({ taux_interet: v })}
          unit="%"
          min={0}
          max={15}
          step={0.05}
          hint="Taux fixe hors assurance"
          info={{
            title: "Taux d'intérêt",
            definition: "Taux nominal annuel du crédit immobilier, hors assurance emprunteur. C'est le coût pur de l'emprunt versé à la banque.",
            example: "En avril 2026, les taux fixes sont ~3.3% sur 15 ans, ~3.5% sur 20 ans, ~3.7% sur 25 ans (hors profil et négociation).",
            warning: "Le TAEG (taux global) inclut en plus l'assurance et les frais de dossier — c'est lui qui permet de comparer vraiment."
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <NumInput
          label="Durée du prêt"
          value={inputs.duree_pret}
          onChange={v => onChange({ duree_pret: v })}
          unit="ans"
          min={1}
          max={30}
          hint="Généralement 15–25 ans en investissement locatif"
          info={{
            title: "Durée du prêt",
            definition: "Nombre d'années sur lesquelles vous remboursez le crédit. Une durée longue réduit la mensualité mais augmente le coût total des intérêts.",
            example: "Sur 200 000 € à 3.5% : mensualité de ~1 429 €/mois sur 15 ans vs ~1 160 €/mois sur 20 ans. Mais le coût total est ~36k€ de plus sur 20 ans.",
            warning: "En investissement locatif, maximiser la durée pour réduire l'effort mensuel est souvent plus pertinent qu'optimiser le coût des intérêts."
          }}
        />
        <NumInput
          label="Assurance emprunteur"
          value={inputs.taux_assurance}
          onChange={v => onChange({ taux_assurance: v })}
          unit="%"
          min={0}
          max={2}
          step={0.01}
          hint="Taux ADI — 0.25–0.45% typique"
          info={{
            title: "Assurance emprunteur (ADI)",
            definition: "Assurance Décès-Invalidité obligatoire pour obtenir un prêt immobilier. Elle rembourse la banque si vous décédez ou devenez invalide.",
            example: "Sur 200 000 € à 0.35% : ~700 €/an d'assurance soit ~58 €/mois en sus de la mensualité.",
            warning: "Depuis la loi Lemoine (2022), vous pouvez changer d'assurance à tout moment — la délégation peut faire économiser 0.2–0.5% par an."
          }}
        />
      </div>

      {/* Interest rate context */}
      <div className="glass rounded-xl p-3 flex items-start gap-2.5">
        <TrendingUp className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-600 space-y-0.5">
          <p className="font-semibold text-slate-700">Taux en vigueur (indicatif, avril 2026)</p>
          <p>15 ans : ~3.3% · 20 ans : ~3.5% · 25 ans : ~3.7%</p>
          <p className="text-slate-400">Hors négociation, profil, et apport. Comparez via un courtier.</p>
        </div>
      </div>
    </div>
  )
}
