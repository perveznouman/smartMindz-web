"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

/**
 * Counts a stat up from 0 when it scrolls into view. Accepts values like
 * "1000+", "4", "2X" — the numeric prefix animates, the suffix is kept as-is.
 * Non-numeric values render unchanged.
 */
export function CountUp({
  value,
  duration = 1.6,
}: {
  value: string;
  duration?: number;
}) {
  const match = value.trim().match(/^(\d+)(.*)$/);
  const target = match ? parseInt(match[1], 10) : null;
  const suffix = match ? match[2] : "";

  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || target === null) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, duration]);

  if (target === null) return <span>{value}</span>;

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}
