import Link from "next/link";
import Image from "next/image";
import { Instagram, Youtube, MessageCircle, MapPin } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { getContactLink } from "@/lib/notify/whatsapp";

export function Footer({ content }: { content: SiteContent }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5">
            {content.logoUrl && (
              <Image
                src={content.logoUrl}
                alt={`${content.orgName} logo`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg object-cover"
              />
            )}
            <span className="text-lg font-bold font-display">
              Smart<span className="text-brand">Mindz</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-content-muted">
            {content.tagline}. Celebrating hidden talent across all ages and
            backgrounds.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm text-content-muted">
            <li><Link href="/about" className="hover:text-content">About</Link></li>
            <li><Link href="/events" className="hover:text-content">Events</Link></li>
            <li><Link href="/team" className="hover:text-content">Team</Link></li>
            <li><Link href="/contact" className="hover:text-content">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Connect</h3>
          <ul className="mt-4 space-y-3 text-sm text-content-muted">
            <li>
              <a href={content.instagram.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-content">
                <Instagram className="h-4 w-4" /> {content.instagram.handle}
              </a>
            </li>
            <li>
              <a href={content.youtube.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-content">
                <Youtube className="h-4 w-4" /> {content.youtube.handle}
              </a>
            </li>
            <li>
              <a href={getContactLink(content)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-content">
                <MessageCircle className="h-4 w-4" /> {content.whatsappContact}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Location</h3>
          <p className="mt-4 inline-flex items-start gap-2 text-sm text-content-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {content.location}
          </p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs text-content-muted sm:flex-row">
          <p>© {year} {content.orgName}. All rights reserved.</p>
          <p>Made with ❤️ for the talent of Vaniyambadi.</p>
        </div>
      </div>
    </footer>
  );
}
