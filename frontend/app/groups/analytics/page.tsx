"use client"

import { Header } from "@/components/common/header"
import { Sidebar } from "@/components/common/sidebar"
import { AnalyticsDashboard } from "@/components/groups/analytics/analytics-dashboard"

export default function AnalyticsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <AnalyticsDashboard />
        </main>
      </div>
    </div>
  )
}
