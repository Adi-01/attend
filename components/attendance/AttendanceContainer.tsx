"use client";

import { useAttendance } from "@/hooks/useAttendance"; // Adjust path
import AttendanceStatusCard from "./AttendanceStatusCard";
import AttendanceHistoryCard from "./AttendanceHistoryCard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface Props {
  username: string;
}

export default function AttendanceContainer({ username }: Props) {
  // Use the custom hook
  const {
    shift,
    history,
    isBusy, // Global "processing" state
    isLoadingData, // Initial fetch state
    error,
    checkIn,
    checkOut,
  } = useAttendance();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Component 1: Hello + Status */}
      <AttendanceStatusCard
        username={username}
        shift={shift}
        // Show skeleton ONLY if we are initially loading data
        isLoading={isLoadingData}
        // Disable buttons if we are busy (mutating, locating, etc.)
        isProcessing={isBusy}
        onCheckIn={checkIn}
        onCheckOut={checkOut}
      />

      {/* Component 2: History */}
      <AttendanceHistoryCard history={history} isLoading={isLoadingData} />
    </div>
  );
}
