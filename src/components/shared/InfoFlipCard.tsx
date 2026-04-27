"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

export interface InfoCardContent {
  title: string
  definition: string
  example?: string
  warning?: string
}

export function InfoFlipCard({ title, definition, example, warning }: InfoCardContent) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick) }
  }, [open])

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black transition-all shrink-0 ${
          open ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600'
        }`}
        aria-label={`Explication : ${title}`}
      >
        i
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ rotateY: -80, opacity: 0, x: -8 }}
            animate={{ rotateY: 0, opacity: 1, x: 0 }}
            exit={{ rotateY: 80, opacity: 0, x: 8 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "left center", perspective: 900 }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-50 w-64 glass-strong rounded-2xl p-4 shadow-2xl shadow-indigo-100/40"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <p className="text-xs font-bold text-indigo-700 leading-tight">{title}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 mt-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Definition */}
            <p className="text-xs text-slate-600 leading-relaxed">{definition}</p>

            {/* Example */}
            {example && (
              <div className="mt-2.5 rounded-xl bg-indigo-50/70 px-3 py-2 border border-indigo-100/60">
                <p className="text-xs text-indigo-700 leading-snug">
                  <span className="font-semibold">Ex. </span>{example}
                </p>
              </div>
            )}

            {/* Warning */}
            {warning && (
              <div className="mt-2 rounded-xl bg-orange-50/70 px-3 py-2 border border-orange-100/60">
                <p className="text-xs text-orange-700 leading-snug">⚠️ {warning}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
