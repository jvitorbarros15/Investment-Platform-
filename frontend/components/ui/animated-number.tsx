"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: number;
  fmt?: (v: number) => string;
  duration?: number;
}

export function AnimatedNumber({ value, fmt = (v) => v.toFixed(0), duration = 1200 }: Props) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const targetRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    targetRef.current = value;
    startRef.current = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current!) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (targetRef.current - fromRef.current) * e);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span>{fmt(display)}</span>;
}
