"use client";

interface Bar { label: string; value: number; color?: string; }

export function BarList({ data, max = 100, valFmt = (v: number) => v.toFixed(1) + "%" }: { data: Bar[]; max?: number; valFmt?: (v: number) => string; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {data.map((item, i) => (
        <div key={item.label}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 13, color: "rgba(245,241,232,0.7)" }}>{item.label}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "rgba(245,241,232,0.5)" }}>{valFmt(item.value)}</span>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: 3,
              background: item.color ?? "#c9f76f",
              width: `${(item.value / max) * 100}%`,
              transition: "width 0.8s cubic-bezier(.2,.7,.2,1)",
              transitionDelay: `${i * 60}ms`,
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}
