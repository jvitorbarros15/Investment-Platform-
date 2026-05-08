"use client";

import { useEffect, useId, useMemo, useRef } from "react";

interface Props {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  fill?: boolean;
}

export function Sparkline({ data, width = 80, height = 26, color = "#7dd3a8", strokeWidth = 1.5, fill = true }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const gradId = `sg-${useId().replace(/:/g, "")}`;

  const { d, area } = useMemo(() => {
    if (!data || data.length < 2) return { d: "", area: "" };
    const min = Math.min(...data), max = Math.max(...data);
    const range = max - min || 1;
    const dx = width / (data.length - 1);
    let d = "";
    data.forEach((v, i) => {
      const x = i * dx;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      d += (i === 0 ? "M" : "L") + x.toFixed(2) + "," + y.toFixed(2) + " ";
    });
    return { d, area: d + `L${width},${height} L0,${height} Z` };
  }, [data, width, height]);

  useEffect(() => {
    const el = pathRef.current;
    if (!el || !d) return;
    const len = el.getTotalLength();
    el.style.strokeDasharray = String(len);
    el.style.strokeDashoffset = String(len);
    requestAnimationFrame(() => {
      el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.2,.7,.2,1)";
      el.style.strokeDashoffset = "0";
    });
  }, [d]);

  return (
    <svg width={width} height={height} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <path ref={pathRef} d={d} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
