import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

/** A vertically-padded page section with generous spacing (120px, Bugatti-inspired). */
export function Section({
  id,
  children,
  className = "",
  containerClassName = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn("py-section", className)}>
      <div className={cn("container-page", containerClassName)}>{children}</div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <Reveal
      className={cn(
        "mb-16 max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
    >
      {eyebrow && <span className="eyebrow mb-6">{eyebrow}</span>}
      <h2 className="heading-lg mt-6">{title}</h2>
      {subtitle && (
        <p className="body-lg mt-6 text-content-muted">{subtitle}</p>
      )}
    </Reveal>
  );
}
