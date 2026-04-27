import type {
  CalculatorInputs, CalculatorResult, AcquisitionCosts,
  AnnualProjection, PlusValue, RegimeComparison, ScenarioResult,
  TaxRegime,
} from '@/types/calculator'
import { computeTax, computePlusValueTax, REGIME_LABELS } from './tax'
import { computeRisk } from './risk'

// ─── Acquisition ──────────────────────────────────────────────────────────────

function computeAcquisition(inputs: CalculatorInputs): AcquisitionCosts {
  const { prix, type_bien, frais_agence, travaux, apport, taux_interet, duree_pret, taux_assurance } = inputs

  const frais_notaire_pct = type_bien === 'neuf' ? 0.025 : 0.075
  const frais_notaire = prix * frais_notaire_pct

  const total_acquisition = prix + frais_agence + frais_notaire + travaux
  const montant_emprunt = Math.max(0, total_acquisition - apport)
  const frais_garantie = montant_emprunt * 0.01

  return {
    frais_notaire,
    frais_garantie,
    total_acquisition: total_acquisition + frais_garantie,
    montant_emprunt,
  }
}

// ─── Mortgage ─────────────────────────────────────────────────────────────────

function computeMensualite(emprunt: number, taux_interet: number, taux_assurance: number, duree_ans: number): number {
  if (emprunt <= 0 || duree_ans <= 0) return 0
  const taux_mensuel = taux_interet / 100 / 12
  const assurance_mensuelle = emprunt * taux_assurance / 100 / 12
  const n = duree_ans * 12
  const mensualite_ci = taux_mensuel > 0
    ? emprunt * taux_mensuel / (1 - Math.pow(1 + taux_mensuel, -n))
    : emprunt / n
  return mensualite_ci + assurance_mensuelle
}

interface AmortYear {
  annee: number
  interets: number
  capital: number
  restant: number
}

function buildAmortizationSchedule(emprunt: number, taux_interet: number, duree_ans: number): AmortYear[] {
  if (emprunt <= 0 || duree_ans <= 0) return []
  const taux_mensuel = taux_interet / 100 / 12
  const n = duree_ans * 12
  const mensualite = taux_mensuel > 0
    ? emprunt * taux_mensuel / (1 - Math.pow(1 + taux_mensuel, -n))
    : emprunt / n

  let restant = emprunt
  const schedule: AmortYear[] = []

  for (let annee = 1; annee <= duree_ans; annee++) {
    let interets = 0
    let capital = 0
    for (let m = 0; m < 12; m++) {
      if (restant <= 0) break
      const int_m = restant * taux_mensuel
      const cap_m = Math.min(mensualite - int_m, restant)
      interets += int_m
      capital += Math.max(0, cap_m)
      restant = Math.max(0, restant - cap_m)
    }
    schedule.push({ annee, interets, capital, restant })
  }

  return schedule
}

// ─── Annual charges ────────────────────────────────────────────────────────────

function computeAnnualCharges(inputs: CalculatorInputs, loyer_annuel: number, charges_scale: number): number {
  const {
    charges_copro_annuelles, part_non_recuperable_pct, taxe_fonciere,
    assurance_pno, frais_gestion_pct, gli, gli_pct, entretien_annuel, taux_vacance, regime,
  } = inputs

  const comptable = (regime === 'lmnp_reel') ? 1_000 : 0
  const charges_non_recup = charges_copro_annuelles * (part_non_recuperable_pct / 100)
  const gestion = loyer_annuel * (frais_gestion_pct / 100)
  const gli_cost = gli ? loyer_annuel * (gli_pct / 100) : 0
  const vacance_cost = loyer_annuel * (taux_vacance / 100)

  return (
    (charges_non_recup + taxe_fonciere + assurance_pno + entretien_annuel + comptable) * charges_scale
    + gestion + gli_cost + vacance_cost
  )
}

// ─── Projections ──────────────────────────────────────────────────────────────

