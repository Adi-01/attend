"use client";
import dynamic from "next/dynamic";
import { useState } from "react";

// This tells Next.js to only load the map on the client side
const LiveMap = dynamic(() => import("@/components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="h-48 w-full bg-neutral-800 rounded-xl flex items-center justify-center border border-neutral-700">
      <Loader2 className="w-6 h-6 text-neutral-500 animate-spin" />
    </div>
  ),
});

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
import { WORK_LOCATIONS, WorkLocation } from "@/constants/location";
import { useLiveLocation } from "@/hooks/useLiveLocation";
import {
  SITE_COORDINATES,
  getDistanceInMeters,
  MAX_ALLOWED_DISTANCE_METERS,
} from "@/lib/geofence";

interface Props {
  username: string;
  shift: any;
  isLoading: boolean;
  isProcessing: boolean;
  onCheckIn: (loc: WorkLocation, lat: number, lng: number) => void;
  onCheckOut: (lat: number, lng: number) => void;
}

export default function AttendanceStatusCard({
  username,
  shift,
  isLoading,
  isProcessing,
  onCheckIn,
  onCheckOut,
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(
    null,
  );

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "check-in" | "check-out";
  }>({ isOpen: false, type: "check-in" });

  // --- GET LIVE LOCATION ---
  const { isLocating, locationError, userCoords } = useLiveLocation();

  // --- DYNAMIC DISTANCE CALCULATION ---
  let distance: number | null = null;
  let isWithinGeofence = false;

  const targetLocation = shift
    ? (shift.workLocation as WorkLocation)
    : selectedLocation;

  // 1. Get the dynamic radius for the currently selected location (fallback to 200 if undefined)
  const currentMaxDistance = targetLocation
    ? MAX_ALLOWED_DISTANCE_METERS[targetLocation] || 200
    : 200;

  if (targetLocation && userCoords) {
    const site = SITE_COORDINATES[targetLocation];
    if (site) {
      distance = Math.round(
        getDistanceInMeters(userCoords.lat, userCoords.lng, site.lat, site.lng),
      );
      // 2. Use the dynamic radius instead of the global constant
      isWithinGeofence = distance <= currentMaxDistance;
    }
  }

  // --- DISTANCE FORMATTER ---
  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters} m`;
    const km = Math.floor(meters / 1000);
    const remainingMeters = meters % 1000;
    return remainingMeters === 0 ? `${km} km` : `${km} km ${remainingMeters} m`;
  };

  // --- HANDLERS ---
  const handleTriggerCheckIn = () => {
    if (selectedLocation && isWithinGeofence) {
      setModalConfig({ isOpen: true, type: "check-in" });
    }
  };

  const handleTriggerCheckOut = () => {
    if (shift && isWithinGeofence) {
      setModalConfig({ isOpen: true, type: "check-out" });
    }
  };

  const handleConfirmAction = () => {
    if (modalConfig.type === "check-in" && selectedLocation) {
      onCheckIn(selectedLocation, userCoords!.lat, userCoords!.lng);
    } else if (modalConfig.type === "check-out") {
      onCheckOut(userCoords!.lat, userCoords!.lng);
    }
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // --- HELPER: REUSABLE GEOFENCE MESSAGING ---
  const renderGeofenceMessage = () => {
    const actionText = shift ? "check out" : "check in";
    const siteCoords = targetLocation ? SITE_COORDINATES[targetLocation] : null;

    return (
      <div className="mt-4 space-y-8">
        {userCoords && siteCoords && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <LiveMap
              userLat={userCoords.lat}
              userLng={userCoords.lng}
              siteLat={siteCoords.lat}
              siteLng={siteCoords.lng}
              // 3. Pass the specific radius to the Map so the circle draws at the correct size
              radius={currentMaxDistance}
            />
          </div>
        )}

        {locationError && (
          <p className="text-xs text-red-400 px-1 text-center font-medium">
            {locationError}
          </p>
        )}
        {isLocating && !userCoords && (
          <p className="text-xs text-zinc-400 px-1 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" /> Acquiring GPS signal...
          </p>
        )}
        {distance !== null && !isWithinGeofence && (
          <p className="text-xs text-yellow-500 px-1 text-center font-medium bg-yellow-950/30 p-2 rounded-lg border border-yellow-900/50">
            You are {formatDistance(distance)} away. Please move within{" "}
            {/* 4. Update text to reflect the dynamic radius */}
            {formatDistance(currentMaxDistance)} to {actionText}.
          </p>
        )}
        {distance !== null && isWithinGeofence && (
          <p className="text-xs text-green-400 px-1 text-center font-medium">
            Location verified ({formatDistance(distance)} away). Ready to{" "}
            {actionText}?
          </p>
        )}
      </div>
    );
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
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-3 text-sm text-green-400 bg-green-900/20 p-3.5 rounded-2xl border border-green-900/50">
                  <Briefcase size={18} className="shrink-0" />
                  <span className="leading-relaxed">
                    Have a great shift! You are currently checked in at{" "}
                    <strong className="text-green-300">
                      {shift.workLocation}
                    </strong>
                    .
                  </span>
                </div>
                {renderGeofenceMessage()}
              </div>
            ) : selectedLocation ? (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between text-sm text-indigo-300 bg-indigo-900/20 p-3 rounded-2xl border border-indigo-900/50">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-indigo-400" />
                    <span>
                      Selected:{" "}
                      <strong className="text-indigo-200">
                        {selectedLocation.charAt(0).toUpperCase() +
                          selectedLocation.slice(1)}
                      </strong>
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    disabled={isProcessing}
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-200 transition-colors bg-indigo-900/40 px-2 py-1 rounded-md"
                  >
                    <RotateCcw size={12} /> Change
                  </button>
                </div>
                {renderGeofenceMessage()}
              </div>
            ) : (
              <p className="text-zinc-400 text-sm text-center font-medium">
                Where are you working today? Select a location below.
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
            <Button
              variant="destructive"
              className="w-full h-12 text-base font-semibold shadow-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTriggerCheckOut}
              disabled={
                isProcessing ||
                isLocating ||
                !!locationError ||
                !isWithinGeofence
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" /> Check Out
                </>
              )}
            </Button>
          ) : selectedLocation ? (
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleTriggerCheckIn}
              disabled={
                isProcessing ||
                isLocating ||
                !!locationError ||
                !isWithinGeofence
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  Processing...
                </>
              ) : (
                <>
                  Check In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-row items-center justify-center gap-2">
              {WORK_LOCATIONS.map((location) => (
                <Button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  disabled={isProcessing}
                  className="rounded-2xl group"
                >
                  <span className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4" />
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              ))}
            </div>
          )}
        </CardFooter>
      </Card>

      <ConfirmationDialog
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        isLoading={isProcessing}
        title={modalConfig.type === "check-in" ? "Start Shift" : "End Shift"}
        description={
          modalConfig.type === "check-in"
            ? `You are about to check in at ${selectedLocation ? selectedLocation.charAt(0).toUpperCase() + selectedLocation.slice(1) : ""}. Your exact time and coordinates will be recorded.`
            : "Ready to wrap up for the day? This will check you out and finalize your shift."
        }
        confirmText={
          modalConfig.type === "check-in" ? "Yes, Check In" : "Yes, Check Out"
        }
        variant={modalConfig.type === "check-in" ? "default" : "destructive"}
      />
    </>
  );
}
