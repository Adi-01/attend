"use client";
import { useQuery } from "@tanstack/react-query";
import {
  getCurrentShift,
  getLatestAttendanceRecords,
  getMonthlyAttendanceSheet,
} from "./employee.attendance.actions";

// 🔹 1) Get last 1–2 attendance records
export function useLatestAttendanceQuery() {
  return useQuery({
    queryKey: ["attendance", "latest"],
    queryFn: () => getLatestAttendanceRecords(),
    staleTime: 1000 * 60 * 30, // 2 minutes cache
  });
}

// 🔹 2) Get today's active shift (if checked in)
export function useCurrentShiftQuery() {
  return useQuery({
    queryKey: ["attendance", "current-shift"],
    queryFn: () => getCurrentShift(),
    staleTime: 1000 * 60 * 10, // 10 minute
  });
}

export function useMonthlyAttendance(month: number, year: number) {
  return useQuery({
    // Unique key: changing month/year triggers a re-fetch automatically
    queryKey: ["attendance", "monthly", month, year],

    queryFn: async () => {
      // API expects 1-12, UI sends 1-12 (we handle the +1 conversion in the component)
      const res = await getMonthlyAttendanceSheet(month, year);
      if (!res.success) throw new Error("Failed to fetch attendance");
      return res.data; // Returns Record<number, number>
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    placeholderData: (previousData) => previousData, // Keep showing old month while new one loads
  });
}
