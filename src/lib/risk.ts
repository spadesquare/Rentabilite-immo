import type { CalculatorInputs, RiskFactor, RiskResult, AcquisitionCosts } from '@/types/calculator'
import { TOULOUSE_ZONES } from '@/data/toulouse'

export function computeRisk(
  inputs: CalculatorInputs,
  acquisition: AcquisitionCosts,
  effort_mensuel: number,
  taux_effort: number,
): RiskResult {
  const ltv = acquisition.montant_emprunt / acquisition.total_acquisition * 100
  const zone = TOULOUSE_ZONES.find(z => z.zone === inputs.zone_toulouse)
  const factors: RiskFactor[] = []

  // ── Marché (20%) ────────────────────────────────────────────────────────────
  let marche_score = 0
  if (ltv <= 70) marche_score = 2
  else if (ltv <= 80) marche_score = 4
  else if (ltv <= 90) marche_score = 6
  else marche_score = 9

  const prix_m2 = inputs.prix / inputs.surface
  const prix_zone_mid = zone ? (zone.prix_m2[0] + zone.prix_m2[1]) / 2 : prix_m2
  const ecart_prix = (prix_m2 - prix_zone_mid) / prix_zone_mid
  if (ecart_prix > 0.2) marche_score = Math.min(10, marche_score + 2)
  else if (ecart_prix > 0.1) marche_score = Math.min(10, marche_score + 1)
  else if (ecart_prix < -0.1) marche_score = Math.max(0, marche_score - 1)

  factors.push({
    label: 'Risque marché',
    score: marche_score,
    weight: 0.20,
    detail: `LTV ${ltv.toFixed(0)}% — ${prix_m2.toFixed(0)} €/m²`,
  })

  // ── Vacance (20%) ──────────────────────────────────────────────────────────
  let vacance_score = 0
  if (inputs.taux_vacance <= 3) vacance_score = 2
  else if (inputs.taux_vacance <= 5) vacance_score = 4
  else if (inputs.taux_vacance <= 8) vacance_score = 7
  else vacance_score = 9

  if (zone?.tension === 'très tendue') vacance_score = Math.max(0, vacance_score - 2)
  else if (zone?.tension === 'tendue') vacance_score = Math.max(0, vacance_score - 1)
  else if (zone?.tension === 'modérée') vacance_score = Math.min(10, vacance_score + 1)

  factors.push({
    label: 'Risque vacance',
    score: vacance_score,
    weight: 0.20,
    detail: `${inputs.taux_vacance}% vacance estimée — Zone ${zone?.tension ?? 'non renseignée'}`,
  })

  // ── Locataire (15%) ────────────────────────────────────────────────────────
  const locataire_map = { professionnel: 2, famille: 4, jeune_actif: 5, etudiant: 7 }
  let locataire_score = locataire_map[inputs.type_locataire]
  if (inputs.gli) locataire_score = Math.max(0, locataire_score - 2)

  factors.push({
    label: 'Risque locataire',
    score: locataire_score,
    weight: 0.15,
    detail: `${inputs.type_locataire === 'etudiant' ? 'Étudiant' : inputs.type_locataire === 'jeune_actif' ? 'Jeune actif' : inputs.type_locataire === 'famille' ? 'Famille' : 'Professionnel'}${inputs.gli ? ' — GLI souscrite ✓' : ' — Sans GLI'}`,
  })

  // ── Levier (15%) ──────────────────────────────────────────────────────────
  let levier_score = 0
  if (taux_effort <= 5) levier_score = 1
  else if (taux_effort <= 10) levier_score = 3
  else if (taux_effort <= 15) levier_score = 6
  else if (taux_effort <= 25) levier_score = 8
  else levier_score = 10

  factors.push({
    label: 'Risque levier',
    score: levier_score,
    weight: 0.15,
    detail: `Effort mensuel ${effort_mensuel.toFixed(0)} € (${taux_effort.toFixed(1)}% des revenus)`,
  })

  // ── Bâtiment (10%) ────────────────────────────────────────────────────────
  const dpe_map = { A: 1, B: 2, C: 3, D: 5, E: 7, F: 8, G: 10 }
  let batiment_score = dpe_map[inputs.dpe]
  if (inputs.age_bien > 50) batiment_score = Math.min(10, batiment_score + 3)
  else if (inputs.age_bien > 30) batiment_score = Math.min(10, batiment_score + 1)
  if (inputs.travaux > 0) batiment_score = Math.max(0, batiment_score - 2)

  factors.push({
    label: 'Risque bâtiment',
    score: batiment_score,
    weight: 0.10,
    detail: `DPE ${inputs.dpe} — ${inputs.age_bien} ans${inputs.travaux > 0 ? ' — Travaux effectués' : ''}`,
  })

  // ── Juridique / fiscal (10%) ───────────────────────────────────────────────
  const regime_map = { lmnp_reel: 3, lmnp_micro_bic: 2, reel_nu: 4, micro_foncier: 4 }
  let juridique_score = regime_map[inputs.regime]
  if (zone?.tension === 'très tendue' || zone?.tension === 'tendue') juridique_score = Math.min(10, juridique_score + 2)

  factors.push({
    label: 'Risque fiscal/légal',
    score: juridique_score,
    weight: 0.10,
    detail: `Régime ${inputs.regime === 'lmnp_reel' ? 'LMNP Réel' : inputs.regime === 'lmnp_micro_bic' ? 'LMNP Micro-BIC' : inputs.regime === 'reel_nu' ? 'Réel nu' : 'Micro-foncier'} — Zone ${zone?.tension ?? '?'}`,
  })

  // ── Exécution (10%) ───────────────────────────────────────────────────────
  const exec_score = inputs.gestion_type === 'directe' ? 5 : 2

  factors.push({
    label: 'Risque exécution',
    score: exec_score,
    weight: 0.10,
    detail: inputs.gestion_type === 'directe' ? 'Gestion directe (temps + implication)' : 'Gestion mandataire (professionnel)',
  })

  const score = factors.reduce((acc, f) => acc + f.score * f.weight, 0)

  let label: RiskResult['label']
  let color: string
  if (score < 3) { label = 'Faible'; color = '#10b981' }
  else if (score < 5.5) { label = 'Modéré'; color = '#f59e0b' }
  else if (score < 7.5) { label = 'Élevé'; color = '#f97316' }
  else { label = 'Très élevé'; color = '#ef4444' }

  return { score, label, color, factors }
}
