"use client";

import { useAuthStore } from "@/lib/auth-store";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0c0b08" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontFamily: "var(--font-display)", color: "#f5f1e8", marginBottom: 16 }}>MERIDIAN</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(245,241,232,0.4)", animation: "fadeIn 1s" }}>Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Topbar />
        <main className="app-main">
          {children}
        </main>
      </div>
    </div>
  );
}
