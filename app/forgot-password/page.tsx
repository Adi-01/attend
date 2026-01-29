"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { sendPasswordRecovery } from "@/lib/actions/employee.actions";
import { Mail, ArrowLeft, Loader2, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await sendPasswordRecovery(email);

    if (!result.success) {
      toast.error(result.error ?? "Failed to send recovery email");
    } else {
      toast.success("Recovery email sent! Check your inbox.");
      // Optional: Redirect back to login after success
      setTimeout(() => router.push("/login"), 2000);
    }
    setLoading(false);
  }

  return (
    <div className="w-full max-w-md mx-auto mt-20 p-4">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.replace("/login")}
        className="flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors group"
      >
        <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Back to Login
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl"
      >
        <div className="p-8 pt-10">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-slate-400 px-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <Mail className="absolute left-3 top-4 size-5 text-slate-400 group-focus-within:text-indigo-400 transition-colors" />
              <Input
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className="pl-10 h-12 bg-black/20 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-black/40 rounded-xl transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Send Recovery Link <ArrowRight className="ml-2 size-4" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
