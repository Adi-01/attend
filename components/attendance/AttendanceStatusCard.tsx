"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MapPin,
  LogOut,
  Briefcase,
  Loader2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface Props {
  username: string;
  shift: any;
  isLoading: boolean;
  isProcessing: boolean;
  onCheckIn: (loc: "GHCL" | "kajli") => void;
  onCheckOut: () => void;
}

export default function AttendanceStatusCard({
  username,
  shift,
  isLoading,
  isProcessing,
  onCheckIn,
  onCheckOut,
}: Props) {
  // State for the 2-step selection flow
  const [selectedLocation, setSelectedLocation] = useState<
    "GHCL" | "kajli" | null
  >(null);

  // State for the confirmation modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "check-in" | "check-out";
  }>({ isOpen: false, type: "check-in" });

  // --- Handlers ---

  const handleTriggerCheckIn = () => {
    if (selectedLocation) {
      setModalConfig({ isOpen: true, type: "check-in" });
    }
  };

  const handleTriggerCheckOut = () => {
    setModalConfig({ isOpen: true, type: "check-out" });
  };

  const handleConfirmAction = () => {
    if (modalConfig.type === "check-in" && selectedLocation) {
      onCheckIn(selectedLocation);
    } else if (modalConfig.type === "check-out") {
      onCheckOut();
    }
    // Note: We don't close the modal immediately here;
    // we wait for the parent's `isProcessing` to finish or let the UI update handle it.
    // However, for UX, usually we close it and let the button show the loading spinner.
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900 text-white shadow-xl overflow-hidden transition-all">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardDescription className="text-zinc-400">
                Welcome back,
              </CardDescription>
              <CardTitle className="text-2xl font-bold tracking-tight">
                {username}
              </CardTitle>
            </div>
            {isLoading ? (
              <Skeleton className="h-6 w-24 rounded-full bg-zinc-800" />
            ) : (
              <Badge
                variant={shift ? "default" : "secondary"}
                className={
                  shift ? "bg-green-600 hover:bg-green-700" : "bg-zinc-700"
                }
              >
                {shift ? "Active Shift" : "Not Working"}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="py-2">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-zinc-800" />
              </div>
            ) : shift ? (
              // STATE 3: ACTIVE SHIFT (Show Info)
              <div className="flex items-center gap-2 text-sm text-green-400 bg-green-900/20 p-3 rounded-2xl border border-green-900/50 ">
                <Briefcase size={16} />
                <span>
                  You are currently checked in at{" "}
                  <strong>{shift.workLocation}</strong>.
                </span>
              </div>
            ) : selectedLocation ? (
              // STATE 2: SELECTION MADE (Show Confirmation Preview)
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-sm text-indigo-300 bg-indigo-900/20 p-3 rounded-2xl border border-indigo-900/50">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-400" />
                    <span>
                      Selected: <strong>{selectedLocation}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    disabled={isProcessing}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-200 transition-colors"
                  >
                    <RotateCcw size={12} /> Change
                  </button>
                </div>
                <p className="text-xs text-zinc-500 px-1">
                  Review your location selection above before checking in.
                </p>
              </div>
            ) : (
              // STATE 1: NO SELECTION (Prompt User)
              <p className="text-zinc-400 text-sm text-center">
                Please select your work location to start your shift.
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full rounded-md bg-zinc-800" />
              <Skeleton className="h-12 w-full rounded-md bg-zinc-800" />
            </>
          ) : shift ? (
            // BUTTON: END SHIFT
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-semibold shadow-lg rounded-2xl"
              onClick={handleTriggerCheckOut}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" /> End Shift
                </>
              )}
            </Button>
          ) : selectedLocation ? (
            // BUTTON: CONFIRM SELECTION
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold shadow-lg shadow-green-900/20"
              onClick={handleTriggerCheckIn}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  Check In Now <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            // BUTTONS: SELECT LOCATION
            <div className="flex flex-row items-center justify-center gap-2">
              <Button
                onClick={() => setSelectedLocation("GHCL")}
                disabled={isProcessing}
                className="rounded-2xl"
              >
                <span className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> GHCL
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
              <Button
                onClick={() => setSelectedLocation("kajli")}
                disabled={isProcessing}
                className="rounded-2xl"
              >
                <span className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" /> Kajli
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>

      {/* --- CONFIRMATION MODAL --- */}
      <ConfirmationDialog
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        isLoading={isProcessing} // Keep modal valid while processing if desired
        title={
          modalConfig.type === "check-in" ? "Confirm Check In" : "End Shift"
        }
        description={
          modalConfig.type === "check-in"
            ? `Are you sure you want to mark your attendance at ${selectedLocation}? This will record your current time and location.`
            : "Are you sure you want to end your shift? This will mark your check-out time."
        }
        confirmText={
          modalConfig.type === "check-in" ? "Yes, Check In" : "Yes, End Shift"
        }
        variant={modalConfig.type === "check-in" ? "default" : "destructive"}
      />
    </>
  );
}
