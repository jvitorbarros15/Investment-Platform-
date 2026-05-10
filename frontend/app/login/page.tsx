"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { getSupabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data, error } = await getSupabase().auth.signInWithPassword({
        email,
        password,
      });
      if (error || !data.session) throw error;
      setSession(data.session.access_token, data.user?.email ?? email);
      router.replace("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{ background: "#0c0b08" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendingUp size={22} style={{ color: "#c9f76f" }} />
            <span
              className="text-2xl font-bold tracking-widest uppercase"
              style={{ fontFamily: "var(--font-display)", color: "#c9f76f", letterSpacing: "0.2em" }}
            >
              MERIDIAN
            </span>
          </div>
          <p className="text-xs" style={{ color: "#8892a4", fontFamily: "JetBrains Mono, monospace" }}>
            investment platform
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8 border"
          style={{
            background: "#14130f",
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-6"
            style={{ fontFamily: "var(--font-display)", color: "#f5f1e8" }}
          >
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#8892a4", fontFamily: "JetBrains Mono" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8892a4" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-all"
                  style={{
                    background: "#1a1814",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f5f1e8",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,247,111,0.3)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#8892a4", fontFamily: "JetBrains Mono" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#8892a4" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-md text-sm outline-none transition-all"
                  style={{
                    background: "#1a1814",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#f5f1e8",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,247,111,0.3)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#8892a4" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs py-2 px-3 rounded-md" style={{ color: "#e07b6c", background: "rgba(224,123,108,0.08)", border: "1px solid rgba(224,123,108,0.2)", fontFamily: "JetBrains Mono" }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? "rgba(201,247,111,0.6)" : "#c9f76f",
                color: "#0c0b08",
                fontFamily: "var(--font-display)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#8892a4", fontFamily: "JetBrains Mono" }}>
          MERIDIAN · Investment Platform
        </p>
      </div>
    </div>
  );
}
