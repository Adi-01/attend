"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markCheckIn, markCheckOut } from "./employee.attendance.actions";

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
      workLocation: "GHCL" | "kajli";
    }) => markCheckIn(latitude, longitude, workLocation),

    onSuccess: async () => {
      // await checking the queries so the UI knows we are syncing
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance", "latest"] }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "current-shift"],
        }),
      ]);
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

    onSuccess: async () => {
      // await checking the queries so the UI knows we are syncing
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["attendance", "latest"] }),
        queryClient.invalidateQueries({ queryKey: ["attendance", "monthly"] }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "current-shift"],
        }),
      ]);
    },
  });
}
