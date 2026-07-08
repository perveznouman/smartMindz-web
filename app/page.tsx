import Link from "next/link";
import {
  ArrowRight,
  Award,
  Globe,
  Users,
  Sparkles,
  Instagram,
  Youtube,
  MessageCircle,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { EventCard } from "@/components/EventCard";
import { TeamGrid } from "@/components/TeamGrid";
import { Gallery } from "@/components/Gallery";
import { CtaBand } from "@/components/CtaBand";
import { Countdown } from "@/components/Countdown";
import { getEvents, getGallery, getSiteContent, getTeam } from "@/lib/data";
import { getContactLink } from "@/lib/notify/whatsapp";
import { isRegistrationOpen } from "@/lib/utils";

const features = [
  { icon: Users, title: "All ages welcome", body: "School kids, college students, professionals and homemakers." },
  { icon: Globe, title: "Multilingual", body: "Tamil, Hindi, Urdu and English — everyone has a stage." },
  { icon: Award, title: "Guaranteed rewards", body: "Certificates, trophies and grand felicitations." },
  { icon: Sparkles, title: "Online & offline", body: "Thrilling, energy-packed events twice a year." },
];

// Re-fetch from Supabase at most every 60s so content edits (team, events,
// gallery, site copy) go live without a redeploy.
export const revalidate = 60;

export default async function HomePage() {
  const [content, events, team, gallery] = await Promise.all([
    getSiteContent(),
    getEvents(),
    getTeam(),
    getGallery(),
  ]);

  const upcoming = events.filter((e) => e.status === "upcoming");
  const past = events.filter((e) => e.status === "past");
  const regOpen = isRegistrationOpen(content);

  const channels = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: content.whatsappContact,
      href: getContactLink(content, "Hi SmartMindz! I'd like to know more."),
      accent: "text-success",
    },
    {
      icon: Instagram,
      label: content.instagram.label,
      value: content.instagram.handle ?? content.instagram.href,
      href: content.instagram.href,
      accent: "text-brand",
    },
    {
      icon: Youtube,
      label: content.youtube.label,
      value: content.youtube.handle ?? content.youtube.href,
      href: content.youtube.href,
      accent: "text-danger",
    },
    ...(content.secondaryPhone
      ? [
          {
            icon: Phone,
            label: "Phone",
            value: content.secondaryPhone,
            href: `tel:${content.secondaryPhone}`,
            accent: "text-content",
          },
        ]
      : []),
    ...(content.secondaryEmail
      ? [
          {
            icon: Mail,
            label: "Email",
            value: content.secondaryEmail,
            href: `mailto:${content.secondaryEmail}`,
            accent: "text-content",
          },
        ]
      : []),
  ];

  return (
    <>
      <Countdown title={content.countdownTitle} target={content.countdownTarget} />
      <Hero content={content} />

      {/* Feature strip */}
      <Section className="!py-12">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08} direction="zoom">
              <div className="card card-lift h-full p-5">
                <f.icon className="h-7 w-7 text-brand" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-content-muted">{f.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Mission — doubles as the About anchor for the navbar. */}
      <Section id="about" className="!pt-4">
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

      {/* Upcoming events — anchored so the navbar can scroll here. */}
      <Section id="events" className="bg-surface/40">
        <SectionHeader
          eyebrow="Epic Events"
          title="Upcoming events"
          subtitle="Register now and step into the spotlight. Limited spots, guaranteed rewards."
        />
        {upcoming.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event, i) => (
              <Reveal key={event.id} delay={i * 0.08}>
                <EventCard event={event} registrationOpen={regOpen} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="text-center text-content-muted">
            New events are announced soon — follow us on Instagram for updates.
          </p>
        )}

        {past.length > 0 && (
          <>
            <h3 className="mb-6 mt-16 text-xl font-semibold font-display">
              Past events
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event, i) => (
                <Reveal key={event.id} delay={i * 0.08}>
                  <EventCard event={event} registrationOpen={regOpen} />
                </Reveal>
              ))}
            </div>
          </>
        )}
      </Section>

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

      {/* Team */}
      <Section id="team" className="bg-surface/40">
        <SectionHeader
          eyebrow="The Team"
          title="The people behind SmartMindz"
          subtitle="A small team with a big mission for the talent of Vaniyambadi."
        />
        <TeamGrid members={team} />
      </Section>

      {/* Contact */}
      <Section id="contact">
        <SectionHeader
          eyebrow="Contact"
          title="Let's connect"
          subtitle="Follow us, message us, or jump straight into your next event."
        />
        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
          {channels.map((c, i) => (
            <Reveal key={c.label} delay={i * 0.08}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-lift flex h-full flex-col items-center p-6 text-center"
              >
                <c.icon className={`h-8 w-8 ${c.accent}`} />
                <h3 className="mt-4 text-sm font-semibold">{c.label}</h3>
                <p className="mt-1 break-all text-sm text-content-muted">{c.value}</p>
              </a>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <div className="mx-auto mt-6 flex max-w-3xl items-start gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-content-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{content.location}</span>
          </div>
        </Reveal>
      </Section>

      <CtaBand registrationOpen={regOpen} />
    </>
  );
}
