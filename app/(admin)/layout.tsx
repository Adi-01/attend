// @/components/BaseLayout.tsx (or wherever your layout is)
"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Navbar from "@/components/Navbar"; // <-- Import your new Navbar

const queryClient = new QueryClient();

export default function BaseLayout({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 1. Global Navbar injected here */}
      <Navbar />

      {/* 2. Page Content */}
      <main className="w-full">{children}</main>
    </QueryClientProvider>
  );
}
