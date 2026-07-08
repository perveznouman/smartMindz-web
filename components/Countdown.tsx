"use client";

import { useEffect, useState } from "react";

/**
 * Full-width countdown banner shown at the very top of the home page.
 *
 * Both the title and the target instant come from `site_content` (editable in
 * Supabase, no redeploy needed). The banner renders nothing when the target is
 * missing, unparseable, or already in the past — so leaving `countdownTarget`
 * blank simply hides it.
 *
 * The ticking value depends on the client clock, so we guard against SSR
 * hydration mismatches by only rendering after mount.
 */
type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function diff(targetMs: number): TimeLeft | null {
  const delta = targetMs - Date.now();
  if (delta <= 0) return null;
  const s = Math.floor(delta / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function Countdown({
  title,
  target,
}: {
  title: string | null;
  target: string | null;
}) {
  const targetMs = target ? new Date(target).getTime() : NaN;
  const valid = Number.isFinite(targetMs);

  const [left, setLeft] = useState<TimeLeft | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!valid) return;
    setMounted(true);
    setLeft(diff(targetMs));
    const id = setInterval(() => setLeft(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [valid, targetMs]);

  // Not configured, invalid, before mount, or already elapsed → render nothing.
  if (!valid || !mounted || !left) return null;

  const units: { value: number; label: string }[] = [
    { value: left.days, label: "Days" },
    { value: left.hours, label: "Hours" },
    { value: left.minutes, label: "Mins" },
    { value: left.seconds, label: "Secs" },
  ];

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgb(var(--c-brand)) 0%, rgb(var(--c-accent)) 100%)",
      }}
    >
      <div className="container-page flex flex-col items-center gap-4 py-4 text-white sm:flex-row sm:justify-center sm:gap-6">
        {title && (
          <p className="text-center text-sm font-semibold uppercase tracking-wider sm:text-base">
            {title}
          </p>
        )}
        <div className="flex items-center gap-3 sm:gap-4">
          {units.map((u) => (
            <div key={u.label} className="flex flex-col items-center">
              <span className="text-2xl font-bold tabular-nums leading-none sm:text-3xl font-display">
                {String(u.value).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">
                {u.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
