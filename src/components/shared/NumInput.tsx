"use client"

import { cn } from "@/lib/utils"
import { InfoFlipCard, type InfoCardContent } from "./InfoFlipCard"

interface NumInputProps {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  min?: number
  max?: number
  step?: number
  hint?: string
  className?: string
  disabled?: boolean
  info?: InfoCardContent
}

export function NumInput({ label, value, onChange, unit, min, max, step = 1, hint, className, disabled, info }: NumInputProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
        {info && <InfoFlipCard {...info} />}
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value === 0 ? "" : value}
          placeholder="0"
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "glass-input w-full rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium",
            "placeholder:text-slate-400 disabled:opacity-50",
            unit && "pr-10",
          )}
        />
        {unit && (
          <span className="absolute right-3 text-xs text-slate-400 pointer-events-none font-medium">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="text-xs text-slate-400 leading-tight">{hint}</p>}
    </div>
  )
}
