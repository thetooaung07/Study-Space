"use client"

import { Header } from "@/components/common/header"
import { Sidebar } from "@/components/common/sidebar"
import { SessionTracker } from "@/components/sessions/session-tracker"

export default function SessionsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <SessionTracker />
        </main>
      </div>
    </div>
  )
}
