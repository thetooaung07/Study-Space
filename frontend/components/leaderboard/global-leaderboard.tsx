"use client";

import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { UserDTO } from "@/types";
import { useAuth } from "@/context/auth-context";

function formatStudyTime(minutes: number): string {
	if (!minutes || minutes === 0) return "0m";
	if (minutes >= 60) {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	return `${minutes}m`;
}

const getMedalIcon = (rank: number) => {
	if (rank === 1) return "🥇";
	if (rank === 2) return "🥈";
	if (rank === 3) return "🥉";
	return null;
};

export function GlobalLeaderboard() {
	const { user: currentUser } = useAuth();
	const [users, setUsers] = useState<UserDTO[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchLeaderboard = async () => {
			try {
				const data = await api.get<UserDTO[]>("/users/leaderboard?limit=50");
				setUsers(data);
			} catch (error) {
				console.error("Failed to fetch leaderboard:", error);
			} finally {
				setLoading(false);
			}
		};
		fetchLeaderboard();
	}, []);

	return (
		<Card className="p-6">
			<div className="flex items-center justify-between mb-6">
				<h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
					<Trophy className="h-5 w-5 text-accent" />
					Global Rankings — Study Time
				</h3>
			</div>

			{loading && <p className="text-center text-muted-foreground py-8">Loading leaderboard...</p>}
			{!loading && users.length === 0 && (
				<p className="text-center text-muted-foreground py-8">No data yet. Start studying to appear here!</p>
			)}

			{!loading && users.length > 0 && (
				<div className="overflow-x-auto">
					<table className="w-full">
						<thead>
							<tr className="border-b border-border text-muted-foreground text-sm">
								<th className="text-left py-3 px-4 font-medium">Rank</th>
								<th className="text-left py-3 px-4 font-medium">Student</th>
								<th className="text-right py-3 px-4 font-medium">Study Time</th>
								<th className="text-right py-3 px-4 font-medium">Streak</th>
							</tr>
						</thead>
						<tbody>
							{users.map((entry, idx) => {
								const rank = idx + 1;
								const isYou = currentUser?.id === entry.id;
								return (
									<tr
										key={entry.id}
										className={`border-b border-border hover:bg-primary/5 transition-colors ${
											isYou ? "bg-primary/10 border-primary/30" : ""
										}`}
									>
										<td className="py-4 px-4">
											<div className="flex items-center gap-2 font-semibold text-foreground">
												{getMedalIcon(rank) ?? (
													<span className="w-6 text-center text-sm">{rank}</span>
												)}
											</div>
										</td>
										<td className="py-4 px-4">
											<div className="flex items-center gap-3">
												{entry.profilePictureUrl ? (
													<img
														src={entry.profilePictureUrl}
														alt={entry.fullName}
														className="w-8 h-8 rounded-full object-cover"
													/>
												) : (
													<div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
														{entry.fullName?.charAt(0) ?? "?"}
													</div>
												)}
												<div>
													<p className="font-medium text-foreground">{entry.fullName || entry.username}</p>
													{isYou && <p className="text-xs text-primary font-semibold">You</p>}
												</div>
											</div>
										</td>
										<td className="py-4 px-4 text-right">
											<p className="font-semibold text-foreground">
												{formatStudyTime(entry.totalStudyMinutes ?? 0)}
											</p>
										</td>
										<td className="py-4 px-4 text-right">
											<div className="flex items-center justify-end gap-1">
												<span className="text-sm text-muted-foreground">{entry.currentStreak ?? 0}</span>
												<span>🔥</span>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}
		</Card>
	);
}
