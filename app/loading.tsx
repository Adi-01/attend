"use client";

import { Salad } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 h-screen w-full bg-black text-white">
      {/* Spinner */}
      <div className="w-24 h-24 border-4 border-black border-t-primary rounded-full animate-spin"></div>

      {/* Logo + Name */}
      <div className="flex flex-row items-center gap-2">
        <span className="text-3xl font-bold">Loading...</span>
      </div>
    </div>
  );
}
