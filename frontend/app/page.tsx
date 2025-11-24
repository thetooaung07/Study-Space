"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

export default function QuickLinksPage() {
  const quickLinks = [
    {
      id: 1,
      title: "Dashboard",
      description: "View your study overview and statistics",
      href: "/dashboard",
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    {
      id: 2,
      title: "Start Session",
      description: "Begin a new study session",
      href: "/sessions",
      span: "col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 row-span-1",
    },
    {
      id: 3,
      title: "My Groups",
      description: "Join or manage study groups",
      href: "/groups",
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1 lg:row-span-2",
    },
    {
      id: 4,
      title: "Recent Sessions",
      description: "View your study history",
      href: "/sessions",
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    {
      id: 5,
      title: "Leaderboard",
      description: "Check your ranking",
      href: "/leaderboard",
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    {
      id: 6,
      title: "Profile Settings",
      description: "Manage your account",
      href: "/profile",
      span: "col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 row-span-1",
    },
  ]

  return (
    <div className="h-screen bg-background flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-9 2xl:p-10">
      <div className="w-full max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl 2xl:max-w-screen-xl h-full flex flex-col justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-5 xl:gap-5 2xl:gap-6 auto-rows-[120px] md:auto-rows-[140px] lg:auto-rows-[160px] xl:auto-rows-[180px] 2xl:auto-rows-[200px]">
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`${link.span} group relative border border-border rounded-lg p-3 md:p-4 lg:p-5 xl:p-6 2xl:p-6 bg-card hover:bg-muted transition-all duration-300 overflow-hidden`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-foreground/5 group-hover:to-foreground/10 transition-all duration-300" />

              <div className="relative h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl font-semibold text-foreground mb-1">
                    {link.title}
                  </h3>
                  <p className="text-xs md:text-xs lg:text-sm xl:text-sm 2xl:text-sm text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                </div>

                <div className="flex items-center text-muted-foreground group-hover:text-foreground transition-colors">
                  <span className="text-xs font-medium">Go</span>
                  <ChevronRight className="w-3 h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
