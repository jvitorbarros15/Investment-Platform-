"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getAlerts, markAlertRead } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import type { AlertEvent } from "@/lib/types";

const SEV_STRIPE: Record<string, string> = {
  positive: "var(--color-teal)",
  negative: "var(--color-crimson)",
  warning: "var(--color-ochre)",
  info: "var(--color-ink-3)",
};

function getSeverity(a: AlertEvent): string {
  if (a.message.includes("below") || a.message.includes("down")) return "negative";
  if (a.message.includes("return") || a.message.includes("exceptional") || a.message.includes("above")) return "positive";
  if (a.message.includes("warning") || a.message.includes("above your tolerance") || a.message.includes("concentration")) return "warning";
  return "info";
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [filterUnread, setFilterUnread] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const unread = alerts.filter((a: AlertEvent) => !a.is_read);
  const filtered = filterUnread ? unread : alerts;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* HEADER */}
      <Reveal>
        <div style={{ paddingBottom: 20, borderBottom: "1px solid var(--color-ink)", marginBottom: 24 }}>
          <div className="kicker" style={{ marginBottom: 8 }}>Alerts center · {unread.length} unread</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(30px, 4vw, 48px)", lineHeight: 0.9, color: "var(--color-ink)", margin: 0, letterSpacing: "-0.03em" }}>
            What needs your attention
          </h1>
        </div>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--color-ink)" }}>
          {[{ value: false, label: "All" }, { value: true, label: "Unread" }].map((f) => (
            <button key={f.label} onClick={() => setFilterUnread(f.value)} style={{
              padding: "10px 16px", border: "none", borderRight: "1px solid var(--color-rule-2)",
              background: filterUnread === f.value ? "var(--color-ink)" : "transparent",
              color: filterUnread === f.value ? "var(--color-paper)" : "var(--color-ink-3)",
              fontSize: 13, fontWeight: filterUnread === f.value ? 700 : 500, cursor: "pointer",
              fontFamily: "var(--font-mono)",
            }}>
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* ALERT FEED */}
      <Reveal delay={100}>
        <div style={{ border: "1px solid var(--color-ink)", marginBottom: 24 }}>
          {isLoading ? (
            <div style={{ color: "var(--color-ink-3)", textAlign: "center", padding: 40, fontFamily: "var(--font-mono)" }}>Loading alerts...</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "var(--color-ink-3)", textAlign: "center", padding: 40, fontFamily: "var(--font-mono)" }}>No alerts</div>
          ) : (
            filtered.map((a: AlertEvent, i: number) => {
              const sev = getSeverity(a);
              const stripe = SEV_STRIPE[sev] ?? "var(--color-ink-3)";
              return (
                <div key={a.id} style={{
                  display: "flex", borderBottom: i < filtered.length - 1 ? "1px solid var(--color-rule-2)" : "none",
                  opacity: a.is_read ? 0.6 : 1,
                }}>
                  <div style={{ width: 4, flexShrink: 0, background: stripe }} />
                  <div style={{ flex: 1, padding: "16px 20px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                        <span style={{
                          padding: "2px 8px", background: stripe, color: "var(--color-paper)",
                          fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.12em", textTransform: "uppercase",
                        }}>
                          {sev}
                        </span>
                        {a.ticker && (
                          <span style={{ fontSize: 12, color: "var(--color-ink-2)", fontFamily: "var(--font-mono)", fontWeight: 700 }}>{a.ticker}</span>
                        )}
                        {!a.is_read && (
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--color-crimson)", flexShrink: 0, display: "inline-block" }} />
                        )}
                      </div>
                      <div style={{ color: "var(--color-ink)", fontSize: 13, marginBottom: 6 }}>{a.message}</div>
                      <div style={{ color: "var(--color-ink-4)", fontSize: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                        {new Date(a.triggered_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    {!a.is_read && (
                      <button onClick={() => markReadMutation.mutate(a.id)} style={{
                        padding: "6px 12px", border: "1px solid var(--color-rule)", borderRadius: 0,
                        background: "transparent", color: "var(--color-ink-3)",
                        fontSize: 11, cursor: "pointer", fontFamily: "var(--font-mono)", whiteSpace: "nowrap",
                      }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-ink-3)"; }}>
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Reveal>

      {/* ACTIVE RULES */}
      <Reveal delay={200}>
        <div style={{ border: "1px solid var(--color-ink)", padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="kicker" style={{ marginBottom: 4 }}>Active rules</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--color-ink)", fontSize: 20, margin: 0 }}>7 rules running</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 0, border: "1px solid var(--color-ink)" }}>
            {[
              { ticker: "GOOGL", cond: "Price below $175", active: true },
              { ticker: "B3SA3", cond: "Price below R$11", active: true },
              { ticker: "NVDA", cond: "Score below 75", active: true },
              { ticker: "PORTFOLIO", cond: "Single name > 18%", active: true },
              { ticker: "BTC", cond: "30d vol > 4%", active: false },
              { ticker: "ITUB4", cond: "Div yield > 7%", active: true },
              { ticker: "PETR4", cond: "Price above R$38", active: true },
            ].map((r, i) => (
              <div key={i} style={{
                padding: "14px 16px", borderRight: "1px solid var(--color-ink)", borderBottom: "1px solid var(--color-ink)",
                opacity: r.active ? 1 : 0.4,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>{r.ticker}</div>
                    <div style={{ color: "var(--color-ink-3)", fontSize: 11, marginTop: 4 }}>{r.cond}</div>
                  </div>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.active ? "var(--color-teal)" : "var(--color-ink-4)", display: "block", marginTop: 2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
