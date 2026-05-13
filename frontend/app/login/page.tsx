"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
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
      const { data, error } = await getSupabase().auth.signInWithPassword({ email, password });
      if (error || !data.session) throw error;
      setSession(data.session.access_token, data.user?.email ?? email);
      router.replace("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, border: "1px solid var(--color-ink)",
    background: "var(--color-paper-2)", color: "var(--color-ink)",
    padding: "0 12px", fontFamily: "var(--font-mono)", fontSize: 13,
    outline: "none", boxSizing: "border-box", borderRadius: 0,
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 16px", background: "var(--color-paper)" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 40 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "var(--color-ink)", color: "var(--color-paper)",
            display: "grid", placeItems: "center",
            fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, letterSpacing: "-0.04em",
            position: "relative", marginBottom: 16,
          }}>
            M
            <span style={{ position: "absolute", inset: 5, borderRadius: "50%", border: "1px dashed var(--color-paper)", opacity: 0.4 }} />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 36, lineHeight: 0.9, letterSpacing: "-0.04em", color: "var(--color-ink)" }}>
            MERIDIAN
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-ink-3)", marginTop: 8 }}>
            Personal Capital
          </div>
        </div>

        {/* Card */}
        <div style={{ border: "1px solid var(--color-ink)", padding: 32, background: "var(--color-paper)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--color-ink)", margin: "0 0 24px", letterSpacing: "-0.02em" }}>
            Sign in
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Email</div>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"
                style={inputStyle}
                onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-terracotta)"; }}
                onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ink)"; }}
              />
            </div>

            <div>
              <div className="kicker" style={{ marginBottom: 8 }}>Password</div>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                  style={{ ...inputStyle, paddingRight: 40 }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-terracotta)"; }}
                  onBlur={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-ink)"; }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "var(--color-ink-4)", cursor: "pointer",
                }}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ color: "var(--color-crimson)", fontSize: 12, fontFamily: "var(--font-mono)", padding: "8px 12px", border: "1px solid var(--color-crimson)" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              height: 42, border: "1px solid var(--color-terracotta-2)", borderRadius: 0,
              background: loading ? "rgba(204,82,48,0.6)" : "var(--color-terracotta)",
              color: "var(--color-paper)", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13,
              cursor: loading ? "not-allowed" : "pointer", marginTop: 8,
            }}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-ink-4)" }}>
          MERIDIAN · Investment Platform
        </div>
      </div>
    </div>
  );
}
