import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/CtaBand";
import { MapPin, Languages, Trophy } from "lucide-react";
import { getSiteContent } from "@/lib/data";

export const metadata: Metadata = {
  title: "About",
  description: "The story of SmartMindz — celebrating hidden talent across Vaniyambadi and beyond.",
};

export default async function AboutPage() {
  const content = await getSiteContent();

  return (
    <>
      <Section>
        <SectionHeader
          eyebrow="About SmartMindz"
          title={<>Where every talent <span className="gradient-text">shines</span></>}
          subtitle={content.mission}
        />

        <div className="mx-auto max-w-3xl space-y-5">
          {content.aboutStory.map((para, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className="text-base leading-relaxed text-content-muted sm:text-lg">{para}</p>
            </Reveal>
          ))}
        </div>

        {/* Quick facts */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <MapPin className="h-6 w-6 text-brand" />
            <h3 className="mt-3 text-sm font-semibold">Based in</h3>
            <p className="mt-1 text-sm text-content-muted">{content.location}</p>
          </div>
          <div className="card p-5">
            <Languages className="h-6 w-6 text-accent" />
            <h3 className="mt-3 text-sm font-semibold">Languages</h3>
            <p className="mt-1 text-sm text-content-muted">{content.languages.join(", ")}</p>
          </div>
          <div className="card p-5">
            <Trophy className="h-6 w-6 text-highlight" />
            <h3 className="mt-3 text-sm font-semibold">Rewards</h3>
            <p className="mt-1 text-sm text-content-muted">{content.rewards.join(", ")}</p>
          </div>
        </div>
      </Section>

      {/* Highlights */}
      <Section className="bg-surface/40 !pt-4">
        <SectionHeader eyebrow="What we stand for" title="What makes us different" />
        <div className="grid gap-6 sm:grid-cols-2">
          {content.aboutHighlights.map((h, i) => (
            <Reveal key={h.title} delay={i * 0.05}>
              <div className="card h-full p-6">
                <h3 className="text-lg font-semibold font-display">{h.title}</h3>
                <p className="mt-2 text-sm text-content-muted">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand />
    </>
  );
}
