"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const [email, setEmail] = useState("admin@invest.local");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { access_token } = await login(email, password);
      setToken(access_token);
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
      style={{ background: "#0B0D12" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-2.5 mb-2">
            <TrendingUp size={22} style={{ color: "#C9963C" }} />
            <span
              className="text-2xl font-bold tracking-widest uppercase"
              style={{ fontFamily: "Syne, sans-serif", color: "#C9963C", letterSpacing: "0.2em" }}
            >
              INVESTR
            </span>
          </div>
          <p className="text-xs" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
            personal finance dashboard
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8 border"
          style={{ background: "#111318", borderColor: "#1E2330" }}
        >
          <h2
            className="text-lg font-semibold mb-6"
            style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}
          >
            Sign in
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4A5568" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-all"
                  style={{
                    background: "#161A23",
                    border: "1px solid #1E2330",
                    color: "#F0F2F7",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,150,60,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2330")}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs uppercase tracking-widest mb-2" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#4A5568" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full pl-9 pr-10 py-2.5 rounded-md text-sm outline-none transition-all"
                  style={{
                    background: "#161A23",
                    border: "1px solid #1E2330",
                    color: "#F0F2F7",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,150,60,0.5)")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#1E2330")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#4A5568" }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs py-2 px-3 rounded-md" style={{ color: "#F43F5E", background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)", fontFamily: "JetBrains Mono" }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-semibold transition-all mt-2"
              style={{
                background: loading ? "#7A5A22" : "#C9963C",
                color: "#0B0D12",
                fontFamily: "DM Sans, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: "#1E2330", fontFamily: "JetBrains Mono" }}>
          INVESTR · Personal Finance
        </p>
      </div>
    </div>
  );
}
