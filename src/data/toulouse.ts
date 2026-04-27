export interface ToulouseZone {
  zone: string
  prix_m2: [number, number]
  loyer_m2: [number, number]
  vacance: number
  tension: 'très tendue' | 'tendue' | 'modérée' | 'détendue'
  profil: string
}

export const TOULOUSE_ZONES: ToulouseZone[] = [
  {
    zone: 'Centre (Capitole, Carmes, Saint-Georges)',
    prix_m2: [4200, 5000],
    loyer_m2: [13, 16],
    vacance: 3,
    tension: 'très tendue',
    profil: 'Forte demande cadres & tourisme — faible vacance — prix élevés',
  },
  {
    zone: 'Proche centre (Saint-Cyprien, Côte Pavée, Compans-Caffarelli)',
    prix_m2: [3500, 4200],
    loyer_m2: [11, 14],
    vacance: 4,
    tension: 'tendue',
    profil: 'Mix étudiants / jeunes actifs — bon rapport prix/loyer',
  },
  {
    zone: 'Péri-centre (Minimes, Bonnefoy, Sept Deniers, Rangueil)',
    prix_m2: [2800, 3500],
    loyer_m2: [10, 13],
    vacance: 5,
    tension: 'tendue',
    profil: 'Forte demande étudiante (UT3, INSA) — meilleurs rendements',
  },
  {
    zone: 'Périphérie Toulouse (Mirail, Empalot, Grand Selve)',
    prix_m2: [2200, 2900],
    loyer_m2: [8, 11],
    vacance: 8,
    tension: 'modérée',
    profil: 'Prix accessibles — vacance plus élevée — profil locataire fragile',
  },
  {
    zone: 'Blagnac / Colomiers (Grand Toulouse Ouest)',
    prix_m2: [2900, 3800],
    loyer_m2: [10, 13],
    vacance: 4,
    tension: 'tendue',
    profil: 'Bassin Airbus / Aerospace Valley — cadres & familles — bonne stabilité',
  },
  {
    zone: 'Tournefeuille / Cugnaux (Toulouse Sud-Ouest)',
    prix_m2: [2700, 3400],
    loyer_m2: [9, 12],
    vacance: 5,
    tension: 'tendue',
    profil: 'Familles — maisons & appartements T3/T4 — marché stable',
  },
  {
    zone: 'Balma / Labège / Ramonville (Toulouse Est)',
    prix_m2: [2800, 3600],
    loyer_m2: [10, 13],
    vacance: 4,
    tension: 'tendue',
    profil: 'Technopole — cadres IT & ingénieurs — demande locative soutenue',
  },
  {
    zone: 'Muret / Auterive (Sud Haute-Garonne)',
    prix_m2: [1800, 2600],
    loyer_m2: [7, 10],
    vacance: 7,
    tension: 'modérée',
    profil: 'Marché détendu — rendements bruts élevés — liquidité plus faible',
  },
]

export const TOULOUSE_TAX_FONCIERE_MOYEN = 18 // €/m²/an (base estimation Toulouse)

export const ZONE_TENDUE_NOTE =
  'Toulouse est classée zone tendue depuis 2022 (décret du 20/07/2023). ' +
  'Cela implique une taxe foncière majorée possible pour les logements vacants, ' +
  "et un délai de préavis de 1 mois pour le locataire en zone tendue. " +
  "L'encadrement des loyers n'est pas encore en vigueur à Toulouse."
