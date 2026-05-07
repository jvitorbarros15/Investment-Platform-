"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Check, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { api, getAlerts, markAlertRead } from "@/lib/api";
import type { AlertEvent } from "@/lib/types";

function alertIcon(message: string) {
  if (message.includes("below") || message.includes("review") || message.includes("down")) return <AlertTriangle size={14} style={{ color: "#F43F5E" }} />;
  if (message.includes("return") || message.includes("exceptional")) return <TrendingUp size={14} style={{ color: "#10B981" }} />;
  return <Info size={14} style={{ color: "#C9963C" }} />;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ticker: "", alert_type: "PRICE_ABOVE", threshold: "" });

  const { data: alerts = [], isLoading } = useQuery<AlertEvent[]>({
    queryKey: ["alerts"],
    queryFn: getAlerts,
  });

  const markReadMutation = useMutation({
    mutationFn: markAlertRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = alerts.filter((a) => !a.is_read);
      await Promise.all(unread.map((a) => markAlertRead(a.id)));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { ticker: string; alert_type: string; threshold_value?: number }) => {
      const { data: res } = await api.post("/alerts/rules", data);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      setForm({ ticker: "", alert_type: "PRICE_ABOVE", threshold: "" });
      setShowCreate(false);
    },
  });

  const unread = alerts.filter((a) => !a.is_read).length;

  const handleCreate = () => {
    if (!form.ticker.trim()) return;
    createMutation.mutate({
      ticker: form.ticker.toUpperCase(),
      alert_type: form.alert_type,
      threshold_value: form.threshold ? parseFloat(form.threshold) : undefined,
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
            Alerts
            {unread > 0 && (
              <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.15)", color: "#F43F5E", fontFamily: "JetBrains Mono", verticalAlign: "middle" }}>
                {unread} new
              </span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>
            {isLoading ? "Loading..." : "Notification center for price and score alerts"}
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={() => markAllReadMutation.mutate()} className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
              style={{ background: "#111318", color: "#8892A4", border: "1px solid #1E2330", fontFamily: "DM Sans" }}>
              <Check size={12} /> Mark all as read
            </button>
          )}
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm"
            style={{ background: "rgba(201,150,60,0.12)", color: "#C9963C", border: "1px solid rgba(201,150,60,0.25)", fontFamily: "DM Sans" }}>
            <Plus size={14} /> Create Alert
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg p-5 border" style={{ background: "#111318", borderColor: "#C9963C40" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#C9963C", fontFamily: "Syne" }}>New Alert</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              placeholder="Ticker" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
            <select value={form.alert_type} onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "DM Sans" }}>
              <option value="PRICE_ABOVE">Price above</option>
              <option value="PRICE_BELOW">Price below</option>
              <option value="RETURN_ABOVE">Return above %</option>
              <option value="RETURN_BELOW">Return below %</option>
            </select>
            <input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })}
              placeholder="Threshold value" type="number" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} disabled={createMutation.isPending} className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "#C9963C", color: "#0B0D12", fontFamily: "DM Sans", opacity: createMutation.isPending ? 0.6 : 1 }}>
              {createMutation.isPending ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md text-sm"
              style={{ background: "#161A23", color: "#8892A4", fontFamily: "DM Sans" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="rounded-lg p-8 text-center text-xs border" style={{ background: "#111318", borderColor: "#1E2330", color: "#4A5568", fontFamily: "JetBrains Mono" }}>
            Loading...
          </div>
        ) : alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg p-4 border flex items-start gap-4 transition-all"
            style={{
              background: "#111318",
              borderColor: alert.is_read ? "#1E2330" : "rgba(201,150,60,0.2)",
              opacity: alert.is_read ? 0.7 : 1,
            }}
          >
            <div className="mt-0.5 flex-shrink-0">{alertIcon(alert.message)}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                {alert.ticker && (
                  <span className="text-xs font-bold" style={{ color: "#C9963C", fontFamily: "JetBrains Mono" }}>{alert.ticker}</span>
                )}
                {!alert.is_read && (
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#F43F5E" }} />
                )}
              </div>
              <p className="text-sm" style={{ color: "#F0F2F7" }}>{alert.message}</p>
              <p className="text-xs mt-1" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>
                {new Date(alert.triggered_at).toLocaleDateString("en-US")}
              </p>
            </div>
            {!alert.is_read && (
              <button onClick={() => markReadMutation.mutate(alert.id)} className="flex-shrink-0 p-1.5 rounded transition-colors"
                style={{ color: "#4A5568" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#10B981"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5568"; }}>
                <Check size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
