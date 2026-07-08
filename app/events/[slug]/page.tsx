import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin, ArrowLeft, Trophy, FileText, Download } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Gallery } from "@/components/Gallery";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { CtaBand } from "@/components/CtaBand";
import { getEventBySlug, getGallery, getResults, getSiteContent } from "@/lib/data";
import { formatEventDate, isRegistrationOpen } from "@/lib/utils";

// Re-fetch from Supabase at most every 60s so content edits go live without a redeploy.
export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event not found" };
  return {
    title: event.title,
    description: event.description,
    openGraph: { images: event.coverUrl ? [event.coverUrl] : [] },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [gallery, results, content] = await Promise.all([
    getGallery(event.id),
    getResults(event.id),
    getSiteContent(),
  ]);

  const isUpcoming = event.status === "upcoming";
  // Registration is one shared form for the site (not per-event), so it's
  // gated by the global site_content toggle, not this event's own columns.
  const regOpen = isUpcoming && isRegistrationOpen(content);
  const rules = results.filter((r) => r.kind === "rule");
  const resultItems = results.filter((r) => r.kind === "result");

  return (
    <>
      {/* Cover */}
      <div className="relative h-64 w-full overflow-hidden bg-surface-2 sm:h-80 lg:h-96">
        {event.coverUrl && (
          <Image src={event.coverUrl} alt={event.title} fill priority className="object-cover" sizes="100vw" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-8">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All events
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-white sm:text-5xl font-display">{event.title}</h1>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> {formatEventDate(event.eventDate)}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <Section className="!pt-12">
        <div className="mx-auto max-w-3xl">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${regOpen ? "bg-brand text-brand-fg" : isUpcoming ? "bg-yellow-600 text-white" : "bg-surface-2 text-content-muted"}`}>
            {regOpen ? "Registrations open" : isUpcoming ? "Registrations closed" : "Past event"}
          </span>
          <p className="mt-5 text-base leading-relaxed text-content-muted sm:text-lg">{event.description}</p>

          {isUpcoming && (
            <div className="mt-8">
              <RegisterButton eventId={event.id} disabled={!regOpen} className="btn-primary px-7 py-3 text-base">
                {regOpen ? `Register for ${event.title}` : "Registrations closed"}
              </RegisterButton>
            </div>
          )}
        </div>

        {/* Rules & guidelines — any number of attachments. */}
        {rules.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="flex items-center gap-2 text-2xl font-bold font-display">
              <FileText className="h-6 w-6 text-brand" /> Rules &amp; guidelines
            </h2>
            <div className="mt-6 space-y-4">
              {rules.map((r) => (
                <div key={r.id} className="card p-5">
                  <h3 className="font-semibold">{r.title}</h3>
                  {r.body && <p className="mt-1 text-sm text-content-muted">{r.body}</p>}
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-3 inline-flex items-center gap-1.5 text-sm">
                      <Download className="h-3.5 w-3.5" /> View / download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results — any number of attachments. */}
        {resultItems.length > 0 && (
          <div className="mx-auto mt-14 max-w-3xl">
            <h2 className="flex items-center gap-2 text-2xl font-bold font-display">
              <Trophy className="h-6 w-6 text-highlight" /> Results
            </h2>
            <div className="mt-6 space-y-4">
              {resultItems.map((r) => (
                <div key={r.id} className="card p-5">
                  <h3 className="font-semibold">{r.title}</h3>
                  {r.body && <p className="mt-1 text-sm text-content-muted">{r.body}</p>}
                  {r.fileUrl && (
                    <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-outline mt-3 inline-flex items-center gap-1.5 text-sm">
                      <Download className="h-3.5 w-3.5" /> View / download
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {gallery.length > 0 && (
        <Section className="bg-surface/40 !pt-4">
          <h2 className="mb-8 text-center text-2xl font-bold font-display">Photo gallery</h2>
          <Gallery photos={gallery} />
        </Section>
      )}

      {isUpcoming && <CtaBand title={`Be part of ${event.title}`} registrationOpen={regOpen} />}
    </>
  );
}
