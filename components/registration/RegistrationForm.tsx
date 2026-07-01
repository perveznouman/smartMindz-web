"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, MessageCircle, PartyPopper } from "lucide-react";
import {
  registrationSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration";
import type { Category, SiteContent } from "@/lib/types";

type EventOption = { id: string; title: string; categoryIds: string[] };

type SuccessState = {
  eventTitle: string;
  joinLink: string;
  contact: string;
};

export function RegistrationForm({
  categories,
  content,
  presetEventId,
  onClose,
}: {
  categories: Category[];
  content: SiteContent;
  presetEventId?: string;
  onClose?: () => void;
}) {
  const [allEvents, setAllEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      fullName: "",
      categoryId: "",
      institution: "",
      whatsapp: "",
      eventId: "",
      city: "",
    },
  });

  const selectedCategory = watch("categoryId");
  const selectedEvent = watch("eventId");

  // Fetch the (dynamic) event list from the datasource once.
  useEffect(() => {
    let active = true;
    fetch("/api/events")
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setAllEvents(data.events ?? []);
      })
      .catch(() => active && setAllEvents([]))
      .finally(() => active && setEventsLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Events available for the chosen category — this is the dependent dropdown.
  const filteredEvents = useMemo(
    () =>
      selectedCategory
        ? allEvents.filter((e) => e.categoryIds.includes(selectedCategory))
        : [],
    [allEvents, selectedCategory],
  );

  // If launched from a specific event, preselect its category + the event.
  useEffect(() => {
    if (!presetEventId || allEvents.length === 0) return;
    const evt = allEvents.find((e) => e.id === presetEventId);
    if (evt) {
      setValue("categoryId", evt.categoryIds[0] ?? "");
      setValue("eventId", evt.id);
    }
  }, [presetEventId, allEvents, setValue]);

  // Clear the event if it no longer belongs to the newly chosen category.
  useEffect(() => {
    if (selectedEvent && !filteredEvents.some((e) => e.id === selectedEvent)) {
      setValue("eventId", "");
    }
  }, [filteredEvents, selectedEvent, setValue]);

  async function onSubmit(values: RegistrationFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess({
        eventTitle: data.eventTitle,
        joinLink: data.joinLink,
        contact: data.contact,
      });
    } catch {
      setServerError("Network error. Please check your connection and retry.");
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <PartyPopper className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold font-display">You&apos;re registered! 🎉</h3>
        <p className="mt-2 text-sm text-content-muted">
          Thanks for registering for <strong className="text-content">{success.eventTitle}</strong>.
          Join our WhatsApp group below for updates, schedule and event details.
        </p>

        <a
          href={success.joinLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-6 w-full px-6 py-3 text-base"
        >
          <MessageCircle className="h-5 w-5" />
          Join the WhatsApp group
        </a>

        <p className="mt-4 text-xs text-content-muted">
          Questions? Message us on WhatsApp at{" "}
          <span className="font-medium text-content">{success.contact}</span>.
        </p>

        {onClose && (
          <button type="button" onClick={onClose} className="btn-ghost mt-3 w-full">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-display">Register for an event</h3>
        <p className="mt-1 text-sm text-content-muted">
          Pick your category, choose an event and you&apos;re in. It takes a minute.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fullName" className="label-field">Full name</label>
          <input id="fullName" type="text" autoComplete="name" className="input-field" placeholder="Your full name" {...register("fullName")} />
          {errors.fullName && <p className="mt-1 text-xs text-danger">{errors.fullName.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="categoryId" className="label-field">Age / Category</label>
            <select id="categoryId" className="input-field" {...register("categoryId")}>
              <option value="">Select category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId.message}</p>}
          </div>

          <div>
            <label htmlFor="eventId" className="label-field">Event</label>
            <select
              id="eventId"
              className="input-field"
              disabled={!selectedCategory || eventsLoading}
              {...register("eventId")}
            >
              <option value="">
                {!selectedCategory
                  ? "Select a category first"
                  : eventsLoading
                    ? "Loading events…"
                    : filteredEvents.length === 0
                      ? "No open events for this category"
                      : "Select event…"}
              </option>
              {filteredEvents.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            {errors.eventId && <p className="mt-1 text-xs text-danger">{errors.eventId.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="institution" className="label-field">School / Institution</label>
          <input id="institution" type="text" className="input-field" placeholder="School, college or organisation" {...register("institution")} />
          {errors.institution && <p className="mt-1 text-xs text-danger">{errors.institution.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="whatsapp" className="label-field">WhatsApp number</label>
            <input id="whatsapp" type="tel" inputMode="tel" autoComplete="tel" className="input-field" placeholder="10-digit mobile number" {...register("whatsapp")} />
            {errors.whatsapp && <p className="mt-1 text-xs text-danger">{errors.whatsapp.message}</p>}
          </div>
          <div>
            <label htmlFor="city" className="label-field">City</label>
            <input id="city" type="text" autoComplete="address-level2" className="input-field" placeholder="Your city" {...register("city")} />
            {errors.city && <p className="mt-1 text-xs text-danger">{errors.city.message}</p>}
          </div>
        </div>

        {serverError && (
          <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{serverError}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full px-6 py-3 text-base">
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" /> Submit registration
            </>
          )}
        </button>

        <p className="text-center text-xs text-content-muted">
          By registering you agree to receive event updates on WhatsApp at {content.whatsappContact}.
        </p>
      </form>
    </div>
  );
}
