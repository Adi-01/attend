"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMonthlyAttendance } from "@/lib/actions/employee.attendance.queries";

// Constants
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - 1 + i,
).map(String);

export default function AttendanceSheet() {
  const today = new Date();

  // State
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const { data: attendanceMap, isLoading } = useMonthlyAttendance(
    selectedMonth + 1,
    selectedYear,
  );

  // --- Calendar Math ---
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const startDayOfWeek = new Date(selectedYear, selectedMonth, 1).getDay();

  // --- Render Helpers ---
  const renderDay = (day: number) => {
    const shiftCount = attendanceMap?.[day] || 0;

    const currentCellDate = new Date(selectedYear, selectedMonth, day);
    const cleanToday = new Date();
    cleanToday.setHours(0, 0, 0, 0);

    const isFuture = currentCellDate > cleanToday;
    const isToday = currentCellDate.getTime() === cleanToday.getTime();

    let content = null;
    let className = "bg-zinc-800/50 text-zinc-500";

    if (shiftCount > 0) {
      const isDouble = shiftCount > 1;
      content = isDouble ? "2P" : "P";
      className = isDouble
        ? "text-green-300 font-bold"
        : "text-green-400 font-bold";
    } else if (!isFuture) {
      content = "A";
      className = "text-red-500 font-bold";
    }

    return (
      <div
        key={day}
        className={`
          aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all
          ${isToday ? "ring-2 ring-indigo-500/40 bg-zinc-900" : "bg-zinc-900/50"} 
          border border-zinc-800
        `}
      >
        <span className="text-[8px] md:text-xs text-zinc-500 absolute top-1 left-1 md:top-1.5 md:left-2">
          {day}
        </span>
        {content && (
          <div
            className={`w-6 h-6 md:w-9 md:h-9 text-[10px] md:text-sm rounded-full flex items-end justify-end shadow-sm ${className}`}
          >
            {content}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="border-zinc-800 bg-zinc-950 text-white w-full max-w-xl mx-auto shadow-2xl">
      <CardHeader className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <CardTitle>Attendance Sheet</CardTitle>

          {/* SELECTORS */}
          <div className="flex gap-2">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={i.toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] bg-zinc-900 border-zinc-700">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* LEGEND */}
        <div className="flex gap-4 text-xs justify-center pt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-green-400 font-bold">
              P
            </div>
            <span className="text-zinc-400">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-green-300 font-bold">
              2P
            </div>
            <span className="text-zinc-400">Double</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-red-500 font-bold">
              A
            </div>
            <span className="text-zinc-400">Absent</span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* GRID CONTAINER */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {/* Weekday Headers */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div
              key={d}
              className="text-zinc-500 text-[10px] font-bold uppercase py-2 tracking-wider"
            >
              {d}
            </div>
          ))}

          {isLoading ? (
            // --- SKELETON STATE ---
            // Render 35 generic empty slots to simulate a month
            Array.from({ length: 35 }).map((_, i) => (
              <Skeleton
                key={`skel-${i}`}
                className="aspect-square rounded-lg bg-zinc-900 border border-zinc-800/50"
              />
            ))
          ) : (
            // --- ACTUAL CONTENT ---
            <>
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) =>
                renderDay(i + 1),
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
