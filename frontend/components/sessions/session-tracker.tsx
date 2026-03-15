"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionHistory } from "@/components/sessions/session-history";
import { TimerCard } from "@/components/sessions/timer-card";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { StudySessionDTO } from "@/types";
import { cn } from "@/lib/utils";
import { SessionForm } from "@/components/sessions/session-form";

/** Format minutes to human-readable time */
function formatStudyTime(minutes: number): string {
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

interface DailyStatsCardsProps {
	refreshTrigger: number;
}

/** Daily Stats Cards - Connected to Backend */
function DailyStatsCards({ refreshTrigger }: DailyStatsCardsProps) {
	const { user } = useAuth();
	const [todaySessions, setTodaySessions] = useState<StudySessionDTO[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchTodayData = async () => {
			if (!user) return;

			try {
				const sessions = await api.get<StudySessionDTO[]>(`/sessions/user/${user.id}`);

				// Filter for today's sessions
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const todaysSessions = sessions.filter((s) => {
					const sessionDate = new Date(s.startTime);
					sessionDate.setHours(0, 0, 0, 0);
					return sessionDate.getTime() === today.getTime();
				});

				setTodaySessions(todaysSessions);
			} catch (error) {
				console.error("Failed to fetch daily stats:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchTodayData();
	}, [user, refreshTrigger]);

	// Calculate today's stats
	const todayMinutes = todaySessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
	const sessionCount = todaySessions.length;
	const avgDuration = sessionCount > 0 ? Math.round(todayMinutes / sessionCount) : 0;
	const streak = user?.currentStreak || 0;

	const stats = [
		{
			label: "Today's Study Time",
			value: formatStudyTime(todayMinutes),
			subtext:
				sessionCount > 0 ? `From ${sessionCount} session${sessionCount !== 1 ? "s" : ""}` : "Start studying!",
			highlight: todayMinutes > 0,
		},
		{
			label: "Sessions Today",
			value: sessionCount.toString(),
			subtext: avgDuration > 0 ? `Avg: ${avgDuration} minutes` : "No sessions yet",
			highlight: false,
		},
		{
			label: "Current Streak",
			value: `${streak} day${streak !== 1 ? "s" : ""}`,
			subtext: streak > 0 ? "Keep it going! 🔥" : "Start your streak today!",
			highlight: streak > 0,
		},
	];

	if (loading) {
		return (
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{[1, 2, 3].map((i) => (
					<Card key={i} className="p-4 animate-pulse">
						<div className="h-4 bg-muted rounded w-24 mb-3"></div>
						<div className="h-8 bg-muted rounded w-16 mb-2"></div>
						<div className="h-3 bg-muted rounded w-32"></div>
					</Card>
				))}
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			{stats.map(({ label, value, subtext, highlight }) => (
				<Card key={label} className="p-4">
					<p className="text-sm text-muted-foreground">{label}</p>
					<p className="text-2xl font-bold text-foreground mt-2">{value}</p>
					<p className={cn("text-xs mt-2", highlight ? "text-secondary" : "text-muted-foreground")}>
						{subtext}
					</p>
				</Card>
			))}
		</div>
	);
}

export function SessionTracker() {
	const { updateUser } = useAuth();
	const [showNewSession, setShowNewSession] = useState(false);
	const [statsRefreshTrigger, setStatsRefreshTrigger] = useState(0);

	const handleSessionDeleted = async () => {
		setStatsRefreshTrigger((prev) => prev + 1);

		try {
			const updatedUser = await api.get<any>("/auth/me");
			updateUser(updatedUser);
		} catch (error) {
			console.error("Failed to refresh user profile after deletion", error);
		}
	};

	return (
		<div className="p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold text-foreground">Study Sessions</h2>
					<p className="text-muted-foreground mt-1">Track and manage your study sessions</p>
				</div>
				<Button onClick={() => setShowNewSession(!showNewSession)} className="gap-2">
					<Plus className="h-4 w-4" />
					New Session
				</Button>
			</div>

			{/* New Session Form */}
			{showNewSession && <SessionForm onClose={() => setShowNewSession(false)} />}

			{/* Timer Card */}
			{/* <TimerCard /> */}

			{/* Daily Stats */}
			<DailyStatsCards refreshTrigger={statsRefreshTrigger} />

			{/* Session History */}
			<SessionHistory onSessionDeleted={handleSessionDeleted} />
		</div>
	);
}
