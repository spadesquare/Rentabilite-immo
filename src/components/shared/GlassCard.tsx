import { cn } from "@/lib/utils"

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  strong?: boolean
  as?: "div" | "section"
}

export function GlassCard({ children, className, strong, as: Tag = "div" }: GlassCardProps) {
  return (
    <Tag className={cn("rounded-2xl", strong ? "glass-strong" : "glass", className)}>
      {children}
    </Tag>
  )
}
