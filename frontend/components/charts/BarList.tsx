"use client";

interface Bar { label: string; value: number; color?: string; }

export function BarList({ data, max = 100, valFmt = (v: number) => v.toFixed(1) + "%" }: { data: Bar[]; max?: number; valFmt?: (v: number) => string; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {data.map((item, i) => (
        <div key={item.label} style={{ display: "grid", gridTemplateColumns: "90px 1fr auto", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "var(--color-ink-2)" }}>{item.label}</span>
          <div style={{ height: 14, background: "var(--color-paper-3)", border: "1px solid var(--color-ink)", overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute", left: 0, top: 0, bottom: 0,
              background: item.color ?? "var(--color-terracotta)",
              width: `${(item.value / max) * 100}%`,
              transition: `width 1.2s cubic-bezier(.2,.7,.2,1)`,
              transitionDelay: `${i * 60}ms`,
            }} />
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-ink-2)" }}>{valFmt(item.value)}</span>
        </div>
      ))}
    </div>
  );
}
