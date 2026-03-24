"use client";

import { useEffect, useState } from "react";
import { Clock, Users, Play, RefreshCcw, CloudCog } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { StudySessionDTO } from "@/types";
import { JoinSessionModal } from "@/components/sessions/join-session-modal";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { computeDuration } from "@/lib/utils";

export function ActiveSessions() {
	const [sessions, setSessions] = useState<StudySessionDTO[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	// Join by ID state
	const [joinId, setJoinId] = useState("");

	const { user } = useAuth();
	const router = useRouter();

	const fetchSessions = async () => {
		if (!user) return;

		try {
			setRefreshing(true);

			const userSessions = await api.get<StudySessionDTO[]>(`/sessions/user/${user.id}`);
			const allSessions = await api.get<StudySessionDTO[]>(`/sessions`);

			const publicGroupSessions = allSessions.filter(
				(s) => s.isGroupSession && s.visibility === "PUBLIC" && !userSessions.some((us) => us.id === s.id),
			);
			const combinedSessions = [...userSessions, ...publicGroupSessions];
			setSessions(combinedSessions.filter((s) => s.status === "ACTIVE"));
		} catch (error) {
			console.error("Failed to fetch sessions:", error);
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (user) {
			fetchSessions();
		}
	}, [user]);

	const subjectColors: Record<string, string> = {
		MATH: "from-orange-500/20 to-orange-600/20",
		SCIENCE: "from-blue-500/20 to-blue-600/20",
		PROGRAMMING: "from-purple-500/20 to-purple-600/20",
		LANGUAGE: "from-green-500/20 to-green-600/20",
		HISTORY: "from-yellow-500/20 to-yellow-600/20",
		LITERATURE: "from-pink-500/20 to-pink-600/20",
		ART: "from-teal-500/20 to-teal-600/20",
		MUSIC: "from-indigo-500/20 to-indigo-600/20",
		OTHER: "from-gray-500/20 to-gray-600/20",
	};

	const handleJoinById = () => {
		if (joinId) {
			setSelectedSessionId(parseInt(joinId));
			setIsModalOpen(true);
		}
	};

	const handleDetailsClick = (sessionId: number) => {
		router.push(`/sessions/active/${sessionId}`);
	};

	if (loading) {
		return (
			<Card className="p-6">
				<h3 className="text-lg font-semibold text-foreground mb-4">Active Sessions</h3>
				<div className="text-muted-foreground">Loading sessions...</div>
			</Card>
		);
	}

	const handleJoinClick = (sessionId: number) => {
		setSelectedSessionId(sessionId);
		setIsModalOpen(true);
	};

	return (
		<>
			<Card className="p-6">
				<div className="flex items-center justify-between mb-6">
					<h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
					<div className="flex gap-2">
						<div className="flex items-center gap-2">
							{/* <Input 
                    placeholder="Session ID" 
                    className="h-8 w-28 px-2 rounded-md ring-0 bg-background text-sm"
                    value={joinId}
                    onChange={(e) => setJoinId(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={handleJoinById}>
                  Join ID
                </Button> */}
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={fetchSessions}
							disabled={refreshing}
							className="gap-2"
						>
							<RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
							Refresh
						</Button>
					</div>
				</div>

				<div className="max-h-[400px] overflow-y-auto space-y-4 pr-2">
					{sessions.length === 0 ? (
						<p className="text-muted-foreground text-sm">No active sessions found.</p>
					) : (
						sessions.map((session) => (
							<div
								key={session.id}
								className={`p-4 rounded-lg border border-border bg-gradient-to-r ${
									subjectColors[session.subject] || subjectColors.OTHER
								}`}
							>
								<div className="flex items-start justify-between">
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-1">
											<h4 className="font-semibold text-foreground">
												{session.title}
												<span className="ml-2 text-xs font-normal text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded">
													ID: {session.id}
												</span>
											</h4>
											<span
												className={`text-xs px-2 py-1 rounded-full bg-pale-green text-status-live-fg border border-pale-green/50`}
											>
												● Live
											</span>
										</div>
										<p className="text-sm text-muted-foreground">
											Hosted by {session.creator?.fullName ?? "User #" + session.creatorId}
										</p>
									</div>

									{session.creatorId === user?.id ? (
										<Button
											size="sm"
											variant="secondary"
											className="gap-2"
											onClick={() => handleDetailsClick(session.id)}
										>
											Details
										</Button>
									) : (
										session.status === "ACTIVE" && (
											<Button
												size="sm"
												className="gap-2"
												onClick={() => handleJoinClick(session.id)}
											>
												<Play className="h-4 w-4" />
												Join
											</Button>
										)
									)}
								</div>
								<div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
									<div className="flex items-center gap-1">
										<Clock className="h-4 w-4" />
										<span> {computeDuration(session.startTime, session.endTime)}</span>
									</div>
									<div className="flex items-center gap-1">
										<Users className="h-4 w-4" />
										<span>
											{session.participantCount == 1
												? "1 participant"
												: session.participantCount + " participants"}
										</span>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</Card>

			{selectedSessionId && (
				<JoinSessionModal sessionId={selectedSessionId} open={isModalOpen} onOpenChange={setIsModalOpen} />
			)}
		</>
	);
}
