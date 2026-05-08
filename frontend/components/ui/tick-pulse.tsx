"use client";

import { useEffect, useState } from "react";

export function TickPulse({ trigger, color = "#7dd3a8" }: { trigger: number; color?: string }) {
  const [key, setKey] = useState(0);
  useEffect(() => { setKey(k => k + 1); }, [trigger]);
  return (
    <span key={key} style={{
      display: "inline-block", width: 6, height: 6, borderRadius: "50%",
      background: color, boxShadow: `0 0 12px ${color}`,
      animation: "tickPulse 1.2s ease-out",
    }} />
  );
}
