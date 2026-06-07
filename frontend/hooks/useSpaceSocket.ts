"use client";

import { useEffect, useRef, useCallback } from "react";
import { Client, IMessage } from "@stomp/stompjs";
import { SpaceMessage } from "@/types/workspaces";

interface UseSpaceSocketOptions {
    spaceId: string | string[];
    onNewMessage?: (message: SpaceMessage) => void;
    enabled?: boolean;
}

/**
 * Custom hook to subscribe to real-time space chat events via WebSocket (STOMP).
 */
export function useSpaceSocket({
    spaceId,
    onNewMessage,
    enabled = true,
}: UseSpaceSocketOptions) {
    const clientRef = useRef<Client | null>(null);

    const onNewMessageRef = useRef(onNewMessage);

    useEffect(() => {
        onNewMessageRef.current = onNewMessage;
    }, [onNewMessage]);

    useEffect(() => {
        if (!enabled || !spaceId) return;

        const id = Array.isArray(spaceId) ? spaceId[0] : spaceId;

        const client = new Client({
            brokerURL: undefined,
            webSocketFactory: () => {
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const SockJS = require("sockjs-client");
                return new SockJS("http://localhost:8080/ws");
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
            debug: (str: string) => {
                if (process.env.NODE_ENV === "development") {
                    console.log("[STOMP Space]", str);
                }
            },
            onConnect: () => {
                console.log("[STOMP] Connected to space chat", id);

                client.subscribe(`/topic/space/${id}/chat`, (message: IMessage) => {
                    try {
                        const chatMessage: SpaceMessage = JSON.parse(message.body);
                        onNewMessageRef.current?.(chatMessage);
                    } catch (e) {
                        console.error("[STOMP] Failed to parse space message", e);
                    }
                });
            },
            onStompError: (frame: Readonly<{ headers: Record<string, string> }>) => {
                console.error("[STOMP] Error:", frame.headers["message"]);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.active) {
                client.deactivate();
            }
        };
    }, [spaceId, enabled]);

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
