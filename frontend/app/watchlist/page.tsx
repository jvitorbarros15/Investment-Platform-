"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { MOCK_WATCHLIST } from "@/lib/mock-data";
import { watchlistStatusColor, watchlistStatusLabel } from "@/lib/formatters";
import type { WatchlistItem } from "@/lib/types";

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>(MOCK_WATCHLIST);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ ticker: "", target_price: "", status: "STUDYING", reason: "", notes: "" });

  const handleAdd = () => {
    if (!form.ticker.trim()) return;
    const newItem: WatchlistItem = {
      id: Date.now().toString(),
      ticker: form.ticker.toUpperCase(),
      target_price: form.target_price ? parseFloat(form.target_price) : undefined,
      status: form.status as WatchlistItem["status"],
      reason: form.reason || undefined,
      notes: form.notes || undefined,
      created_at: new Date().toISOString().slice(0, 10),
    };
    setItems([newItem, ...items]);
    setForm({ ticker: "", target_price: "", status: "STUDYING", reason: "", notes: "" });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif", color: "#F0F2F7" }}>Watchlist</h1>
          <p className="text-sm mt-0.5" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
            {items.length} assets being monitored
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-all"
          style={{ background: "rgba(201,150,60,0.12)", color: "#C9963C", border: "1px solid rgba(201,150,60,0.25)", fontFamily: "DM Sans" }}
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="rounded-lg p-5 border" style={{ background: "#111318", borderColor: "#C9963C40" }}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: "#C9963C", fontFamily: "Syne" }}>New Asset</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value })}
              placeholder="Ticker (e.g., VALE3)" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
            <input value={form.target_price} onChange={(e) => setForm({ ...form, target_price: e.target.value })}
              placeholder="Target Price" type="number" className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "JetBrains Mono" }} />
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="px-3 py-2 rounded-md text-sm outline-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7", fontFamily: "DM Sans" }}>
              <option value="STUDYING">Studying</option>
              <option value="WAITING_PRICE">Waiting Price</option>
              <option value="STRONG_CANDIDATE">Strong Candidate</option>
              <option value="AVOID">Avoid</option>
            </select>
            <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Reason" className="px-3 py-2 rounded-md text-sm outline-none col-span-3"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7" }} />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Personal notes..." rows={2}
              className="px-3 py-2 rounded-md text-sm outline-none col-span-3 resize-none"
              style={{ background: "#161A23", border: "1px solid #1E2330", color: "#F0F2F7" }} />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ background: "#C9963C", color: "#0B0D12", fontFamily: "DM Sans" }}>Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-md text-sm"
              style={{ background: "#161A23", color: "#8892A4", fontFamily: "DM Sans" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border overflow-hidden" style={{ background: "#111318", borderColor: "#1E2330" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid #1E2330", background: "#0D0F14" }}>
              {["Ticker", "Status", "Target Price", "Reason", "Notes", ""].map((h, i) => (
                <th key={i} className="px-5 py-3 text-xs uppercase tracking-widest text-left"
                  style={{ color: "#4A5568", fontFamily: "JetBrains Mono" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: i < items.length - 1 ? "1px solid #161A23" : "none" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#161A23"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                <td className="px-5 py-3.5">
                  <span className="text-sm font-bold" style={{ color: "#C9963C", fontFamily: "JetBrains Mono" }}>{item.ticker}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`text-xs px-2.5 py-1 rounded-full border ${watchlistStatusColor(item.status)}`}
                    style={{ fontFamily: "JetBrains Mono" }}>
                    {watchlistStatusLabel(item.status)}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-sm" style={{ color: item.target_price ? "#F0F2F7" : "#4A5568", fontFamily: "JetBrains Mono" }}>
                    {item.target_price ? `R$ ${item.target_price.toFixed(2)}` : "—"}
                  </span>
                </td>
                <td className="px-5 py-3.5 max-w-[200px]">
                  <span className="text-sm truncate block" style={{ color: "#8892A4" }}>{item.reason || "—"}</span>
                </td>
                <td className="px-5 py-3.5 max-w-[200px]">
                  <span className="text-xs truncate block" style={{ color: "#4A5568" }}>{item.notes || "—"}</span>
                </td>
                <td className="px-5 py-3.5">
                  <button onClick={() => setItems(items.filter((x) => x.id !== item.id))}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: "#4A5568" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F43F5E"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#4A5568"; }}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
