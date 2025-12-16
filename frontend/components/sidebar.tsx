"use client";

import { BookOpen, Users, BarChart3, Clock, Zap, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
export function Sidebar() {
	const router = useRouter();
	const pathname = usePathname();

	const navItems = [
		{ icon: BookOpen, label: "Dashboard", href: "/dashboard" },
		{ icon: Clock, label: "My Sessions", href: "/sessions" },
		// { icon: Users, label: "Groups", href: "/groups" },
		// { icon: BarChart3, label: "Leaderboard", href: "/leaderboard" },
		// { icon: Zap, label: "Trending", href: "/trending" },
		// { icon: PieChart, label: "Analytics", href: "/analytics" },
	];

	const isActive = (href: any) => {
		if (href === "/") {
			return pathname === "/";
		}
		return pathname.startsWith(href);
	};

	return (
		<aside className="w-64 border-r border-border bg-sidebar flex flex-col">
			<div className="p-6">
				<div className="flex items-center gap-2" onClick={(e) => {
							e.preventDefault();
							router.push("/");
						}}>
					<div
						className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center cursor-pointer"
					>
						<BookOpen className="h-5 w-5 text-primary-foreground" />
					</div>
					<h1 className="text-xl font-bold text-sidebar-foreground cursor-pointer">StudySpace</h1>
				</div>
			</div>

			<nav className="flex-1 px-3 space-y-2">
				{navItems.map((item) => (
					<Link key={item.href} href={item.href} passHref>
						<Button
							variant={isActive(item.href) ? "default" : "ghost"}
							className="w-full justify-start gap-3"
						>
							<item.icon className="h-4 w-4" />
							<span>{item.label}</span>
						</Button>
					</Link>
				))}
			</nav>

			{/* <div className="p-4 border-t border-border">
				<Button className="w-full bg-primary hover:opacity-90">Start Session</Button>
			</div> */}
		</aside>
	);
}
