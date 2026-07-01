import Link from "next/link";
import { ArrowRight, Award, Globe, Users, Sparkles } from "lucide-react";
import { Hero } from "@/components/Hero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { EventCard } from "@/components/EventCard";
import { TeamGrid } from "@/components/TeamGrid";
import { Gallery } from "@/components/Gallery";
import { CtaBand } from "@/components/CtaBand";
import { getEvents, getGallery, getSiteContent, getTeam } from "@/lib/data";

const features = [
  { icon: Users, title: "All ages welcome", body: "School kids, college students, professionals and homemakers." },
  { icon: Globe, title: "Multilingual", body: "Tamil, Hindi, Urdu and English — everyone has a stage." },
  { icon: Award, title: "Guaranteed rewards", body: "Certificates, trophies and grand felicitations." },
  { icon: Sparkles, title: "Online & offline", body: "Thrilling, energy-packed events twice a year." },
];

export default async function HomePage() {
  const [content, events, team, gallery] = await Promise.all([
    getSiteContent(),
    getEvents(),
    getTeam(),
    getGallery(),
  ]);

  const upcoming = events.filter((e) => e.status === "upcoming").slice(0, 3);

  return (
    <>
      <Hero content={content} />

      {/* Feature strip */}
      <Section className="!py-12">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.05}>
              <div className="card h-full p-5">
                <f.icon className="h-7 w-7 text-brand" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-content-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Mission */}
      <Section className="!pt-4">
        <div className="card mx-auto max-w-3xl p-8 text-center sm:p-12">
          <span className="eyebrow">Our mission</span>
          <p className="mt-5 text-xl font-medium leading-relaxed sm:text-2xl font-display">
            {content.mission}
          </p>
          <Link href="/about" className="btn-ghost mt-6 inline-flex">
            Read our story <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* Upcoming events */}
      {upcoming.length > 0 && (
        <Section className="bg-surface/40">
          <SectionHeader
            eyebrow="Epic Events"
            title="Upcoming events"
            subtitle="Register now and step into the spotlight. Limited spots, guaranteed rewards."
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <Reveal key={event.id}>
                <EventCard event={event} />
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/events" className="btn-outline">
              View all events <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      )}

      {/* Gallery preview */}
      {gallery.length > 0 && (
        <Section>
          <SectionHeader
            eyebrow="Gallery"
            title="Moments that made us proud"
            subtitle="Glimpses from our energy-packed events."
          />
          <Gallery photos={gallery.slice(0, 8)} />
          <div className="mt-10 text-center">
            <Link href="/events" className="btn-outline">
              See more photos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Section>
      )}

      {/* Team preview */}
      <Section className="bg-surface/40">
        <SectionHeader
          eyebrow="The Team"
          title="The people behind SmartMindz"
          subtitle="A small team with a big mission for the talent of Vaniyambadi."
        />
        <TeamGrid members={team} />
      </Section>

      <CtaBand />
    </>
  );
}
