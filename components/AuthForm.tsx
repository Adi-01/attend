"use client";

import { useState } from "react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInAction } from "@/lib/actions/employee.actions";

export default function AuthForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await signInAction(formData);

      if (!result?.success) {
        toast.error(result?.error ?? "Login failed");
        setLoading(false);
        return;
      }

      toast.success("Welcome back!");

      if (result.success) {
        router.push("/");
      }
    } catch (error) {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative overflow-hidden rounded-3xl border frosted-glass"
      >
        <div className="p-8">
          <div className="mb-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-white"
            >
              Welcome Back
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mt-2 text-sm text-slate-300"
            >
              Enter your details to access your workspace.
            </motion.p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            <div className="relative group">
              <Mail className="absolute left-3 top-3 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                name="email"
                type="email"
                placeholder="Email Address"
                className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-300 focus:border-blue-500/50 focus:bg-white/10 transition-all rounded-xl"
                required
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-3 size-5 text-slate-300 group-focus-within:text-primary transition-colors" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-slate-300 focus:border-blue-500/50 focus:bg-white/10 transition-all rounded-xl"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                onMouseDown={(e) => e.preventDefault()}
                className="absolute right-3 top-3 text-slate-200 hover:text-white transition-colors cursor-pointer outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-white/20 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Sign In
                  <ArrowRight className="ml-2 size-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