function buildProjections(
  inputs: CalculatorInputs,
  acquisition: AcquisitionCosts,
  mensualite: number,
  amortSchedule: AmortYear[],
): AnnualProjection[] {
  const maxYears = Math.max(inputs.duree_detention, inputs.duree_pret, 30)
  const projections: AnnualProjection[] = []
  let cashflow_cumule = 0

  for (let annee = 1; annee <= maxYears; annee++) {
    const yr = annee - 1
    const loyer_annuel = inputs.loyer_hc * 12 * Math.pow(1 + inputs.evolution_loyer_annuelle / 100, yr)
    const charges_scale = Math.pow(1 + inputs.evolution_charges_annuelle / 100, yr)
    const charges_annuelles = computeAnnualCharges(inputs, loyer_annuel, charges_scale)

    const sched = amortSchedule[annee - 1]
    const interets = sched?.interets ?? 0
    const capital_restant = sched?.restant ?? 0
    const mensualite_annuelle = annee <= inputs.duree_pret ? mensualite * 12 : 0

    const tax = computeTax({
      revenus_bruts: loyer_annuel,
      charges_deductibles: charges_annuelles,
      interets,
      prix: inputs.prix,
      travaux: inputs.travaux,
      mobilier: inputs.mobilier,
      regime: inputs.regime,
      tmi: inputs.tmi,
    })

    const cashflow_avant = loyer_annuel - charges_annuelles - tax.total
    const cashflow_apres = cashflow_avant - mensualite_annuelle
    cashflow_cumule += cashflow_apres

    projections.push({
      annee,
      loyer_annuel,
      charges_annuelles,
      interets,
      tax,
      cashflow_avant_financement: cashflow_avant,
      cashflow_apres_financement: cashflow_apres,
      cashflow_cumule,
      capital_restant,
    })
  }

  return projections
}

// ─── Plus-value ───────────────────────────────────────────────────────────────

function computePlusValue(inputs: CalculatorInputs, acquisition: AcquisitionCosts, projections: AnnualProjection[]): PlusValue {
  const years = inputs.duree_detention
  const prix_revente = inputs.prix * Math.pow(1 + inputs.evolution_prix_annuelle / 100, years)
  const cout_achat = inputs.prix + inputs.frais_agence + inputs.travaux
  const pv_brute = prix_revente - cout_achat

  const { abattement_ir_pct, abattement_ps_pct, tax_pv } = computePlusValueTax(pv_brute, years)

  const proj = projections[years - 1]
  const capital_restant = proj?.capital_restant ?? 0

  return {
    prix_revente,
    pv_brute,
    abattement_ir_pct,
    abattement_ps_pct,
    tax_pv,
    net_revente: prix_revente - capital_restant - tax_pv,
  }
}

// ─── Regime comparison ────────────────────────────────────────────────────────

function buildRegimeComparison(
  inputs: CalculatorInputs,
  acquisition: AcquisitionCosts,
  loyer_annuel: number,
  charges_y1: number,
  interets_y1: number,
): RegimeComparison[] {
  const regimes: TaxRegime[] = ['micro_foncier', 'reel_nu', 'lmnp_micro_bic', 'lmnp_reel']
  const mensualite = computeMensualite(acquisition.montant_emprunt, inputs.taux_interet, inputs.taux_assurance, inputs.duree_pret)

  return regimes.map(regime => {
    const tax = computeTax({
      revenus_bruts: loyer_annuel,
      charges_deductibles: charges_y1,
      interets: interets_y1,
      prix: inputs.prix,
      travaux: inputs.travaux,
      mobilier: inputs.mobilier,
      regime,
      tmi: inputs.tmi,
    })

    const net_apres_tax = loyer_annuel - charges_y1 - tax.total
    const rnn = (net_apres_tax / acquisition.total_acquisition) * 100
    const cf = net_apres_tax / 12 - mensualite

    return {
      regime,
      label: REGIME_LABELS[regime],
      base_imposable: tax.base_imposable,
      ir: tax.ir,
      ps: tax.ps,
      total_tax: tax.total,
      rendement_net_net: rnn,
      cashflow_mensuel: cf,
    }
  })
}

// ─── Scenarios ────────────────────────────────────────────────────────────────

