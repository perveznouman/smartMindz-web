import type { Metadata } from "next";
import { Instagram, Youtube, MessageCircle, MapPin } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { getSiteContent } from "@/lib/data";
import { getContactLink } from "@/lib/notify/whatsapp";
import { isRegistrationOpen } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with SmartMindz — WhatsApp, Instagram and YouTube.",
};

export default async function ContactPage() {
  const content = await getSiteContent();
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
  ];

  return (
    <Section>
      <SectionHeader
        eyebrow="Contact"
        title="Let's connect"
        subtitle="Follow us, message us, or jump straight into your next event."
      />

      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.label}
            href={c.href}
            target="_blank"
            rel="noopener noreferrer"
            className="card flex flex-col items-center p-6 text-center transition-transform duration-300 hover:-translate-y-1"
          >
            <c.icon className={`h-8 w-8 ${c.accent}`} />
            <h3 className="mt-4 text-sm font-semibold">{c.label}</h3>
            <p className="mt-1 break-all text-sm text-content-muted">{c.value}</p>
          </a>
        ))}
      </div>

      <div className="mx-auto mt-6 flex max-w-3xl items-start gap-2 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-content-muted">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <span>{content.location}</span>
      </div>

      <div className="mx-auto mt-10 max-w-3xl text-center">
        <p className="text-lg font-medium font-display">
          Ready to step into the spotlight?
        </p>
        <div className="mt-4">
          <RegisterButton disabled={!regOpen} className="btn-primary px-7 py-3 text-base">
            {regOpen ? "Register for an event" : "Registrations closed"}
          </RegisterButton>
        </div>
      </div>
    </Section>
  );
}
