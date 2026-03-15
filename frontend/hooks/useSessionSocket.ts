"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { StudySessionDTO, ActivityDTO } from "@/types";

interface UseSessionSocketOptions {
	sessionId: string | string[];
	onParticipantsUpdate?: (session: StudySessionDTO) => void;
	onNewActivity?: (activity: ActivityDTO) => void;
	onSessionEnded?: () => void;
	enabled?: boolean;
}

/**
 * Custom hook to subscribe to real-time session events via WebSocket (STOMP).
 *
 * Connects to the backend STOMP broker at /ws and subscribes to:
 * - /topic/session/{id}/participants — participant list updates
 * - /topic/session/{id}/activities  — new chat messages, hand-raises, etc.
 * - /topic/session/{id}/ended       — session ended notification
 */
export function useSessionSocket({
	sessionId,
	onParticipantsUpdate,
	onNewActivity,
	onSessionEnded,
	enabled = true,
}: UseSessionSocketOptions) {
	const clientRef = useRef<Client | null>(null);

	// Use refs for callbacks to avoid re-subscribing on every callback change
	const onParticipantsUpdateRef = useRef(onParticipantsUpdate);
	const onNewActivityRef = useRef(onNewActivity);
	const onSessionEndedRef = useRef(onSessionEnded);

	useEffect(() => {
		onParticipantsUpdateRef.current = onParticipantsUpdate;
		onNewActivityRef.current = onNewActivity;
		onSessionEndedRef.current = onSessionEnded;
	}, [onParticipantsUpdate, onNewActivity, onSessionEnded]);

	useEffect(() => {
		if (!enabled || !sessionId) return;

		const id = Array.isArray(sessionId) ? sessionId[0] : sessionId;

		const client = new Client({
			// SockJS endpoint — STOMP.js will automatically use SockJS transport
			brokerURL: undefined, // Not using raw WebSocket
			webSocketFactory: () => {
				// Use SockJS for the connection (with HTTP fallback)
				// eslint-disable-next-line @typescript-eslint/no-require-imports
				const SockJS = require("sockjs-client");
				return new SockJS("http://localhost:8080/ws");
			},
			reconnectDelay: 5000,
			heartbeatIncoming: 10000,
			heartbeatOutgoing: 10000,
			debug: (str: string) => {
				// Only log in development
				if (process.env.NODE_ENV === "development") {
					console.log("[STOMP]", str);
				}
			},
			onConnect: () => {
				console.log("[STOMP] Connected to session", id);

				// Subscribe to participants updates
				client.subscribe(`/topic/session/${id}/participants`, (message: IMessage) => {
					try {
						const sessionData: StudySessionDTO = JSON.parse(message.body);
						onParticipantsUpdateRef.current?.(sessionData);
					} catch (e) {
						console.error("[STOMP] Failed to parse participants update", e);
					}
				});

				// Subscribe to new activities (chat messages, hand-raises, etc.)
				client.subscribe(`/topic/session/${id}/activities`, (message: IMessage) => {
					try {
						const activity: ActivityDTO = JSON.parse(message.body);
						onNewActivityRef.current?.(activity);
					} catch (e) {
						console.error("[STOMP] Failed to parse activity", e);
					}
				});

				// Subscribe to session ended event
				client.subscribe(`/topic/session/${id}/ended`, () => {
					console.log("[STOMP] Session ended");
					onSessionEndedRef.current?.();
				});
			},
			onStompError: (frame: { headers: Record<string, string> }) => {
				console.error("[STOMP] Error:", frame.headers["message"]);
			},
			onDisconnect: () => {
				console.log("[STOMP] Disconnected");
			},
		});

		client.activate();
		clientRef.current = client;

		return () => {
			if (client.active) {
				client.deactivate();
			}
		};
	}, [sessionId, enabled]);

	const sendMessage = useCallback((destination: string, body: object) => {
		if (clientRef.current?.active) {
			clientRef.current.publish({
				destination,
				body: JSON.stringify(body),
			});
		}
	}, []);

	return { sendMessage };
}
