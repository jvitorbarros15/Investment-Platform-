import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  subtitleColor?: string;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function KpiCard({ label, value, subtitle, subtitleColor, trend, className }: KpiCardProps) {
  const trendColor = trend === "up" ? "#10B981" : trend === "down" ? "#F43F5E" : "#8892A4";

  return (
    <div
      className={cn(
        "rounded-lg p-5 flex flex-col gap-1 border transition-all duration-200 hover:border-[#C9963C]/30",
        className
      )}
      style={{ background: "#111318", borderColor: "#1E2330" }}
    >
      <span className="text-xs uppercase tracking-widest" style={{ color: "#4A5568", fontFamily: "JetBrains Mono, monospace" }}>
        {label}
      </span>
      <span
        className="text-2xl font-bold mt-1 leading-none"
        style={{ fontFamily: "JetBrains Mono, monospace", color: "#F0F2F7" }}
      >
        {value}
      </span>
      {subtitle && (
        <span className="text-sm mt-0.5 font-data" style={{ color: subtitleColor || trendColor, fontFamily: "JetBrains Mono, monospace" }}>
          {trend === "up" ? "▲ " : trend === "down" ? "▼ " : ""}
          {subtitle}
        </span>
      )}
    </div>
  );
}
