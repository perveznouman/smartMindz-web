"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type Direction = "up" | "down" | "left" | "right" | "zoom" | "fade";

const initialFor: Record<Direction, Record<string, number>> = {
  up: { opacity: 0, y: 28 },
  down: { opacity: 0, y: -28 },
  left: { opacity: 0, x: -36 },
  right: { opacity: 0, x: 36 },
  zoom: { opacity: 0, scale: 0.92 },
  fade: { opacity: 0 },
};

/**
 * Scroll-into-view reveal. Direction controls where the element animates in
 * from. Respects reduced-motion via CSS globally.
 */
export function Reveal({
  children,
  delay = 0,
  duration = 0.6,
  direction = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: Direction;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={initialFor[direction]}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
