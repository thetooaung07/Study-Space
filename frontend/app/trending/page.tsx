"use client"

import { Header } from "@/components/common/header"
import { Sidebar } from "@/components/common/sidebar"
import { TrendingDashboard } from "@/components/dashboard/trending-dashboard"

export default function TrendingPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <TrendingDashboard />
        </main>
      </div>
    </div>
  )
}
