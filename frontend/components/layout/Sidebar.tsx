"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useCurrencyStore } from "@/lib/currency-store";

const NAV = [
  { href: "/",            label: "Dashboard",  icon: "M3 13h6V3H3v10zm0 8h6v-6H3v6zm8 0h10v-10H11v10zm0-18v6h10V3H11z" },
  { href: "/portfolio",   label: "Holdings",   icon: "M3 5h18v2H3V5zm2 4h14v12H5V9zm3 3v6h2v-6H8zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2z" },
  { href: "/watchlist",   label: "Watchlist",  icon: "M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" },
  { href: "/philosophy",  label: "Philosophy", icon: "M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.2L19.5 8 12 11.8 4.5 8 12 4.2zM4 9.6l7 3.5v7.6l-7-3.5V9.6zm9 11.1V13.1l7-3.5v7.6l-7 3.5z" },
  { href: "/alerts",      label: "Alerts",     icon: "M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm6.4-6V11c0-3.1-1.6-5.7-4.5-6.4V4a1.9 1.9 0 0 0-3.8 0v.6C7.2 5.3 5.6 7.9 5.6 11v5l-2.2 2.2v.8h17.2v-.8L18.4 16z" },
];

const DISPLAYED_EMAIL = "admin@invest.local";

export function Sidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);
  const currency = useCurrencyStore((s) => s.currency);
  const avatarInitials = DISPLAYED_EMAIL.slice(0, 2).toUpperCase();

  return (
    <aside className="app-sidebar" style={{
      width: 232, flexShrink: 0, height: "100vh", position: "sticky", top: 0,
      background: "#0c0b08", borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex", flexDirection: "column", padding: "24px 16px",
      zIndex: 40,
    }}>
      {/* Brand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, paddingLeft: 8 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#c9f76f" strokeWidth="1.5" />
          <path d="M12 2v20M2 12h20" stroke="#c9f76f" strokeWidth="1.5" strokeDasharray="2 2" />
          <circle cx="12" cy="12" r="3" fill="#c9f76f" />
        </svg>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "#f5f1e8", letterSpacing: "-0.01em" }}>MERIDIAN</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,241,232,0.4)", marginTop: 1 }}>Personal Capital</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="app-sidebar-nav" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(item => {
          const active = item.href === "/" ? pathname === "/" : (item.href !== "/" && pathname.startsWith(item.href + "/")) || pathname === item.href;
          return (
            <Link key={item.href} href={item.href} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 12px", borderRadius: 8,
              color: active ? "#c9f76f" : "rgba(245,241,232,0.6)",
              background: active ? "rgba(201,247,111,0.08)" : "transparent",
              fontSize: 14, fontWeight: 500, textDecoration: "none",
              position: "relative", transition: "all 0.15s",
            }}>
              {active && (
                <span style={{
                  position: "absolute", left: -16, top: "50%", transform: "translateY(-50%)",
                  width: 3, height: 18, background: "#c9f76f", borderRadius: "0 2px 2px 0",
                }} />
              )}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="app-sidebar-footer" style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ padding: "12px 14px", borderRadius: 10, background: "#14130f", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(245,241,232,0.5)", marginBottom: 4 }}>Philosophy</div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#f5f1e8" }}>Dividends + Quality</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(245,241,232,0.4)", marginTop: 2 }}>8 weights · 100 / 100</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #c9f76f, #7dd3a8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "#0c0b08",
          }}>
            {avatarInitials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#f5f1e8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {DISPLAYED_EMAIL}
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "rgba(245,241,232,0.4)" }}>BASE · {currency}</div>
          </div>
          <button onClick={logout} style={{ fontSize: 11, color: "rgba(245,241,232,0.3)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            ⎋
          </button>
        </div>
      </div>
    </aside>
  );
}
