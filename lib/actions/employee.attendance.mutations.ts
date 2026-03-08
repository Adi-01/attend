"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markCheckIn, markCheckOut } from "./employee.attendance.actions";
import { WorkLocation } from "@/constants/location";

export function useCheckInMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
      workLocation,
    }: {
      latitude: number;
      longitude: number;
      workLocation: WorkLocation;
    }) => markCheckIn(latitude, longitude, workLocation),

    // 'response' is whatever your markCheckIn server action returns
    // (e.g., { ok: true, data: newShift })
    onSuccess: (response, variables) => {
      // 1. INSTANT CACHE UPDATE: Manually inject the new shift so the UI flips instantly
      if (response?.data) {
        queryClient.setQueryData(
          ["attendance", "current-shift"],
          response.data,
        );
      } else {
        // Fallback: Optimistically create a dummy shift object if your server action doesn't return data
        queryClient.setQueryData(["attendance", "current-shift"], {
          workLocation: variables.workLocation,
          checkInAt: new Date().toISOString(),
        });
      }

      // 2. BACKGROUND SYNC: We removed the 'await'.
      // This tells React Query to fetch the fresh data in the background without freezing the UI.
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useCheckOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      latitude,
      longitude,
    }: {
      latitude: number;
      longitude: number;
    }) => markCheckOut(latitude, longitude),

    onSuccess: () => {
      // 1. INSTANT CACHE UPDATE: A check-out means there is no current shift.
      // Setting this to null instantly changes the button back to "Check In".
      queryClient.setQueryData(["attendance", "current-shift"], null);

      // 2. BACKGROUND SYNC: Fetch the updated monthly/latest history in the background.
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
