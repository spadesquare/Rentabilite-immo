export type TaxRegime = 'micro_foncier' | 'reel_nu' | 'lmnp_micro_bic' | 'lmnp_reel'
export type TMI = 0 | 11 | 30 | 41 | 45
export type TypeBien = 'ancien' | 'neuf'
export type TypeLocataire = 'etudiant' | 'jeune_actif' | 'famille' | 'professionnel'
export type GestionType = 'directe' | 'mandataire'
export type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface CalculatorInputs {
  // Bien
  prix: number
  surface: number
  type_bien: TypeBien
  frais_agence: number
  travaux: number
  mobilier: number
  age_bien: number
  dpe: DPE
  zone_toulouse: string

  // Financement
  apport: number
  taux_interet: number
  duree_pret: number
  taux_assurance: number

  // Revenus
  loyer_hc: number
  charges_recuperables: number

  // Charges
  charges_copro_annuelles: number
  part_non_recuperable_pct: number
  taxe_fonciere: number
  assurance_pno: number
  frais_gestion_pct: number
  gli: boolean
  gli_pct: number
  entretien_annuel: number

  // Fiscalité
  regime: TaxRegime
  tmi: TMI

  // Hypothèses
  duree_detention: number
  evolution_prix_annuelle: number
  evolution_loyer_annuelle: number
  evolution_charges_annuelle: number
  taux_vacance: number
  type_locataire: TypeLocataire
  gestion_type: GestionType
  revenus_mensuels_foyer: number
}

export interface AcquisitionCosts {
  frais_notaire: number
  frais_garantie: number
  total_acquisition: number
  montant_emprunt: number
}

export interface AnnualTaxResult {
  base_imposable: number
  ir: number
  ps: number
  total: number
  deficit_reporte: number
}

export interface AnnualProjection {
  annee: number
  loyer_annuel: number
  charges_annuelles: number
  interets: number
  tax: AnnualTaxResult
  cashflow_avant_financement: number
  cashflow_apres_financement: number
  cashflow_cumule: number
  capital_restant: number
}

export interface PlusValue {
  prix_revente: number
  pv_brute: number
  abattement_ir_pct: number
  abattement_ps_pct: number
  tax_pv: number
  net_revente: number
}

export interface RegimeComparison {
  regime: TaxRegime
  label: string
  base_imposable: number
  ir: number
  ps: number
  total_tax: number
  rendement_net_net: number
  cashflow_mensuel: number
}

export interface RiskFactor {
  label: string
  score: number
  weight: number
  detail: string
}

export interface RiskResult {
  score: number
  label: 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé'
  color: string
  factors: RiskFactor[]
}

export interface ScenarioResult {
  label: 'Pessimiste' | 'Base' | 'Optimiste'
  rendement_brut: number
  rendement_net: number
  rendement_net_net: number
  cashflow_mensuel: number
  effort_mensuel: number
  net_revente_total: number
}

export interface CalculatorResult {
  inputs: CalculatorInputs
  acquisition: AcquisitionCosts
  mensualite: number

  revenus_bruts_annuels: number
  charges_annuelles_y1: number
  interets_y1: number
  tax_y1: AnnualTaxResult

  rendement_brut: number
  rendement_net: number
  rendement_net_net: number
  cashflow_mensuel: number
  effort_mensuel: number
  taux_effort: number

  projections: AnnualProjection[]
  plus_value: PlusValue

  regime_comparison: RegimeComparison[]
  scenarios: ScenarioResult[]
  risk: RiskResult
}
