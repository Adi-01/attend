"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completePasswordRecovery } from "@/lib/actions/employee.actions";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Appwrite sends these in the URL
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId || !secret) {
      setError("Invalid or missing recovery tokens.");
    }
  }, [userId, secret]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!userId || !secret) {
      setError("Invalid recovery link.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    const result = await completePasswordRecovery(
      userId,
      secret,
      password,
      confirmPassword,
    );

    if (!result.success) {
      toast.error(result.error || "Failed to reset password");
      setError("Failed to reset password. The link may have expired.");
      setLoading(false);
    } else {
      toast.success("Password reset successfully!");
      setTimeout(() => router.push("/login"), 2000);
    }
  }

  // --- ERROR STATE UI ---
  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-3xl max-w-sm w-full bg-card border border-destructive/50 shadow-2xl"
        >
          <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
            <Lock size={24} />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold text-foreground mb-2">
              Invalid Link
            </h2>
            <p className="text-muted-foreground text-sm mb-6">{error}</p>
            <Button
              variant="secondary"
              onClick={() => router.push("/forgot-password")}
              className="w-full"
            >
              Request new link
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- NORMAL STATE UI ---
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <div className="p-8 pt-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Reset Password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a strong new password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password */}
            <div className="relative group">
              <Lock className="absolute left-3 top-3 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                required
                minLength={8}
                className="pl-10 pr-10 h-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-primary rounded-xl transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors outline-none"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative group">
              <Lock className="absolute left-3 top-3 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Confirm Password"
                required
                minLength={8}
                className="pl-10 h-12 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-primary rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Reset Password <ArrowRight className="ml-2 size-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