function buildScenarios(inputs: CalculatorInputs, acquisition: AcquisitionCosts): ScenarioResult[] {
  const mensualite = computeMensualite(acquisition.montant_emprunt, inputs.taux_interet, inputs.taux_assurance, inputs.duree_pret)

  const overrides = [
    { label: 'Pessimiste' as const,  loyer: -0.10, vacance: +3,  prix_rev: -0.10, charges: +0.10 },
    { label: 'Base' as const,        loyer:  0,    vacance:  0,  prix_rev:  0,    charges: 0 },
    { label: 'Optimiste' as const,   loyer: +0.05, vacance: -1,  prix_rev: +0.10, charges: 0 },
  ]

  return overrides.map(ov => {
    const loyer = inputs.loyer_hc * 12 * (1 + ov.loyer)
    const vacance = Math.max(0, inputs.taux_vacance + ov.vacance)
    const charges_scale = 1 + ov.charges
    const charges = computeAnnualCharges({ ...inputs, taux_vacance: vacance }, loyer, charges_scale)
    const interets = acquisition.montant_emprunt * (inputs.taux_interet / 100) // approx y1

    const tax = computeTax({
      revenus_bruts: loyer,
      charges_deductibles: charges,
      interets,
      prix: inputs.prix,
      travaux: inputs.travaux,
      mobilier: inputs.mobilier,
      regime: inputs.regime,
      tmi: inputs.tmi,
    })

    const net = loyer - charges - tax.total
    const rn = (loyer - charges) / acquisition.total_acquisition * 100
    const rnn = net / acquisition.total_acquisition * 100
    const cf = net / 12 - mensualite
    const prix_rev = inputs.prix * Math.pow(1 + (inputs.evolution_prix_annuelle / 100 + ov.prix_rev / inputs.duree_detention), inputs.duree_detention)
    const { tax_pv } = computePlusValueTax(Math.max(0, prix_rev - inputs.prix - inputs.frais_agence - inputs.travaux), inputs.duree_detention)

    return {
      label: ov.label,
      rendement_brut: (loyer / acquisition.total_acquisition) * 100,
      rendement_net: rn,
      rendement_net_net: rnn,
      cashflow_mensuel: cf,
      effort_mensuel: Math.max(0, -cf),
      net_revente_total: prix_rev - tax_pv,
    }
  })
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function computeResult(inputs: CalculatorInputs): CalculatorResult {
  const acquisition = computeAcquisition(inputs)
  const mensualite = computeMensualite(acquisition.montant_emprunt, inputs.taux_interet, inputs.taux_assurance, inputs.duree_pret)

  const amortSchedule = buildAmortizationSchedule(acquisition.montant_emprunt, inputs.taux_interet, inputs.duree_pret)

  const loyer_annuel_y1 = inputs.loyer_hc * 12
  const charges_y1 = computeAnnualCharges(inputs, loyer_annuel_y1, 1)
  const interets_y1 = amortSchedule[0]?.interets ?? (acquisition.montant_emprunt * inputs.taux_interet / 100)

  const tax_y1 = computeTax({
    revenus_bruts: loyer_annuel_y1,
    charges_deductibles: charges_y1,
    interets: interets_y1,
    prix: inputs.prix,
    travaux: inputs.travaux,
    mobilier: inputs.mobilier,
    regime: inputs.regime,
    tmi: inputs.tmi,
  })

  const rendement_brut = (loyer_annuel_y1 / acquisition.total_acquisition) * 100
  const rendement_net = ((loyer_annuel_y1 - charges_y1) / acquisition.total_acquisition) * 100
  const net_apres_tax = loyer_annuel_y1 - charges_y1 - tax_y1.total
  const rendement_net_net = (net_apres_tax / acquisition.total_acquisition) * 100
  const cashflow_mensuel = net_apres_tax / 12 - mensualite
  const effort_mensuel = Math.max(0, -cashflow_mensuel)
  const taux_effort = inputs.revenus_mensuels_foyer > 0 ? (effort_mensuel / inputs.revenus_mensuels_foyer) * 100 : 0

  const projections = buildProjections(inputs, acquisition, mensualite, amortSchedule)
  const plus_value = computePlusValue(inputs, acquisition, projections)
  const regime_comparison = buildRegimeComparison(inputs, acquisition, loyer_annuel_y1, charges_y1, interets_y1)
  const scenarios = buildScenarios(inputs, acquisition)
  const risk = computeRisk(inputs, acquisition, effort_mensuel, taux_effort)

  return {
    inputs,
    acquisition,
    mensualite,
    revenus_bruts_annuels: loyer_annuel_y1,
    charges_annuelles_y1: charges_y1,
    interets_y1,
    tax_y1,
    rendement_brut,
    rendement_net,
    rendement_net_net,
    cashflow_mensuel,
    effort_mensuel,
    taux_effort,
    projections,
    plus_value,
    regime_comparison,
    scenarios,
    risk,
  }
}

export function formatEur(n: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimals }).format(n)
}

export function formatPct(n: number, decimals = 2): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(decimals)} %`
}
