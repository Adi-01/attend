"use client";

import { motion } from "framer-motion";
import { Logo } from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { CalendarDays, MapPin, Shield, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/employee.actions"; // Import the action

type Props = {
  role: string;
};

export const AuthNavbar = ({ role }: Props) => {
  const pathname = usePathname();
  const isAdmin = role === "admin";

  return (
    <nav className="fixed top-0 inset-x-0 z-50 flex justify-center px-4 pt-6">
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-full max-w-5xl"
      >
        <div className="relative flex items-center justify-between px-6 py-3 frosted-glass rounded-full border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
          <Logo />

          <div className="flex items-center gap-2">
            {/* Admin-only */}
            {isAdmin && pathname !== "/attendance" && (
              <Link href="/attendance">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  title="Admin Dashboard"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {pathname !== "/mark-attendance" && (
              <Link href="/mark-attendance">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  title="Mark Attendance"
                >
                  <MapPin className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {pathname !== "/my-attendance" && (
              <Link href="/my-attendance">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  title="My History"
                >
                  <CalendarDays className="h-5 w-5" />
                </Button>
              </Link>
            )}

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-white/10 mx-1" />

            {/* Logout Button */}
            <form action={logoutAction}>
              <Button
                size="icon"
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                title="Sign Out"
                type="submit"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </motion.div>
    </nav>
  );
};
