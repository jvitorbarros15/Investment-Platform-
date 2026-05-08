"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, getAlerts, markAlertRead } from "@/lib/api";
import { Reveal } from "@/components/ui/reveal";
import type { AlertEvent } from "@/lib/types";

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

  const PANEL = {
    background: "#14130f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
    padding: 24,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* HEADER */}
      <Reveal>
        <div>
          <div style={{ marginBottom: 8, color: "#8892a4", fontSize: 12, fontWeight: 500, letterSpacing: "0.05em" }}>
            Alerts center · {unread.length} unread
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1.2, letterSpacing: "-0.02em", color: "#f5f1e8", margin: 0 }}>
            What needs your attention
          </h1>
        </div>
      </Reveal>

      {/* FILTER TABS */}
      <Reveal delay={50}>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { value: false, label: "All" },
            { value: true, label: "Unread" },
          ].map((f) => (
            <button
              key={f.label}
              onClick={() => setFilterUnread(f.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: filterUnread === f.value ? "1px solid rgba(201, 247, 111, 0.3)" : "1px solid rgba(255,255,255,0.1)",
                background: filterUnread === f.value ? "rgba(201, 247, 111, 0.1)" : "rgba(0,0,0,0.2)",
                color: filterUnread === f.value ? "#c9f76f" : "#8892a4",
                fontSize: 13,
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </Reveal>

      {/* ALERT FEED */}
      <Reveal delay={100}>
        <div style={PANEL}>
          {isLoading ? (
            <div style={{ color: "#8892a4", textAlign: "center", padding: 40 }}>
              Loading alerts...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ color: "#8892a4", textAlign: "center", padding: 40 }}>
              No alerts
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {filtered.map((a: AlertEvent, i: number) => {
                const sevColor = a.message.includes("below") || a.message.includes("down")
                  ? "#e07b6c"
                  : a.message.includes("return") || a.message.includes("exceptional")
                  ? "#7dd3a8"
                  : a.message.includes("warning")
                  ? "#f0c674"
                  : "#9ec5fe";

                return (
                  <Reveal key={a.id} delay={i * 40}>
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: a.is_read ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.3)",
                        border: `1px solid ${a.is_read ? "rgba(255,255,255,0.04)" : sevColor + "30"}`,
                        opacity: a.is_read ? 0.6 : 1,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          background: sevColor + "14",
                          color: sevColor,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 14,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        {a.message.includes("price") ? "$" : "★"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: sevColor + "14",
                              color: sevColor,
                              border: `1px solid ${sevColor}30`,
                              fontSize: 10,
                              fontWeight: 600,
                              fontFamily: "JetBrains Mono, monospace",
                            }}
                          >
                            {a.message.includes("below") ? "NEGATIVE" : a.message.includes("return") ? "POSITIVE" : "INFO"}
                          </span>
                          {a.ticker && (
                            <span style={{ fontSize: 11, color: "#8892a4", fontFamily: "JetBrains Mono, monospace" }}>
                              {a.ticker}
                            </span>
                          )}
                          {!a.is_read && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#e07b6c",
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                        <div style={{ color: "#f5f1e8", fontSize: 13, marginBottom: 4 }}>
                          {a.message}
                        </div>
                        <div style={{ color: "#8892a4", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}>
                          {new Date(a.triggered_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      {!a.is_read && (
                        <button
                          onClick={() => markReadMutation.mutate(a.id)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: 6,
                            border: "1px solid rgba(255,255,255,0.1)",
                            background: "transparent",
                            color: "#8892a4",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: "pointer",
                            fontFamily: "JetBrains Mono, monospace",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#c9f76f";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.color = "#8892a4";
                          }}
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* ACTIVE RULES */}
      <Reveal delay={200}>
        <div style={PANEL}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ color: "#8892a4", fontSize: 11, fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>
              Active rules
            </div>
            <h3 style={{ color: "#f5f1e8", fontSize: 20, fontWeight: 600, margin: 0 }}>
              7 rules running
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 12,
            }}
          >
            {[
              { ticker: "GOOGL", cond: "Price below $175", active: true, kind: "price" },
              { ticker: "B3SA3", cond: "Price below R$11", active: true, kind: "price" },
              { ticker: "NVDA", cond: "Score below 75", active: true, kind: "score" },
              { ticker: "PORTFOLIO", cond: "Single name > 18%", active: true, kind: "risk" },
              { ticker: "BTC", cond: "30d vol > 4%", active: false, kind: "risk" },
              { ticker: "ITUB4", cond: "Div yield > 7%", active: true, kind: "div" },
              { ticker: "PETR4", cond: "Price above R$38", active: true, kind: "price" },
            ].map((r, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: `1px solid ${r.active ? "rgba(201,247,111,0.2)" : "rgba(255,255,255,0.07)"}`,
                  background: r.active ? "rgba(201,247,111,0.05)" : "rgba(0,0,0,0.2)",
                  opacity: r.active ? 1 : 0.5,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ color: "#f5f1e8", fontSize: 13, fontWeight: 600, fontFamily: "JetBrains Mono, monospace" }}>
                      {r.ticker}
                    </div>
                    <div style={{ color: "#8892a4", fontSize: 11, marginTop: 4 }}>
                      {r.cond}
                    </div>
                  </div>
                  <span
                    style={{
                      width: 20,
                      height: 12,
                      borderRadius: 6,
                      background: r.active ? "#c9f76f" : "rgba(255,255,255,0.1)",
                      display: "block",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}
