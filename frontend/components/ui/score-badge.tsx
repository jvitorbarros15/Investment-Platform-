interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, size = "md" }: Props) {
  const color =
    score >= 90 ? "#c9f76f" :
    score >= 75 ? "#7dd3a8" :
    score >= 60 ? "#f0c674" :
    score >= 40 ? "#e89b7c" : "#e07b6c";

  const s = size === "sm" ? { px: 8, py: 2, fs: 10, dot: 5 }
           : size === "lg" ? { px: 12, py: 6, fs: 14, dot: 8 }
           : { px: 10, py: 4, fs: 11, dot: 6 };

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: `${s.py}px ${s.px}px`, borderRadius: 999,
      border: `1px solid ${color}40`, background: `${color}10`,
      color, fontSize: s.fs, fontFamily: "var(--font-mono)",
    }}>
      <span style={{
        width: s.dot, height: s.dot, borderRadius: "50%",
        background: color, boxShadow: `0 0 8px ${color}`,
        display: "inline-block",
      }} />
      {score}
    </span>
  );
}
