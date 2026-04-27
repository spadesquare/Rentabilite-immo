"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Calculator } from "@/components/calculator/Calculator"
import { ResultsDashboard } from "@/components/results/ResultsDashboard"
import { computeResult } from "@/lib/calculator"
import type { CalculatorInputs, CalculatorResult } from "@/types/calculator"
import { ArrowDown, TrendingUp, Shield, BarChart3 } from "lucide-react"

export default function Home() {
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleCalculate = (inputs: CalculatorInputs) => {
    const r = computeResult(inputs)
    setResult(r)
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleReset = () => {
    setResult(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page-bg">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] left-[5%] w-[600px] h-[600px] bg-indigo-200/25 rounded-full blur-3xl" />
        <div className="absolute top-[35%] -right-[5%] w-[500px] h-[500px] bg-violet-200/25 rounded-full blur-3xl" />
        <div className="absolute bottom-[5%] left-[25%] w-[500px] h-[500px] bg-blue-200/15 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 text-xs font-semibold text-indigo-600">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Focus Toulouse & Haute-Garonne
            </div>

            <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-none mb-6">
              <span className="grad-text">Rentabilité</span>
              <br />
              <span className="text-slate-800">Immobilière</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto mb-12 leading-relaxed">
              Le vrai calcul de votre investissement locatif.
              Rendement net-net, cash flow, fiscalité LMNP,
              score de risque — pas de simplification.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              {[
                { icon: TrendingUp, text: '4 régimes fiscaux' },
                { icon: BarChart3, text: 'Projections 30 ans' },
                { icon: Shield, text: 'Score de risque' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="glass rounded-full px-4 py-2 flex items-center gap-2 text-sm text-slate-600">
                  <Icon className="w-4 h-4 text-indigo-400" />
                  {text}
                </div>
              ))}
            </div>

            <a href="#calculateur" className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-base rounded-2xl px-8 py-4 shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:from-indigo-600 hover:to-violet-600 transition-all">
              Commencer l'analyse
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </a>
          </motion.div>
        </section>

        {/* ── Calculator ───────────────────────────────────────────────────── */}
        <section id="calculateur" className="max-w-3xl mx-auto px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Analysez votre bien</h2>
              <p className="text-sm text-slate-500 mt-2">Renseignez les 5 onglets, puis cliquez sur Calculer</p>
            </div>
            <Calculator onCalculate={handleCalculate} />
          </motion.div>
        </section>

        {/* ── Results ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <section ref={resultsRef} className="max-w-5xl mx-auto px-4 pb-24">
              <ResultsDashboard result={result} onReset={handleReset} />
            </section>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
