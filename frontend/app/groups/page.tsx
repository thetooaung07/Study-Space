"use client"

import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { GroupsManager } from "@/components/groups-manager"

export default function GroupsPage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <GroupsManager />
        </main>
      </div>
    </div>
  )
}
