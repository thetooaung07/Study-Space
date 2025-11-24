"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { SessionTracker } from "@/components/session-tracker"

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
