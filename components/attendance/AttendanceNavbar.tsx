"use client";

import { motion } from "framer-motion";
import { Logo } from "./logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { CalendarDays, MapPin, Shield } from "lucide-react";

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
                >
                  <CalendarDays className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </nav>
  );
};
