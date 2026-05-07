"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BookMarked,
  Brain,
  Bell,
  TrendingUp,
} from "lucide-react";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
  { href: "/watchlist", label: "Watchlist", icon: BookMarked },
  { href: "/philosophy", label: "Philosophy", icon: Brain },
  { href: "/alerts", label: "Alerts", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 h-full w-60 flex flex-col z-20"
      style={{ background: "#0D0F14", borderRight: "1px solid #1E2330" }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-2">
          <TrendingUp size={20} className="text-gold" style={{ color: "#C9963C" }} />
          <span
            className="text-xl font-bold tracking-widest uppercase"
            style={{ fontFamily: "Syne, sans-serif", color: "#C9963C", letterSpacing: "0.18em" }}
          >
            INVESTR
          </span>
        </div>
        <p className="mt-1 text-xs" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
          personal finance
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group"
              style={{
                color: active ? "#C9963C" : "#8892A4",
                background: active ? "rgba(201,150,60,0.08)" : "transparent",
                borderLeft: active ? "2px solid #C9963C" : "2px solid transparent",
                fontFamily: "DM Sans, sans-serif",
                fontWeight: active ? "500" : "400",
              }}
            >
              <Icon
                size={16}
                style={{ color: active ? "#C9963C" : "#4A5568", flexShrink: 0 }}
                className="group-hover:text-[#C9963C] transition-colors"
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div
        className="mx-3 mb-4 px-3 py-3 rounded-md"
        style={{ borderTop: "1px solid #1E2330", marginTop: "auto" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "rgba(201,150,60,0.2)", color: "#C9963C", fontFamily: "Syne" }}
          >
            J
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium truncate" style={{ color: "#F0F2F7" }}>Joao Vitor</p>
            <p className="text-xs truncate" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
              admin@invest.local
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
