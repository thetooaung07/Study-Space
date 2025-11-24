"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { LeaderboardDashboard } from "@/components/leaderboard-dashboard"

export default function LeaderboardPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <LeaderboardDashboard />
        </main>
      </div>
    </div>
  )
}
