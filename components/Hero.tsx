import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { Reveal } from "@/components/ui/Reveal";
import type { SiteContent } from "@/lib/types";

export function Hero({ content }: { content: SiteContent }) {
  return (
    <section className="relative overflow-hidden">
      {/* Soft gradient backdrop driven entirely by theme tokens. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 15% 0%, rgb(var(--c-brand) / 0.16), transparent 70%)," +
            "radial-gradient(50% 50% at 90% 10%, rgb(var(--c-accent) / 0.16), transparent 70%)," +
            "radial-gradient(60% 60% at 50% 100%, rgb(var(--c-highlight) / 0.10), transparent 70%)",
        }}
      />

      <div className="container-page py-20 sm:py-28 lg:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="eyebrow">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              {content.languages.join(" · ")}
            </span>
          </Reveal>

          <Reveal delay={0.05}>
            <h1 className="heading-xl mt-6">
              <span className="gradient-text">{content.heroTitle}</span>
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="body-lg mx-auto mt-8 max-w-2xl text-content-muted">
              {content.heroSubtitle}
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <RegisterButton className="btn-primary w-full px-8 py-3 text-sm sm:w-auto">
                Register for an event
                <ArrowRight className="h-4 w-4" />
              </RegisterButton>
              <Link href="/events" className="btn-outline w-full px-8 py-3 text-sm sm:w-auto">
                Explore events
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.2}>
            <dl className="mx-auto mt-20 grid max-w-2xl grid-cols-2 gap-8 sm:grid-cols-4">
              {content.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <dt className="heading-md text-brand">
                    {stat.value}
                  </dt>
                  <dd className="mt-2 text-xs font-semibold uppercase tracking-wider text-content-muted">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
