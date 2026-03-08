// @/hooks/useAttendance.ts
"use client";

import { useState } from "react";
import {
  useCurrentShiftQuery,
  useLatestAttendanceQuery,
} from "@/lib/actions/employee.attendance.queries";
import {
  useCheckInMutation,
  useCheckOutMutation,
} from "@/lib/actions/employee.attendance.mutations";
import { WorkLocation } from "@/constants/location";

export function useAttendance() {
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

  const checkInMutation = useCheckInMutation();
  const checkOutMutation = useCheckOutMutation();

  const [error, setError] = useState<string | null>(null);

  // --- ACTIONS NOW ACCEPT COORDINATES DIRECTLY ---
  const checkIn = async (
    workLocation: WorkLocation,
    lat: number,
    lng: number,
  ) => {
    try {
      checkInMutation.mutate({
        latitude: lat,
        longitude: lng,
        workLocation,
      });
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const checkOut = async (lat: number, lng: number) => {
    try {
      checkOutMutation.mutate({
        latitude: lat,
        longitude: lng,
      });
    } catch (err: any) {
      setError(err.toString());
    }
  };

  const isBusy = checkInMutation.isPending || checkOutMutation.isPending;

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
