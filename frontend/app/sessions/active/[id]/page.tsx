"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, MessageSquare, Pause, Play, Coffee, LogOut, Volume2, VolumeX, Hand, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { StudySessionDTO, ActivityDTO, UserDTO } from "@/types";
import { useAuth } from "@/context/auth-context";
import { TransferSessionHostDialog } from "@/components/sessions/transfer-session-host-modal";
import { useSessionSocket } from "@/hooks/useSessionSocket";
import { SessionHeader } from "@/components/sessions/active/session-header";
import { SessionTimerControls } from "@/components/sessions/active/session-timer-controls";
import { SessionParticipantsPanel } from "@/components/sessions/active/session-participants-panel";
import { SessionActivityFeed } from "@/components/sessions/active/session-activity-feed";

const TIMER_MULTIPLIER = 1;

export default function ActiveSessionPage() {
	const params = useParams();
	const router = useRouter();
	const { user } = useAuth();
	const sessionId = params.id;

	const [isPlaying, setIsPlaying] = useState(true);
	const [isMuted, setIsMuted] = useState(true);
	const [elapsedTime, setElapsedTime] = useState(0);
	const [message, setMessage] = useState("");

	const [session, setSession] = useState<StudySessionDTO | null>(null);
	const [activities, setActivities] = useState<ActivityDTO[]>([]);
	const [loading, setLoading] = useState(true);

	// Per-user timer tracking
	const [userStartTime, setUserStartTime] = useState<number | null>(null);
	const [totalPausedTime, setTotalPausedTime] = useState(0);
	const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
	const [hasJoined, setHasJoined] = useState(false);

	const [showTransferDialog, setShowTransferDialog] = useState(false);

	// Leave Session Dialog State
	const [showLeaveDialog, setShowLeaveDialog] = useState(false);

	// Hand-raise tracking
	const [handRaisedUsers, setHandRaisedUsers] = useState<Set<number>>(new Set());

	// Auto-join session when entering (if not creator)
	useEffect(() => {
		const joinSession = async () => {
			if (!user || !sessionId || hasJoined) return;

			try {
				const sessionData = await api.get<StudySessionDTO>(`/sessions/${sessionId}`);

				// If user is not the creator and not already a participant, join
				const isCreator = sessionData.creatorId === user.id;
				const isParticipant = sessionData.participants?.some((p) => p.id === user.id);

				if (!isCreator && !isParticipant) {
					await api.post(`/sessions/${sessionId}/participants/${user.id}`, {});
					toast.success("Joined session!");
				}

				// Set status to STUDYING when entering session
				await api.put(`/users/${user.id}/status?status=STUDYING`, {});

				setHasJoined(true);
			} catch (error) {
				console.error("Failed to join session:", error);
			}
		};

		joinSession();
	}, [user, sessionId, hasJoined]);

	// Fetch session data and activities on mount (initial load only)
	useEffect(() => {
		if (!sessionId) return;

		const fetchData = async () => {
			try {
				const sessionData = await api.get<StudySessionDTO>(`/sessions/${sessionId}`);
				setSession(sessionData);

				const activitiesData = await api.get<ActivityDTO[]>(`/activities/session/${sessionId}`);
				setActivities(activitiesData);
			} catch (error) {
				console.error("Failed to load session:", error);
				toast.error("Failed to load session details");
				router.push("/dashboard");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [sessionId, router]);

	// WebSocket real-time updates
	const handleParticipantsUpdate = useCallback((updatedSession: StudySessionDTO) => {
		setSession(updatedSession);
	}, []);

	const handleNewActivity = useCallback((activity: ActivityDTO) => {
		setActivities((prev) => {
			// Prevent duplicate activities
			if (prev.some((a) => a.id === activity.id)) return prev;
			return [...prev, activity];
		});

		// Track hand-raise with auto-clear after 10s
		if (activity.type === "HAND_RAISE" && activity.userId) {
			setHandRaisedUsers((prev) => new Set(prev).add(activity.userId!));
			setTimeout(() => {
				setHandRaisedUsers((prev) => {
					const next = new Set(prev);
					next.delete(activity.userId!);
					return next;
				});
			}, 10000);
		}
	}, []);

	const handleSessionEnded = useCallback(() => {
		toast.info("Session has ended");
		if (session?.studyGroupId) {
			router.push(`/groups/${session.studyGroupId}`);
		} else {
			router.push("/dashboard");
		}
	}, [session?.studyGroupId, router]);

	useSessionSocket({
		sessionId: sessionId as string,
		onParticipantsUpdate: handleParticipantsUpdate,
		onNewActivity: handleNewActivity,
		onSessionEnded: handleSessionEnded,
		enabled: !loading,
	});

	// Initialize user's timer based on server data
	useEffect(() => {
		if (session && user) {
			// Find current user in participants to get true join time
			// Use loose equality (==) to handle potential string/number mismatches
			const currentUserParticipant = session.participants?.find((p) => p.id == user.id);

			if (currentUserParticipant) {
				// 1. Join Time
				if (currentUserParticipant.joinedAt) {
					const joinedTime = new Date(currentUserParticipant.joinedAt).getTime();
					if (!isNaN(joinedTime)) {
						setUserStartTime(joinedTime);
					}
				}

				// 2. Pause Logic
				let historicalPausedSeconds = currentUserParticipant.totalPausedSeconds || 0;
				let currentActivePauseCals = 0;

				// If currently paused (has lastPausedAt timestamp), calculate duration until NOW
				if (currentUserParticipant.lastPausedAt) {
					const lastPausedTime = new Date(currentUserParticipant.lastPausedAt).getTime();
					if (!isNaN(lastPausedTime)) {
						// Timer is currently PAUSED
						setIsPlaying(false);
						// Add the duration from last pause until now to total
						currentActivePauseCals = (new Date().getTime() - lastPausedTime) / 1000;
					}
				} else {
					// If no lastPausedAt, user is actively studying
					setIsPlaying(true);
				}

				// Set total paused time (converting seconds to ms)
				// SMOOTHING FIX: Only update if significant difference (>2s) to avoid jitter from network latency
				const serverTotalPausedMs = (historicalPausedSeconds + currentActivePauseCals) * 1000;

				setTotalPausedTime((prev) => {
					const diff = Math.abs(serverTotalPausedMs - prev);
					// If difference is small (< 2000ms), prefer local state to prevent UI jumps
					// But ALWAYS update if we are initializing (prev === 0)
					if (prev === 0 || diff > 2000) {
						return serverTotalPausedMs;
					}
					return prev;
				});

				// Calculate initial elapsed time immediately if not yet set
				const startTime = currentUserParticipant.joinedAt
					? new Date(currentUserParticipant.joinedAt).getTime()
					: new Date().getTime();

				if (!isNaN(startTime) && elapsedTime === 0) {
					const now = new Date().getTime();
					const elapsed = Math.floor((now - startTime - serverTotalPausedMs) / 1000) * TIMER_MULTIPLIER;
					setElapsedTime(elapsed > 0 ? elapsed : 0);
				}
			} else if (!userStartTime) {
				setUserStartTime(new Date().getTime());
			}
		}
	}, [session, user]);

	// User's personal stopwatch timer - runs independently every second
	useEffect(() => {
		if (!isPlaying || !userStartTime) return;

		// Calculate elapsed time every second
		const timerInterval = setInterval(() => {
			const now = new Date().getTime();
			// totalPausedTime needs to stay static here while playing?
			// Actually, standard stopwatch logic: elapsed = (Now - Start) - TotalPaused
			const elapsed = Math.floor((now - userStartTime - totalPausedTime) / 1000) * TIMER_MULTIPLIER;
			setElapsedTime(elapsed > 0 ? elapsed : 0);
		}, 1000);

		return () => clearInterval(timerInterval);
	}, [isPlaying, userStartTime, totalPausedTime]);

	const handleTransferAndLeave = async (newHostId: number) => {
		if (!user || !sessionId) return;
		try {
			// 1. Transfer Host
			await api.put(`/sessions/${sessionId}/transfer?newHostId=${newHostId}`, {});

			// 2. Perform Leave Logic
			if (userStartTime) {
				const now = new Date().getTime();
				const totalElapsed = (now - userStartTime - totalPausedTime) * TIMER_MULTIPLIER;
				const studyMinutes = Math.floor(totalElapsed / 60000);

				await api.delete(`/sessions/${sessionId}/participants/${user.id}?studyMinutes=${studyMinutes}`);
				toast.success("Host transferred and left session");
			}

			await api.put(`/users/${user.id}/status?status=ONLINE`, {});

			if (session?.studyGroupId) {
				router.push(`/groups/${session.studyGroupId}`);
			} else {
				router.push("/dashboard");
			}
		} catch (error) {
			console.error("Failed to transfer and leave:", error);
			toast.error("Failed to transfer host");
		}
	};

	const handleLeaveSession = async () => {
		if (!user || !session) return;

		const isCreator = session.creatorId === user.id;
		// Active participants excluding self
		const otherParticipants = (session.participants || []).filter((p) => !p.leftAt && p.id !== user.id);

		if (isCreator && otherParticipants.length > 0) {
			// Prompt Transfer
			setShowTransferDialog(true);
			return;
		}

		// Show leave confirmation dialog
		setShowLeaveDialog(true);
	};

	// Complex Business Operation.
	const confirmLeaveSession = async () => {
		if (!user || !session) return;
		setShowLeaveDialog(false);

		try {
			if (userStartTime) {
				const now = new Date().getTime();
				const totalElapsed = (now - userStartTime - totalPausedTime) * TIMER_MULTIPLIER;
				const studyMinutes = Math.floor(totalElapsed / 60000);

				await api.delete(`/sessions/${sessionId}/participants/${user.id}?studyMinutes=${studyMinutes}`);
				toast.success("Left session");
			}

			await api.put(`/users/${user.id}/status?status=ONLINE`, {});

			if (session.studyGroupId) {
				router.push(`/groups/${session.studyGroupId}`);
			} else {
				router.push("/dashboard");
			}
		} catch (error) {
			console.error("Failed to leave session:", error);
			toast.error("Failed to leave session");
		}
	};

	const handlePauseToggle = async () => {
		const newIsPlaying = !isPlaying;
		setIsPlaying(newIsPlaying);
		const now = new Date().getTime();

		if (user && sessionId) {
			try {
				if (!newIsPlaying) {
					// User is pausing (going on break)
					setPauseStartTime(now);

					await api.put(`/sessions/${sessionId}/participants/${user.id}/pause`, {});
				} else {
					let currentPauseStart = pauseStartTime;

					const currentUserParticipant = session?.participants?.find((p) => p.id == user.id);
					if (currentUserParticipant?.lastPausedAt) {
						const serverPauseStart = new Date(currentUserParticipant.lastPausedAt).getTime();
						if (!isNaN(serverPauseStart)) {
							currentPauseStart = serverPauseStart;
						}
					}

					if (currentPauseStart) {
						const pauseDuration = now - currentPauseStart;

						const historicalSeconds = currentUserParticipant?.totalPausedSeconds || 0;
						const newTotalMs = historicalSeconds * 1000 + pauseDuration;

						setTotalPausedTime((prev) => Math.max(prev, newTotalMs));
					}

					setPauseStartTime(null);

					await api.put(`/sessions/${sessionId}/participants/${user.id}/resume`, {});
				}
			} catch (error) {
				console.error("Failed to sync pause state:", error);
				setIsPlaying(!newIsPlaying);
				toast.error("Failed to update status");
			}
		}
	};

	const handleRaiseHand = async () => {
		if (!user || !sessionId) return;
		try {
			const params = new URLSearchParams({
				sessionId: sessionId as string,
				userId: user.id.toString(),
				type: "HAND_RAISE",
				message: `${user.fullName} raised their hand`,
			});

			await api.post(`/activities?${params.toString()}`, {});
			toast.success("Hand raised! ✋");
		} catch (e) {
			console.error("Failed to raise hand", e);
		}
	};

	const handleSendMessage = async () => {
		if (!message.trim() || !user || !sessionId) return;
		try {
			const params = new URLSearchParams({
				sessionId: sessionId as string,
				userId: user.id.toString(),
				type: "MESSAGE",
				message: message,
			});

			await api.post(`/activities?${params.toString()}`, {});

			setMessage("");
		} catch (e) {
			console.error("Failed to send message", e);
			toast.error("Failed to send message");
		}
	};

	if (loading) {
		return <div className="min-h-screen flex items-center justify-center">Loading session...</div>;
	}

	if (!session) return null;

	const participantsList = (session.participants || []).filter((p) => !p.leftAt);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[var(--pale-blue)] via-[var(--pale-purple)] to-[var(--pale-green)] p-4 lg:p-6">
			<div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] lg:h-[calc(100vh-3rem)] grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 lg:gap-6">
				{/* Main Content Area */}
				<div className="flex flex-col gap-4 lg:gap-6 min-h-0">
					<SessionHeader
						session={session}
						participantCount={participantsList.length}
						onLeaveSession={handleLeaveSession}
					/>

					<SessionTimerControls
						elapsedTime={elapsedTime}
						isPlaying={isPlaying}
						participantsList={participantsList}
						onPauseToggle={handlePauseToggle}
						onRaiseHand={handleRaiseHand}
					/>
				</div>

				{/* Right Sidebar - Participants & Activity */}
				<div className="flex flex-col gap-4 lg:gap-6 min-h-0 max-h-[calc(100vh-2rem)] lg:max-h-[calc(100vh-3rem)]">
					<SessionParticipantsPanel
						participantsList={participantsList}
						creatorId={session.creatorId}
						handRaisedUsers={handRaisedUsers}
					/>

					<SessionActivityFeed
						activities={activities}
						message={message}
						onMessageChange={setMessage}
						onSendMessage={handleSendMessage}
					/>
				</div>

				<TransferSessionHostDialog
					open={showTransferDialog}
					onOpenChange={setShowTransferDialog}
					sessionTitle={session?.title || "Session"}
					participants={(session?.participants || []).filter((p) => p.id !== user?.id && !p.leftAt)}
					onTransferAndLeave={handleTransferAndLeave}
				/>

				{/* Leave Session Confirmation Dialog */}
				<AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>
								{session?.participants?.length === 1 ? "End Session?" : "Leave Session?"}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{session?.participants?.length === 1
									? "Are you sure you want to end this session? Since you are the only one here, it will be closed."
									: "Are you sure you want to leave this session? Your study time will be saved."}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onClick={confirmLeaveSession}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{session?.participants?.length === 1 ? "End Session" : "Leave"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
