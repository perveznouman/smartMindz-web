"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  PartyPopper,
  UploadCloud,
} from "lucide-react";
import {
  registrationSchema,
  type RegistrationFormValues,
} from "@/lib/validation/registration";
import QRCode from "qrcode";
import { festCategories, getFestCategory } from "@/lib/data/festEvents";
import { getPaymentConfig, buildUpiLink } from "@/lib/data/payment";
import { COUNTRIES, DEFAULT_COUNTRY_CODE, getCountry } from "@/lib/data/countries";
import registrationData from "@/lib/data/registration-data.json";
import { toTitleCase } from "@/lib/utils";
import type { SiteContent } from "@/lib/types";

type SuccessState = {
  registrationId: string | null;
  registrationCode: number | null;
  fullName: string;
  eventTitle: string;
  joinLink: string;
  contact: string;
};

const CITY_OPTIONS = registrationData.cities;

export function RegistrationForm({
  content,
  onClose,
  onRegistrationStart,
  onRegistrationComplete,
}: {
  content: SiteContent;
  onClose?: () => void;
  onRegistrationStart?: () => void;
  onRegistrationComplete?: () => void;
}) {
  const payment = useMemo(() => getPaymentConfig(content), [content]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  // Tracks the City dropdown selection; "Other" reveals the free-text input.
  const [cityChoice, setCityChoice] = useState("");
  // Post-registration payment step.
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [joinQrUrl, setJoinQrUrl] = useState<string | null>(null);

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
      classYear: "",
      institution: "",
      whatsappCountry: DEFAULT_COUNTRY_CODE,
      whatsapp: "",
      event: "",
      city: "",
    },
  });

  const selectedCategory = watch("categoryId");
  const selectedEvent = watch("event");
  const selectedClassYear = watch("classYear");
  const selectedCountry = watch("whatsappCountry");
  const activeCountry = getCountry(selectedCountry) ?? getCountry(DEFAULT_COUNTRY_CODE)!;

  // The chosen category drives both dependent dropdowns.
  const activeCategory = useMemo(
    () => getFestCategory(selectedCategory),
    [selectedCategory],
  );

  const isOpenCategory = selectedCategory === "category-7";

  // Clear the event + class/year if they no longer belong to the new category.
  // Also clear institution when switching to the open category.
  useEffect(() => {
    if (selectedEvent && !activeCategory?.events.includes(selectedEvent)) {
      setValue("event", "");
    }
    if (
      selectedClassYear &&
      !activeCategory?.classYears.includes(selectedClassYear)
    ) {
      setValue("classYear", "");
    }
    if (isOpenCategory) {
      setValue("institution", "");
    }
  }, [activeCategory, selectedEvent, selectedClassYear, isOpenCategory, setValue]);

  // Generate the UPI QR once the payment step is reached.
  useEffect(() => {
    if (!success || paymentUploaded) return;
    QRCode.toDataURL(buildUpiLink(payment), { width: 220, margin: 1 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [success, paymentUploaded, payment]);

  // Generate the WhatsApp group QR once payment is done.
  useEffect(() => {
    if (!success || !paymentUploaded) return;
    QRCode.toDataURL(success.joinLink, { width: 220, margin: 1 })
      .then(setJoinQrUrl)
      .catch(() => setJoinQrUrl(null));
  }, [success, paymentUploaded]);

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
        registrationId: data.registrationId ?? null,
        registrationCode: data.registrationCode ?? null,
        fullName: data.fullName ?? "Friend",
        eventTitle: data.eventTitle,
        joinLink: data.joinLink,
        contact: data.contact,
      });
      onRegistrationStart?.();
    } catch {
      setServerError("Network error. Please check your connection and retry.");
    }
  }

  async function handlePaymentUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!paymentFile) {
      setUploadError("Please choose your payment screenshot.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", paymentFile);
      if (success?.registrationId) fd.append("registrationId", success.registrationId);
      const res = await fetch("/api/register/payment", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      setPaymentUploaded(true);
      onRegistrationComplete?.();
    } catch {
      setUploadError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // Step 2 — payment uploaded: reveal the WhatsApp group link.
  if (success && paymentUploaded) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <PartyPopper className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold font-display">You&apos;re all set! 🎉</h3>
        <p className="mt-2 text-sm text-content-muted">
          Hi <strong className="text-content">{toTitleCase(success.fullName)}</strong>! Payment received for{" "}
          <strong className="text-content">{success.eventTitle}</strong>.
          Join our WhatsApp group for updates, schedule and event details.
        </p>

        {success.registrationCode != null && (
          <div className="mx-auto mt-5 max-w-xs rounded-2xl border border-brand/30 bg-brand/5 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Your registration number
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums text-brand font-display">
              {success.registrationCode}
            </p>
            <p className="mt-2 text-xs text-content-muted">
              Save this — it&apos;s your reference for this event.
            </p>
          </div>
        )}

        {joinQrUrl && (
          <div className="mt-5 rounded-2xl border border-brand/30 bg-brand/5 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={joinQrUrl}
              alt="Scan to join the WhatsApp group"
              className="mx-auto h-44 w-44 rounded-xl bg-white p-2"
            />
            <p className="mt-2 text-xs text-content-muted">
              Scan to join from another device
            </p>
          </div>
        )}

        <a
          href={success.joinLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-4 w-full px-6 py-3 text-base"
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

  // Step 1 — registered: ask for the payment screenshot before the group link.
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold font-display">{toTitleCase(success.fullName)} Registered! 🎉</h3>

        {success.registrationCode != null && (
          <div className="mx-auto mt-4 max-w-xs rounded-2xl border border-brand/30 bg-brand/5 px-6 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-content-muted">
              Your registration number
            </p>
            <p className="mt-0.5 text-3xl font-bold tabular-nums text-brand font-display">
              {success.registrationCode}
            </p>
          </div>
        )}

        <p className="mt-4 text-sm text-content-muted">
          One last step for <strong className="text-content">{success.eventTitle}</strong> —
          pay the entry fee and upload your payment screenshot to confirm your spot
          and unlock the WhatsApp group.
        </p>

        <div className="mt-5 rounded-2xl border border-brand/30 bg-brand/5 p-4 text-center">
          <p className="text-sm text-content-muted">
            Amount to pay
            <span className="ml-2 text-lg font-bold text-brand">₹{payment.amount}</span>
            <span className="ml-1 text-xs text-content-muted">per event</span>
          </p>

          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`Scan to pay ₹${payment.amount} via UPI`}
              className="mx-auto mt-3 h-44 w-44 rounded-xl bg-white p-2"
            />
          )}

          <p className="mt-2 text-xs text-content-muted">
            Scan with any UPI app · UPI ID:{" "}
            <span className="font-medium text-content">{payment.upiId}</span>
          </p>

          <a
            href={buildUpiLink(payment)}
            className="btn-outline mt-3 w-full px-4 py-2 text-sm sm:hidden"
          >
            Pay ₹{payment.amount} in a UPI app
          </a>

          <p className="mt-2 text-xs text-content-muted">
            If the button doesn't open your UPI app, open your preferred UPI app (Google Pay,
            PhonePe, Paytm) and send <strong>₹{payment.amount}</strong> to{" "}
            <strong>{payment.upiId}</strong>
          </p>
        </div>

        <form onSubmit={handlePaymentUpload} className="mt-5 text-left">
          <label htmlFor="payment" className="label-field">Payment screenshot</label>
          <input
            id="payment"
            type="file"
            accept="image/*,application/pdf"
            className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-brand"
            onChange={(e) => {
              setPaymentFile(e.target.files?.[0] ?? null);
              setUploadError(null);
            }}
          />
          {uploadError && <p className="mt-1 text-xs text-danger">{uploadError}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary mt-4 w-full px-6 py-3 text-base"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" /> Upload &amp; continue
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-xs text-content-muted">
          Questions? Message us on WhatsApp at{" "}
          <span className="font-medium text-content">{success.contact}</span>.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-display">Register for Independence Fest 2k26</h3>
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

        <div>
          <label htmlFor="categoryId" className="label-field">Category</label>
          <select id="categoryId" className="input-field" {...register("categoryId")}>
            <option value="">Select category…</option>
            {festCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId.message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event" className="label-field">Event</label>
            <select
              id="event"
              className="input-field"
              disabled={!activeCategory}
              {...register("event")}
            >
              <option value="">
                {!activeCategory ? "Select a category first" : "Select event…"}
              </option>
              {activeCategory?.events.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            {errors.event && <p className="mt-1 text-xs text-danger">{errors.event.message}</p>}
          </div>

          <div>
            <label htmlFor="classYear" className="label-field">Class / Year</label>
            <select
              id="classYear"
              className="input-field"
              disabled={!activeCategory}
              {...register("classYear")}
            >
              <option value="">
                {!activeCategory ? "Select a category first" : "Select class / year…"}
              </option>
              {activeCategory?.classYears.map((cy) => (
                <option key={cy} value={cy}>{cy}</option>
              ))}
            </select>
            {errors.classYear && <p className="mt-1 text-xs text-danger">{errors.classYear.message}</p>}
          </div>
        </div>

        {!isOpenCategory && (
          <div>
            <label htmlFor="institution" className="label-field">School / Institution</label>
            <input id="institution" type="text" className="input-field" placeholder="School, college or organisation" {...register("institution")} />
            {errors.institution && <p className="mt-1 text-xs text-danger">{errors.institution.message}</p>}
          </div>
        )}

        <div className="grid gap-4">
          <div>
            <label htmlFor="whatsapp" className="label-field">WhatsApp number</label>
            <div className="flex gap-2">
              <select
                aria-label="Country code"
                className="input-field w-auto shrink-0 pr-8"
                {...register("whatsappCountry")}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} +{c.dial}
                  </option>
                ))}
              </select>
              <input
                id="whatsapp"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className="input-field flex-1"
                placeholder={`${activeCountry.digits}-digit mobile number`}
                {...register("whatsapp")}
              />
            </div>
            {errors.whatsappCountry && <p className="mt-1 text-xs text-danger">{errors.whatsappCountry.message}</p>}
            {errors.whatsapp && <p className="mt-1 text-xs text-danger">{errors.whatsapp.message}</p>}
          </div>
          <div>
            <label htmlFor="cityChoice" className="label-field">City</label>
            <select
              id="cityChoice"
              className="input-field"
              value={cityChoice}
              onChange={(e) => {
                const val = e.target.value;
                setCityChoice(val);
                // For a preset city the value is the city itself; for "Other"
                // clear it so the revealed text field can capture the entry.
                // Don't validate on "Other" — wait until the user types.
                setValue("city", val === "Other" ? "" : val, {
                  shouldValidate: val !== "Other",
                });
              }}
            >
              <option value="">Select city…</option>
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            {cityChoice === "Other" && (
              <input
                type="text"
                autoComplete="address-level2"
                className="input-field mt-2"
                placeholder="Enter your city"
                {...register("city")}
              />
            )}
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
