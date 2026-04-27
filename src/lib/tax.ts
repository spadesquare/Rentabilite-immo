import type { TaxRegime, AnnualTaxResult } from '@/types/calculator'

export interface TaxParams {
  revenus_bruts: number
  charges_deductibles: number
  interets: number
  prix: number
  travaux: number
  mobilier: number
  regime: TaxRegime
  tmi: number
}

export function computeTax(params: TaxParams): AnnualTaxResult {
  const { revenus_bruts, charges_deductibles, interets, prix, travaux, mobilier, regime, tmi } = params

  let base_imposable = 0
  let deficit_reporte = 0

  switch (regime) {
    case 'micro_foncier':
      base_imposable = revenus_bruts * 0.70
      break

    case 'reel_nu': {
      const net = revenus_bruts - charges_deductibles - interets
      if (net < 0) {
        deficit_reporte = Math.abs(net)
        base_imposable = 0
      } else {
        base_imposable = net
      }
      break
    }

    case 'lmnp_micro_bic':
      base_imposable = revenus_bruts * 0.50
      break

    case 'lmnp_reel': {
      // Amortissement du bien (structure 80%, 25 ans) + mobilier (7 ans)
      const amort_bien = (prix * 0.80 + travaux) / 25
      const amort_mobilier = mobilier > 0 ? mobilier / 7 : 0
      const net = revenus_bruts - charges_deductibles - interets - amort_bien - amort_mobilier
      if (net < 0) {
        // Déficit LMNP non imputable sur autres revenus — reportable sur revenus BIC futurs
        deficit_reporte = Math.abs(net)
        base_imposable = 0
      } else {
        base_imposable = net
      }
      break
    }
  }

  base_imposable = Math.max(0, base_imposable)
  const ir = base_imposable * (tmi / 100)
  const ps = base_imposable * 0.172

  return { base_imposable, ir, ps, total: ir + ps, deficit_reporte }
}

export function computePlusValueTax(pv_brute: number, annees: number): {
  abattement_ir_pct: number
  abattement_ps_pct: number
  tax_pv: number
} {
  if (pv_brute <= 0) return { abattement_ir_pct: 0, abattement_ps_pct: 0, tax_pv: 0 }

  // IR: exonération totale après 22 ans
  let abat_ir = 0
  if (annees >= 22) {
    abat_ir = 1
  } else if (annees >= 6) {
    abat_ir = Math.min((annees - 5) * 0.06, 0.96)
    if (annees === 22) abat_ir = 1
  }

  // PS: exonération totale après 30 ans
  let abat_ps = 0
  if (annees >= 30) {
    abat_ps = 1
  } else if (annees >= 23) {
    const base22 = 16 * 0.0165 + 0.016 // ~28.0% at year 22
    abat_ps = Math.min(base22 + (annees - 22) * 0.09, 1)
  } else if (annees >= 22) {
    abat_ps = 16 * 0.0165 + 0.016
  } else if (annees >= 6) {
    abat_ps = (annees - 5) * 0.0165
  }

  const pv_ir = pv_brute * (1 - abat_ir) * 0.19
  const pv_ps = pv_brute * (1 - abat_ps) * 0.172
  const tax_pv = pv_ir + pv_ps

  return { abattement_ir_pct: abat_ir * 100, abattement_ps_pct: abat_ps * 100, tax_pv }
}

export const REGIME_LABELS: Record<TaxRegime, string> = {
  micro_foncier: 'Micro-foncier',
  reel_nu: 'Réel nu',
  lmnp_micro_bic: 'LMNP Micro-BIC',
  lmnp_reel: 'LMNP Réel',
}

export const REGIME_DESCRIPTIONS: Record<TaxRegime, string> = {
  micro_foncier: 'Abattement 30% — Location nue — Revenus < 15 000€/an',
  reel_nu: 'Déduction des charges réelles — Location nue — Déficit foncier reportable 10 ans',
  lmnp_micro_bic: 'Abattement 50% — Location meublée — Revenus < 77 700€/an',
  lmnp_reel: 'Charges + amortissements déductibles — Location meublée — Souvent le plus avantageux',
}
