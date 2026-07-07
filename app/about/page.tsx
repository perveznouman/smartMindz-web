import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { CtaBand } from "@/components/CtaBand";
import { MapPin, Languages, Trophy } from "lucide-react";
import { getSiteContent } from "@/lib/data";
import { isRegistrationOpen } from "@/lib/utils";

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

        <div className="mx-auto max-w-3xl space-y-6">
          {content.aboutStory.map((para, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <p className="text-base leading-relaxed text-content-muted sm:text-lg whitespace-pre-line">{para}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* What We Offer */}
      <Section className="!py-12">
        <SectionHeader eyebrow="Our commitment" title="What we offer" />
        <div className="mx-auto max-w-2xl">
          <ul className="space-y-3">
            {[
              "Engaging online and offline competitions",
              "Skill-building opportunities in Tamil, Hindi, Urdu, and English",
              "A welcoming platform for all age groups and backgrounds",
              "A space to learn, participate, express, and grow",
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.05}>
                <li className="flex gap-4">
                  <span className="text-brand text-xl font-bold">•</span>
                  <span className="text-base text-content-muted leading-relaxed">{item}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </div>
      </Section>

      {/* Quick facts */}
      <Section className="!py-12">
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          <Reveal direction="left">
            <div className="card card-lift h-full p-5">
              <MapPin className="h-6 w-6 text-brand" />
              <h3 className="mt-3 text-sm font-semibold">Based in</h3>
              <p className="mt-1 text-sm text-content-muted">{content.location}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="card card-lift h-full p-5">
              <Languages className="h-6 w-6 text-accent" />
              <h3 className="mt-3 text-sm font-semibold">Languages</h3>
              <p className="mt-1 text-sm text-content-muted">{content.languages.join(", ")}</p>
            </div>
          </Reveal>
          <Reveal direction="right" delay={0.2}>
            <div className="card card-lift h-full p-5">
              <Trophy className="h-6 w-6 text-highlight" />
              <h3 className="mt-3 text-sm font-semibold">Rewards</h3>
              <p className="mt-1 text-sm text-content-muted">{content.rewards.join(", ")}</p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Highlights */}
      <Section className="bg-surface/40">
        <SectionHeader eyebrow="What we stand for" title="What makes us different" />
        <div className="grid gap-6 sm:grid-cols-2">
          {content.aboutHighlights.map((h, i) => (
            <Reveal
              key={h.title}
              delay={(i % 2) * 0.1}
              direction={i % 2 === 0 ? "left" : "right"}
            >
              <div className="card card-lift h-full p-6">
                <h3 className="text-lg font-semibold font-display">{h.title}</h3>
                <p className="mt-2 text-sm text-content-muted">{h.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <CtaBand registrationOpen={isRegistrationOpen(content)} />
    </>
  );
}
