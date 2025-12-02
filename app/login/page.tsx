"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/user.actions";
import { Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const result = await loginAction(email, password);

    if (!result.success) {
      setLoading(false);
      setError(result.error);
      return;
    }

    // console.log("Login successful");
    router.push("/attendance");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-sm p-8 rounded-2xl"
      >
        <h2 className="text-3xl font-bold text-center text-white">Login</h2>

        {error && (
          <p className="text-red-400 text-sm bg-red-900/30 p-2 rounded-md text-center">
            {error}
          </p>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full px-3 py-2 bg-black border border-white/60 text-white rounded-md focus:outline-none focus:border-blue-400"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-white">Password</label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              className="w-full px-3 py-2 bg-black border border-white/60 text-white rounded-md focus:outline-none focus:border-blue-400"
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 text-sm hover:text-white transition"
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white/90 font-semibold py-2 rounded-md disabled:opacity-50 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
