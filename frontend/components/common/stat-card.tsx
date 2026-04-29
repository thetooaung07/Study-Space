"use client"

import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  trend: string
  positive?: boolean
}

export function StatCard({ icon: Icon, label, value, trend, positive = false }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-2">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className="flex items-center gap-1 mt-4 text-xs">
        {positive ? (
          <ArrowUpRight className="h-3 w-3 text-accent" />
        ) : (
          <ArrowDownRight className="h-3 w-3 text-destructive" />
        )}
        <span className={positive ? "text-accent" : "text-destructive"}>{trend}</span>
      </div>
    </Card>
  )
}
