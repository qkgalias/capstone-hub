"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result?.error || "Login failed.");
      setLoading(false);
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.access_token,
      refresh_token: result.refresh_token
    });

    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }

    setMessage("Signed in. Redirecting...");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-16 overflow-hidden">
      <div className="card-node login-card backdrop-blur px-3 py-4 min-h-[200px] sm:px-12 sm:py-12 sm:min-h-[520px] bg-[#0b132b]/80 shadow-[0_20px_60px_rgba(2,6,23,0.6)]">
        <h1 className="text-2xl sm:text-5xl font-semibold tracking-[0.04em] text-gray-100 text-center">
          Capstone Hub
        </h1>
        <p className="text-xs sm:text-lg text-gray-400 mt-2 sm:mt-4 text-center">
          Sign in to access Orvion space.
        </p>
        <form
          className="mt-4 sm:mt-12 grid gap-3 sm:gap-8"
          onSubmit={(event) => {
            event.preventDefault();
            handleLogin();
          }}
        >
          <label className="grid gap-2 sm:gap-3 text-[11px] sm:text-base tracking-[0.04em] text-gray-400 font-light max-w-[420px] mx-auto w-full">
            Username
            <input
              className="w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 sm:py-4 text-sm sm:text-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-white/30"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 sm:gap-3 text-[11px] sm:text-base tracking-[0.04em] text-gray-400 font-light max-w-[420px] mx-auto w-full">
            Password
            <input
              className="w-full rounded-md border border-white/10 bg-slate-800 px-3 py-2 sm:py-4 text-sm sm:text-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-white/30"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <div className="pt-2 sm:pt-4 flex justify-center">
            <button
              type="submit"
              className="rounded-md border border-white/10 bg-white/10 px-4 sm:px-8 py-1 sm:py-2 text-[11px] sm:text-base tracking-[0.04em] text-white hover:bg-white/15 active:scale-[0.99] transition"
              disabled={loading}
            >
              {loading ? "Pogi ni Galias ->" : "Login"}
            </button>
          </div>
        </form>
        {message && (
          <p className="text-sm text-gray-300 mt-6 tracking-[0.04em]">
            {message}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-300 mt-2 tracking-[0.04em]">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
