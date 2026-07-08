import type { Metadata } from "next";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { EventCard } from "@/components/EventCard";
import { Gallery } from "@/components/Gallery";
import { CtaBand } from "@/components/CtaBand";
import { getEvents, getGallery, getSiteContent } from "@/lib/data";
import { isRegistrationOpen } from "@/lib/utils";

// Re-fetch from Supabase at most every 60s so content edits go live without a redeploy.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming and past SmartMindz events, with photo galleries.",
};

export default async function EventsPage() {
  const [events, gallery, content] = await Promise.all([
    getEvents(),
    getGallery(),
    getSiteContent(),
  ]);
  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");
  const regOpen = isRegistrationOpen(content);

  return (
    <>
      <Section>
        <SectionHeader
          eyebrow="Epic Events"
          title="Events"
          subtitle="Thrilling online and offline competitions with guaranteed rewards."
        />

        {upcoming.length > 0 && (
          <>
            <h3 className="mb-6 text-xl font-semibold font-display">Upcoming</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <Reveal key={e.id}>
                  <EventCard event={e} registrationOpen={regOpen} />
                </Reveal>
              ))}
            </div>
          </>
        )}

        {past.length > 0 && (
          <>
            <h3 className="mb-6 mt-16 text-xl font-semibold font-display">Past events</h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <Reveal key={e.id}>
                  <EventCard event={e} registrationOpen={regOpen} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Section>

      {gallery.length > 0 && (
        <Section className="bg-surface/40">
          <SectionHeader
            eyebrow="Gallery"
            title="From our events"
            subtitle="A look back at the energy, the talent and the celebrations."
          />
          <Gallery photos={gallery} />
        </Section>
      )}

      <CtaBand registrationOpen={regOpen} />
    </>
  );
}
