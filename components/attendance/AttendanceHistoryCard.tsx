"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  history: any[] | undefined;
  isLoading: boolean;
}

export default function AttendanceHistoryCard({ history, isLoading }: Props) {
  // simple helper to format time safely
  const formatTime = (isoString: string) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900/50 text-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-zinc-400" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full bg-zinc-800 rounded-lg" />
            <Skeleton className="h-12 w-full bg-zinc-800 rounded-lg" />
          </div>
        ) : history && history.length > 0 ? (
          <div className="space-y-3">
            {history.map((rec) => (
              <div
                key={rec.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      rec.checkedOut
                        ? "bg-green-900/20 text-green-500"
                        : "bg-yellow-900/20 text-yellow-500"
                    }`}
                  >
                    {rec.checkedOut ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Clock size={16} />
                    )}
                  </div>
                  <div className="flex flex-col">
                    {/* Primary Date */}
                    <span className="font-medium text-sm text-zinc-200">
                      {formatDate(rec.checkInAt)}
                    </span>

                    {/* Time Range */}
                    <span className="text-xs text-zinc-500 mt-0.5">
                      {formatTime(rec.checkInAt)}
                      {rec.checkOutAt &&
                        ` - ${formatTime(rec.checkOutAt)}`} at {rec.location}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-zinc-500 text-sm">
            No recent attendance records found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
