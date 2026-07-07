import Link from "next/link";
import Image from "next/image";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { RegisterButton } from "@/components/registration/RegisterButton";
import { formatEventDate } from "@/lib/utils";
import type { EventItem } from "@/lib/types";

export function EventCard({
  event,
  registrationOpen = true,
}: {
  event: EventItem;
  registrationOpen?: boolean;
}) {
  const isUpcoming = event.status === "upcoming";

  return (
    <article className="card group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <Link href={`/events/${event.slug}`} className="relative block aspect-[16/10] overflow-hidden bg-surface-2">
        {event.coverUrl && (
          <Image
            src={event.coverUrl}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
            isUpcoming
              ? "bg-brand text-brand-fg"
              : "bg-surface/90 text-content-muted backdrop-blur"
          }`}
        >
          {isUpcoming ? "Upcoming" : "Past event"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold font-display">
          <Link href={`/events/${event.slug}`} className="hover:text-brand">
            {event.title}
          </Link>
        </h3>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-content-muted">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> {formatEventDate(event.eventDate)}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {event.location}
            </span>
          )}
        </div>

        <p className="mt-3 line-clamp-3 flex-1 text-sm text-content-muted">
          {event.description}
        </p>

        <div className="mt-5 flex items-center gap-3">
          {isUpcoming ? (
            <RegisterButton
              eventId={event.id}
              disabled={!registrationOpen}
              className="btn-primary text-sm"
            >
              {registrationOpen ? "Register" : "Closed"}
            </RegisterButton>
          ) : null}
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-content-muted hover:text-content"
          >
            Details <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
