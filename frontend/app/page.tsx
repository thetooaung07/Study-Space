"use client"

import Link from "next/link"
import { ChevronRight, LayoutDashboard, PlayCircle, Users, History, Trophy, UserCircle } from "lucide-react"

export default function QuickLinksPage() {
  const quickLinks = [
    {
      id: 1,
      title: "Dashboard",
      description: "View your study overview and statistics",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-6 h-6 mb-2 text-primary" />,
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    {
      id: 2,
      title: "Start Session",
      description: "Begin a new study session",
      href: "/sessions",
      icon: <PlayCircle className="w-6 h-6 mb-2 text-green-500" />,
      span: "col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 row-span-1",
    },
    {
      id: 3,
      title: "My Groups",
      description: "Join or manage study groups",
      href: "/groups",
      icon: <Users className="w-6 h-6 mb-2 text-blue-500" />,
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1 lg:row-span-2",
    },
    {
      id: 4,
      title: "Recent Sessions",
      description: "View your study history",
      href: "/sessions",
      icon: <History className="w-6 h-6 mb-2 text-orange-500" />,
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    // {
    //   id: 5,
    //   title: "Leaderboard",
    //   description: "Check your ranking",
    //   href: "/leaderboard",
    //   icon: <Trophy className="w-6 h-6 mb-2 text-yellow-500" />,
    //   span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    // },
     {
      id: 5,
      title: "Profile",
      description: "Manage your account",
      href: "/profile",
      icon: <UserCircle className="w-6 h-6 mb-2 text-yellow-500" />,
      span: "col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-1 2xl:col-span-1 row-span-1",
    },
    {
      id: 6,
      title: "Profile Settings",
      description: "Manage your account",
      href: "/profile",
      icon: <UserCircle className="w-6 h-6 mb-2 text-purple-500" />,
      span: "col-span-1 md:col-span-1 lg:col-span-2 xl:col-span-2 2xl:col-span-2 row-span-1",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] relative overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-7xl z-10">
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 mb-2">
                Welcome Back
            </h1>
            <p className="text-muted-foreground text-lg">Continue where you left off or start something new.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6 auto-rows-[160px]">
          {quickLinks.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={`${link.span} group relative rounded-xl p-6 transition-all duration-300 overflow-hidden
                         border border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-md
                         hover:bg-white/80 dark:hover:bg-black/40 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5
                         flex flex-col justify-between`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    {link.icon}
                    <div className="bg-background/50 p-1.5 rounded-full opacity-0 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                       <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {link.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {link.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
