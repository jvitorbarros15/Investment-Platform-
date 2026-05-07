"use client";

import { useState } from "react";
import { Bell, Plus, Check, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { MOCK_ALERTS } from "@/lib/mock-data";
import type { AlertEvent } from "@/lib/types";

function alertIcon(message: string) {
  if (message.includes("queda") || message.includes("revisar")) return <AlertTriangle size={14} className="text-loss" style={{ color: "#F43F5E" }} />;
  if (message.includes("retorno") || message.includes("excepcional")) return <TrendingUp size={14} className="text-gain" style={{ color: "#10B981" }} />;
  return <Info size={14} style={{ color: "#C9963C" }} />;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>(MOCK_ALERTS);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ticker: "", alert_type: "PRICE_ABOVE", threshold: "" });

  const unread = alerts.filter((a) => !a.is_read).length;

  const markRead = (id: string) => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, is_read: true } : a)));
  };

  const markAllRead = () => {
    setAlerts(alerts.map((a) => ({ ...a, is_read: true })));
  };

  const handleCreate = () => {
    if (!form.ticker.trim()) return;
    const msg = `Alerta criado para ${form.ticker.toUpperCase()} — ${form.alert_type.replace("_", " ")} ${form.threshold}`;
    setAlerts([{ id: Date.now().toString(), ticker: form.ticker.toUpperCase(), message: msg, triggered_at: new Date().toISOString(), is_read: false }, ...alerts]);
    setForm({ ticker: "", alert_type: "PRICE_ABOVE", threshold: "" });
    setShowCreate(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>
            Alertas
            {unread > 0 && (
              <span className="ml-3 text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.15)", color: "#F43F5E", fontFamily: "JetBrains Mono", verticalAlign: "middle" }}>
                {unread} novos
              </span>
            )}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>
            Central de notificações e alertas de preço/score
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-2 px-3 py-2 rounded-md text-xs"
              style={{ background: "#111318", color: "#8892A4", border: "1px solid #1E2330", fontFamily: "DM Sans" }}>
              <Check size={12} /> Marcar todos lidos
            </button>
          )}
          <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-md text-sm"
            style={{ background: "rgba(201,150,60,0.12)", color: "#C9963C", border: "1px solid rgba(201,150,60,0.25)", fontFamily: "DM Sans" }}>
            <Plus size={14} /> Criar alerta
          </button>
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="rounded-lg p-5 border" style={{ background: "#111318", borderColor: "#C9963C40" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#C9963C", fontFamily: "Syne" }}>Novo alerta</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              placeholder="Ticker" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
            <select value={form.alert_type} onChange={(e) => setForm({ ...form, alert_type: e.target.value })}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "DM Sans" }}>
              <option value="PRICE_ABOVE">Preço acima de</option>
              <option value="PRICE_BELOW">Preço abaixo de</option>
              <option value="RETURN_ABOVE">Retorno acima de %</option>
              <option value="RETURN_BELOW">Retorno abaixo de %</option>
            </select>
            <input value={form.threshold} onChange={(e) => setForm({ ...form, threshold: e.target.value })}
              placeholder="Valor limite" type="number" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleCreate} className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "#C9963C", color: "#0B0D12", fontFamily: "DM Sans" }}>Criar</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-md text-sm"
              style={{ background: "#161A23", color: "#8892A4", fontFamily: "DM Sans" }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="rounded-lg p-4 border flex items-start gap-4 transition-all"
            style={{
              background: alert.is_read ? "#111318" : "#111318",
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
                {new Date(alert.triggered_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            {!alert.is_read && (
              <button onClick={() => markRead(alert.id)} className="flex-shrink-0 p-1.5 rounded transition-colors"
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
