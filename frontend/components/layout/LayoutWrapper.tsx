"use client";

import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const pathname = typeof window !== "undefined" ? window.location.pathname : "";

  useEffect(() => {
    if (!token && !window.location.pathname.startsWith("/login")) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) return <>{children}</>;

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
