"use client";

import {
  REALTIME_CLIENT_EVENTS,
  REALTIME_EVENTS,
  type CampaignCompletedPayload,
  type CampaignProgressPayload,
  type RecipientUpdatePayload,
} from "@xeno/shared";
import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:3001";

const EMPTY_STATE = {
  connected: false,
  progress: null as CampaignProgressPayload | null,
  updates: [] as RecipientUpdatePayload[],
  completed: null as CampaignCompletedPayload | null,
};

export function useCampaignSocket(campaignId: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(EMPTY_STATE.connected);
  const [progress, setProgress] = useState(EMPTY_STATE.progress);
  const [updates, setUpdates] = useState(EMPTY_STATE.updates);
  const [completed, setCompleted] = useState(EMPTY_STATE.completed);

  useEffect(() => {
    setConnected(EMPTY_STATE.connected);
    setProgress(EMPTY_STATE.progress);
    setUpdates(EMPTY_STATE.updates);
    setCompleted(EMPTY_STATE.completed);

    if (!campaignId) return;

    const socket = io(WS_URL, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit(REALTIME_CLIENT_EVENTS.joinCampaign, campaignId);
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on(
      REALTIME_EVENTS.recipientUpdate,
      (payload: RecipientUpdatePayload) => {
        setUpdates((prev) => [payload, ...prev].slice(0, 20));
      },
    );

    socket.on(
      REALTIME_EVENTS.campaignProgress,
      (payload: CampaignProgressPayload) => {
        setProgress(payload);
      },
    );

    socket.on(
      REALTIME_EVENTS.campaignCompleted,
      (payload: CampaignCompletedPayload) => {
        setCompleted(payload);
        setProgress((prev) =>
          prev ? { ...prev, status: "COMPLETED", progressPercent: 100 } : prev,
        );
      },
    );

    return () => {
      socket.emit(REALTIME_CLIENT_EVENTS.leaveCampaign, campaignId);
      socket.disconnect();
      socketRef.current = null;
      setConnected(EMPTY_STATE.connected);
      setProgress(EMPTY_STATE.progress);
      setUpdates(EMPTY_STATE.updates);
      setCompleted(EMPTY_STATE.completed);
    };
  }, [campaignId]);

  return { connected, progress, updates, completed };
}
