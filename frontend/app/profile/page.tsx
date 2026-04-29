"use client"

import { Header } from "@/components/common/header"
import { Sidebar } from "@/components/common/sidebar"
import { ProfileSettings } from "@/components/profile/profile-settings"

export default function ProfilePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <ProfileSettings />
        </main>
      </div>
    </div>
  )
}
