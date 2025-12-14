"use client"

import { Analytics } from "@/components/analytics"

export function AnalyticsDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-foreground">Analytics</h2>
        <p className="text-muted-foreground mt-1">Deep dive into your study habits and performance</p>
      </div>

      <Analytics />
    </div>
  )
}
