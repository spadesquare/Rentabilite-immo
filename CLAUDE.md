# Rentabilité Immo

French real estate profitability calculator. Serious buy-to-let investment tool focused on Toulouse / Haute-Garonne. Not a simple yield calculator — models true economics including all French tax regimes, risk scoring, and 30-year projections.

## Start

```bash
cd "[05] Code lab/rentabilite-immo"
npm run dev
# http://localhost:3000
```

## What it does

User fills a 5-step form → clicks Calculer → sees full analysis:

- **Rendement brut / net / net-net** — yield before and after all costs and taxes
- **Cash flow mensuel** — what you actually pocket (or pay) each month after mortgage
- **4 régimes fiscaux** compared: Micro-foncier, Réel nu, LMNP Micro-BIC, LMNP Réel
- **30-year projections** — cash flow chart with cumulative totals
- **Risk score** — weighted across 7 factors (marché, vacance, locataire, levier, bâtiment, fiscal, exécution)
- **3 scenarios** — pessimiste / base / optimiste
- **Plus-value** — resale after tax with progressive abatements (IR exempt at 22y, PS at 30y)

## Folder structure

```
src/
├── app/
│   ├── page.tsx          ← Single-page app (hero + calculator + results)
│   ├── layout.tsx        ← Metadata, TooltipProvider
│   └── globals.css       ← Glassmorphism classes, page background, gradient text
├── types/
│   └── calculator.ts     ← All TypeScript interfaces
├── lib/
│   ├── calculator.ts     ← Full financial engine (entry point: computeResult)
│   ├── tax.ts            ← French tax logic (4 regimes + plus-value abatements)
│   └── risk.ts           ← Risk scoring (7 weighted factors → 0–10 score)
├── data/
│   └── toulouse.ts       ← Toulouse zone reference data (price/rent/vacancy)
└── components/
    ├── shared/
    │   ├── GlassCard.tsx ← Glassmorphism card wrapper
    │   └── NumInput.tsx  ← Formatted number input with unit
    ├── calculator/
    │   ├── Calculator.tsx      ← 5-tab form container + state
    │   ├── StepBien.tsx        ← Property inputs, Toulouse zone picker
    │   ├── StepFinancement.tsx ← Mortgage inputs
    │   ├── StepCharges.tsx     ← Income/expense inputs
    │   ├── StepFiscalite.tsx   ← Tax regime + TMI selector
    │   └── StepHypotheses.tsx  ← Duration, vacancy, scenarios
    └── results/
        ├── ResultsDashboard.tsx  ← Animated results container
        ├── KpiCards.tsx          ← 4 headline KPI cards
        ├── CashFlowChart.tsx     ← Recharts area chart (annual + cumulative CF)
        ├── TaxBreakdown.tsx      ← Recharts bar chart comparing all 4 regimes
        ├── RiskScore.tsx         ← SVG gauge + factor breakdown
        ├── ScenarioTable.tsx     ← 3-column pessimiste/base/optimiste
        └── PlusValuePanel.tsx    ← Resale analysis with abatement breakdown
```

## Financial engine

Core entry point: `computeResult(inputs: CalculatorInputs): CalculatorResult` in `src/lib/calculator.ts`

Key formulas:
- `frais_notaire`: 7.5% (ancien) or 2.5% (neuf)
- `mensualite`: annuité constante + assurance on initial capital
- Amortization schedule: full month-by-month for accurate annual interest
- Tax: `src/lib/tax.ts → computeTax()` — handles all 4 regimes including LMNP amortissement
- Plus-value: `computePlusValueTax()` — progressive IR (exempt 22y) and PS (exempt 30y) abatements

## Tax regimes

| Regime | Base imposable | Notes |
|--------|---------------|-------|
| Micro-foncier | revenus × 70% | Location nue, < 15k€/an |
| Réel nu | revenus - charges - intérêts | Déficit foncier reportable 10 ans |
| LMNP Micro-BIC | revenus × 50% | Location meublée, < 77.7k€/an |
| LMNP Réel | revenus - charges - intérêts - amortissements | Best for leveraged buys — often 0 tax for years 1–10 |

IR = base × TMI / 100  
PS = base × 17.2%

## Toulouse data

Reference data in `src/data/toulouse.ts` — 8 zones with price/m², rent/m², vacancy rate, market tension. Used as hints in the form, not locked values.

## UI

Glassmorphism light theme. CSS classes in `globals.css`:
- `.glass` — frosted white card (backdrop-blur-24px)
- `.glass-strong` — stronger blur for main calculator card
- `.glass-input` — input field styling
- `.page-bg` — indigo/violet gradient background
- `.grad-text` — indigo→violet gradient text

Stack: Next.js 16, React 19, Tailwind v4, shadcn/ui (58 components), framer-motion, recharts, lucide-react.

## Maintenance

Update this file when:
- New tax rules change (taux PS, abattements PV, seuils micro-BIC/foncier)
- New Toulouse zones added to `src/data/toulouse.ts`
- New calculation steps or result panels added
- Any formula in `src/lib/calculator.ts` or `src/lib/tax.ts` changes
