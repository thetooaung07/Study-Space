"use client"

import { Header } from "@/components/common/header"
import { Sidebar } from "@/components/common/sidebar"
import { GroupsManager } from "@/components/groups/groups-manager"

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
