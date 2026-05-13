"use client";

import { useAuthStore } from "@/lib/auth-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Masthead } from "./Masthead";
import { NavBar } from "./NavBar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const initialized = useAuthStore((s) => s.initialized);
  const router = useRouter();
  const pathname = usePathname();
  const isLogin = pathname.startsWith("/login");

  useEffect(() => {
    if (initialized && !token && !isLogin) {
      router.push("/login");
    }
  }, [initialized, isLogin, token, router]);

  if (isLogin) return <>{children}</>;

  if (!initialized || !token) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--color-paper)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--color-ink)", marginBottom: 12 }}>MERIDIAN</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-3)", letterSpacing: "0.16em", textTransform: "uppercase" }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Masthead />
      <NavBar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
}
