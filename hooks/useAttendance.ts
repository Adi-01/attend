"use client";

import { useState, useCallback } from "react";
import {
  useCurrentShiftQuery,
  useLatestAttendanceQuery,
} from "@/lib/actions/employee.attendance.queries";
import {
  useCheckInMutation,
  useCheckOutMutation,
} from "@/lib/actions/employee.attendance.mutations";

export function useAttendance() {
  // 1. Queries with Initial Data
  const {
    data: shift,
    isLoading: isShiftLoading,
    isFetching: isShiftFetching,
  } = useCurrentShiftQuery();
  const {
    data: history,
    isLoading: isHistoryLoading,
    isFetching: isHistoryFetching,
  } = useLatestAttendanceQuery();

  // 2. Mutations
  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  // 3. Local State
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Helper: Get Geolocation
  const getLocation = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if (!navigator.geolocation) {
        setIsLocating(false);
        reject("Geolocation is not supported by your browser.");
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setIsLocating(false);
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          },
          (err) => {
            setIsLocating(false);
            let msg = "Location permission denied.";
            if (err.code === 2) msg = "Location unavailable. Turn on GPS.";
            if (err.code === 3) msg = "Location request timed out.";
            reject(msg);
          },
          { enableHighAccuracy: true, timeout: 10000 },
        );
      }
    });
  }, []);

  // 4. Actions (FIXED TYPE MAPPING HERE)
  const checkIn = async (workLocation: "GHCL" | "kajli") => {
    try {
      const loc = await getLocation();

      // Map 'lat/lng' to 'latitude/longitude'
      checkInMutation.mutate({
        latitude: loc.lat,
        longitude: loc.lng,
        workLocation,
      });
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const checkOut = async () => {
    try {
      const loc = await getLocation();

      // Map 'lat/lng' to 'latitude/longitude'
      checkOutMutation.mutate({
        latitude: loc.lat,
        longitude: loc.lng,
      });
    } catch (err: any) {
      setError(err.toString());
    }
  };

  // 5. Unified State
  const isBusy =
    // Is getting location?
    isLocating ||
    // Is sending data to server?
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    // Is updating data from server after the mutation?
    isShiftFetching || // <--- Crucial: Keeps UI locked while refetching
    isHistoryFetching;

  const activeError =
    error ||
    (checkInMutation.isError ? (checkInMutation.error as any).message : null) ||
    (checkOutMutation.isError ? (checkOutMutation.error as any).message : null);

  return {
    shift,
    history,
    isBusy,
    isLoadingData: isShiftLoading || isHistoryLoading,
    error: activeError,
    checkIn,
    checkOut,
  };
}
