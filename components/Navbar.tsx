// @/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Building,
  ClipboardList,
  Users,
  UserCheck,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  // 1. Hide the navbar completely on the login route
  if (pathname === "/login") return null;

  // 2. Define the navigation links
  const navLinks = [
    { href: "/attendance", label: "Attendance", icon: CalendarDays },
    { href: "/nagaur", label: "Nagaur", icon: Building },
    { href: "/register", label: "Register", icon: ClipboardList },
    { href: "/users", label: "Users", icon: Users },
    { href: "/mark-attendance", label: "Mark Attendance", icon: UserCheck },
  ];

  return (
    // The wrapper is sticky and has pointer-events-none so you can click "through" the invisible sides
    <nav className="sticky top-6 z-50 flex justify-center w-full px-4 pointer-events-none mb-6">
      {/* The actual squircle container */}
      <div className="flex items-center p-1.5 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-full shadow-2xl pointer-events-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              title={link.label}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-all group ${
                isActive
                  ? "bg-neutral-800 text-white shadow-sm border border-neutral-700 cursor-default"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
              }`}
              // Prevent clicking the same link again if we're already on it
              onClick={(e) => isActive && e.preventDefault()}
            >
              <Icon
                className={`w-4 h-4 ${
                  isActive ? "" : "group-hover:scale-110 transition-transform"
                }`}
              />
              <span className="text-sm font-medium hidden md:block">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
