"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  useEffect(() => {
    if (!token && !window.location.pathname.startsWith("/login")) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
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
    <div style={{ display: "flex", minHeight: "100vh", background: "#0c0b08" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Topbar />
        <main style={{ flex: 1, padding: "32px", maxWidth: 1440, width: "100%" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
