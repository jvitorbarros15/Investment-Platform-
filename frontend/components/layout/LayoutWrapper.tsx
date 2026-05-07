"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "@/lib/auth-store";
import { LogOut } from "lucide-react";

function LogoutButton() {
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <button
      onClick={handleLogout}
      className="p-1.5 rounded transition-colors"
      title="Sign out"
      style={{ color: "#4A5568" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F43F5E"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5568"; }}
    >
      <LogOut size={13} />
    </button>
  );
}

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!token && !isLoginPage) router.replace("/login");
    if (token && isLoginPage) router.replace("/");
  }, [token, isLoginPage, router]);

  if (!token && !isLoginPage) return null;

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar logoutSlot={<LogoutButton />} />
      <main className="flex-1 ml-60 min-h-screen overflow-y-auto relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </>
  );
}
