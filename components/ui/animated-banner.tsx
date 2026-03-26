"use client"

import { motion } from "framer-motion"
import { AlertCircle, Info, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedBannerProps {
  title: string
  description: React.ReactNode
  variant?: "default" | "destructive" | "success" | "warning"
  className?: string
}

export function AnimatedBanner({ title, description, variant = "default", className }: AnimatedBannerProps) {
  const Icon = {
    default: Info,
    destructive: XCircle,
    success: CheckCircle2,
    warning: AlertCircle,
  }[variant]

  const styles = {
    default: "bg-blue-50/70 border-blue-200 text-blue-900",
    destructive: "bg-red-50/70 border-red-200 text-red-900",
    success: "bg-emerald-50/70 border-emerald-200 text-emerald-900",
    warning: "bg-amber-50/70 border-amber-200 text-amber-900",
  }[variant]

  const iconStyles = {
    default: "text-blue-500",
    destructive: "text-red-500",
    success: "text-emerald-500",
    warning: "text-amber-500",
  }[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border p-4 md:p-5 shadow-xs backdrop-blur-xl transition-all",
        styles,
        className
      )}
    >
      <div className="flex items-start gap-4 z-10 relative">
        <div className="mt-0.5 shrink-0">
          <Icon className={cn("size-6", iconStyles)} strokeWidth={2.5} />
        </div>
        <div className="flex-1 space-y-1.5 leading-relaxed">
          <h3 className="font-semibold tracking-tight text-base md:text-lg">{title}</h3>
          <div className="text-sm opacity-90">{description}</div>
        </div>
      </div>
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
    </motion.div>
  )
}
