import { useState, useEffect, useCallback, useRef } from "react";
import * as matchingService from "@/services/matchingService";

function parseTimestampToMs(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(" ", "T");
  normalized = normalized.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  normalized = normalized.replace(/([+-]\d{2})$/, "$1:00");

  const ms = Date.parse(normalized);
  if (!Number.isFinite(ms)) {
    const ms2 = Date.parse(trimmed);
    return Number.isFinite(ms2) ? ms2 : null;
  }
  return ms;
}

interface MatchingStatus {
  status: "idle" | "searching" | "pending_response" | "negotiating" | "completed" | "failed" | "cancelled";
  matchingRequestId: string | null;
  notificationId: string | null;
  currentCourier: {
    id: string;
    name: string;
    distance: number;
  } | null;
  expiresAt: string | null;
  driversRemaining: number;
  error: string | null;
}

export function useAutoMatching(leadId: string | null) {
  const [matchingStatus, setMatchingStatus] = useState<MatchingStatus>({
    status: "idle",
    matchingRequestId: null,
    notificationId: null,
    currentCourier: null,
    expiresAt: null,
    driversRemaining: 0,
    error: null,
  });
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timeoutTriggeredRef = useRef(false);

  const checkTimeout = useCallback(async () => {
    if (!matchingStatus.matchingRequestId) return;

    try {
      const data = await matchingService.findDriver({
        action: "check_timeout",
        matching_request_id: matchingStatus.matchingRequestId,
      });

      if (data.success && data.courier) {
        timeoutTriggeredRef.current = false;
        setMatchingStatus((prev) => ({
          ...prev,
          status: "pending_response",
          notificationId: data.notification_id ?? prev.notificationId,
          currentCourier: data.courier ?? prev.currentCourier,
          expiresAt: data.expires_at ?? prev.expiresAt,
          driversRemaining: data.drivers_remaining ?? prev.driversRemaining,
        }));
      } else if (data.status === "failed") {
        setMatchingStatus((prev) => ({
          ...prev,
          status: "failed",
          error: data.message || "No more drivers available",
        }));
      } else if (data.status === "negotiating") {
        setMatchingStatus((prev) => ({
          ...prev,
          status: "negotiating",
        }));
      }
    } catch {
      // Ignore check timeout errors
    }
  }, [matchingStatus.matchingRequestId]);

  useEffect(() => {
    if (!matchingStatus.matchingRequestId) return;

    const pollInterval = setInterval(() => {
      void checkTimeout();
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [matchingStatus.matchingRequestId, checkTimeout]);

  useEffect(() => {
    if (!matchingStatus.expiresAt || matchingStatus.status !== "pending_response") {
      setTimeLeft(null);
      return;
    }

    timeoutTriggeredRef.current = false;

    const computeSecondsLeft = () => {
      const expiresMs = parseTimestampToMs(matchingStatus.expiresAt!);
      if (expiresMs === null) return null;
      const remainingMs = Math.max(0, expiresMs - Date.now());
      return Math.floor(remainingMs / 1000);
    };

    const tick = async () => {
      const seconds = computeSecondsLeft();
      if (seconds === null) {
        if (!timeoutTriggeredRef.current) {
          timeoutTriggeredRef.current = true;
          await checkTimeout();
        }
        setTimeLeft(null);
        return;
      }

      setTimeLeft(seconds);

      if (seconds <= 0 && !timeoutTriggeredRef.current) {
        timeoutTriggeredRef.current = true;
        await checkTimeout();
      }
    };

    void tick();

    const interval = setInterval(() => {
      void tick();
    }, 1000);

    const serverInterval = setInterval(() => {
      void checkTimeout();
    }, 10_000);

    return () => {
      clearInterval(interval);
      clearInterval(serverInterval);
    };
  }, [matchingStatus.expiresAt, matchingStatus.status, checkTimeout]);

  const startMatching = useCallback(
    async (initialOffer: number, pickupLatitude: number, pickupLongitude: number) => {
      if (!leadId) return;

      setMatchingStatus((prev) => ({
        ...prev,
        status: "searching",
        error: null,
      }));

      try {
        const data = await matchingService.findDriver({
          action: "start",
          lead_id: leadId,
          initial_offer: initialOffer,
          pickup_latitude: pickupLatitude,
          pickup_longitude: pickupLongitude,
        });

        if (data.success) {
          const matchingRequestId =
            (data as { matching_request_id?: string }).matching_request_id ?? null;
          setMatchingStatus({
            status: "pending_response",
            matchingRequestId,
            notificationId: data.notification_id ?? null,
            currentCourier: data.courier ?? null,
            expiresAt: data.expires_at ?? null,
            driversRemaining: data.drivers_remaining ?? 0,
            error: null,
          });
        } else {
          setMatchingStatus((prev) => ({
            ...prev,
            status: "failed",
            error: data.message || "No drivers available",
          }));
        }
      } catch (err) {
        setMatchingStatus((prev) => ({
          ...prev,
          status: "failed",
          error: err instanceof Error ? err.message : "Failed to start matching",
        }));
      }
    },
    [leadId]
  );

  const cancelMatching = useCallback(async () => {
    if (!matchingStatus.matchingRequestId) return;

    try {
      await matchingService.cancelMatching(matchingStatus.matchingRequestId);
      setMatchingStatus({
        status: "cancelled",
        matchingRequestId: null,
        notificationId: null,
        currentCourier: null,
        expiresAt: null,
        driversRemaining: 0,
        error: null,
      });
    } catch {
      // Still reset local state on cancel attempt
      setMatchingStatus({
        status: "cancelled",
        matchingRequestId: null,
        notificationId: null,
        currentCourier: null,
        expiresAt: null,
        driversRemaining: 0,
        error: null,
      });
    }
  }, [matchingStatus.matchingRequestId]);

  return {
    matchingStatus,
    timeLeft,
    startMatching,
    cancelMatching,
    checkTimeout,
  };
}
