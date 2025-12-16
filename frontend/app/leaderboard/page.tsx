"use client"

import { Header } from "@/components/common/header"
import { LeaderboardDashboard } from "@/components/leaderboard/leaderboard-dashboard"
import { Sidebar } from "@/components/common/sidebar"

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
