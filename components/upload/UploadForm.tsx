"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, PartyPopper, UploadCloud, Video } from "lucide-react";
import { festCategories, getFestCategory, getOnlineEvents } from "@/lib/data/festEvents";

const verifySchema = z.object({
  categoryId: z.string().min(1, "Select a category"),
  event: z.string().min(1, "Select an event"),
  registrationCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter your 4-digit registration number"),
});
type VerifyFormValues = z.infer<typeof verifySchema>;

type VerifiedState = {
  categoryId: string;
  event: string;
  registrationCode: number;
  fullName: string;
};

const MAX_BYTES = 500 * 1024 * 1024; // 500 MB — matches the server-side cap.

/**
 * PUTs the file straight to Google's resumable-upload session URL — no
 * Authorization header needed, the session URL itself is the credential (see
 * lib/google/drive.ts). Uses XHR rather than fetch so upload progress is
 * observable; fetch has no upload-progress event.
 *
 * Resolves with the new Drive file id, or null when the upload may well have
 * succeeded but the response wasn't readable. Either way /api/video/complete
 * has the final say, so this never needs to decide "did it work?" itself.
 *
 * Deliberately a single PUT with no resume-from-offset retry: Drive does not
 * expose the `Range` response header to browsers, so a client cannot learn
 * how many bytes actually arrived, and any "resume" would silently restart
 * from zero. Real resumption would need chunked uploads — worth adding only
 * if large uploads prove unreliable in practice.
 */
function putFileToDrive(
  uploadUrl: string,
  file: File,
  onProgress: (pct: number) => void,
): Promise<string | null> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText) as { id?: unknown };
        resolve(typeof data.id === "string" ? data.id : null);
      } catch {
        resolve(null);
      }
    };
    xhr.onerror = () => resolve(null);
    xhr.send(file);
  });
}

export function UploadForm({
  onClose,
  onUploadStart,
  onUploadComplete,
}: {
  onClose?: () => void;
  onUploadStart?: () => void;
  onUploadComplete?: () => void;
}) {
  const [verified, setVerified] = useState<VerifiedState | null>(null);
  // Set once /api/video/verify finds a match, but held back from `verified`
  // until the user explicitly confirms the name is theirs — catches a
  // mistyped registration number that happens to belong to someone else.
  const [pending, setPending] = useState<VerifiedState | null>(null);
  const [identityChoice, setIdentityChoice] = useState<"yes" | "no" | "">("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Only categories with at least one online event are worth showing — the
  // rest have nothing eligible for video upload.
  const uploadCategories = useMemo(
    () => festCategories.filter((c) => getOnlineEvents(c.id).length > 0),
    [],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { categoryId: "", event: "", registrationCode: "" },
  });

  const selectedCategory = watch("categoryId");
  const selectedEvent = watch("event");
  const activeCategory = useMemo(() => getFestCategory(selectedCategory), [selectedCategory]);
  const onlineEvents = useMemo(() => getOnlineEvents(selectedCategory), [selectedCategory]);

  // Clear the event if it no longer belongs to the newly selected category.
  useEffect(() => {
    if (selectedEvent && !onlineEvents.includes(selectedEvent)) {
      setValue("event", "");
    }
  }, [onlineEvents, selectedEvent, setValue]);

  async function onVerify(values: VerifyFormValues) {
    setServerError(null);
    try {
      const res = await fetch("/api/video/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationCode: Number(values.registrationCode),
          categoryId: values.categoryId,
          eventName: values.event,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setIdentityChoice("");
      setPending({
        categoryId: values.categoryId,
        event: values.event,
        registrationCode: Number(values.registrationCode),
        fullName: data.fullName ?? "Friend",
      });
    } catch {
      setServerError("Network error. Please check your connection and retry.");
    }
  }

  function handleConfirmIdentity() {
    if (identityChoice === "yes" && pending) {
      setVerified(pending);
      setPending(null);
    }
  }

  function handleWrongIdentity() {
    setPending(null);
    setIdentityChoice("");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!verified) return;
    if (!file) {
      setUploadError("Please choose a video file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("That video is too large (max 500 MB).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    setProgress(0);
    onUploadStart?.();
    try {
      const sessionRes = await fetch("/api/video/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationCode: verified.registrationCode,
          categoryId: verified.categoryId,
          eventName: verified.event,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || "application/octet-stream",
        }),
      });
      const sessionData = await sessionRes.json();
      if (!sessionRes.ok) {
        setUploadError(sessionData.error ?? "We couldn't start the upload. Please try again.");
        return;
      }

      // May be null if the response wasn't readable — /api/video/complete
      // verifies against Drive either way, so we pass it along as a hint
      // rather than treating it as the verdict.
      const driveFileId = await putFileToDrive(sessionData.uploadUrl, file, setProgress);

      const completeRes = await fetch("/api/video/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationCode: verified.registrationCode,
          categoryId: verified.categoryId,
          eventName: verified.event,
          ...(driveFileId ? { driveFileId } : {}),
        }),
      });
      if (!completeRes.ok) {
        const completeData = await completeRes.json().catch(() => ({}) as { error?: string });
        setUploadError(
          completeData.error ?? "The video uploaded, but we couldn't record it.",
        );
        return;
      }
      setDone(true);
    } catch {
      setUploadError("Upload failed. Please check your connection and try again.");
    } finally {
      // Called on every exit path, not just success: once the request settles
      // there's nothing in flight left to lose, so it's always safe to close.
      setUploading(false);
      onUploadComplete?.();
    }
  }

  // Step 3 — done.
  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <PartyPopper className="h-8 w-8 text-success" />
        </div>
        <h3 className="mt-5 text-2xl font-bold font-display">Video received! 🎉</h3>
        <p className="mt-2 text-sm text-content-muted">
          Thanks, <strong className="text-content">{verified?.fullName}</strong>! Your entry for{" "}
          <strong className="text-content">{verified?.event}</strong> is in.
        </p>
        {onClose && (
          <button type="button" onClick={onClose} className="btn-primary mt-6 w-full px-6 py-3 text-base">
            Close
          </button>
        )}
      </div>
    );
  }

  // Step 1b — confirm identity: a mistyped registration number can still
  // belong to someone else's real registration. Forcing an explicit Yes/No
  // choice (not just showing the name) makes that much harder to click past
  // without noticing.
  if (pending) {
    return (
      <div>
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
            <Video className="h-7 w-7 text-brand" />
          </div>
          <h3 className="mt-4 text-2xl font-bold font-display">Is this you?</h3>
          <p className="mt-1 text-sm text-content-muted">
            Registration #{pending.registrationCode} for{" "}
            <strong className="text-content">{pending.event}</strong> belongs to:
          </p>
        </div>

        <div className="rounded-2xl border border-brand/30 bg-brand/5 px-6 py-4 text-center">
          <p className="text-xl font-bold text-content font-display">{pending.fullName}</p>
        </div>

        <div className="mt-5 space-y-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
            <input
              type="radio"
              name="identityConfirm"
              value="yes"
              checked={identityChoice === "yes"}
              onChange={() => setIdentityChoice("yes")}
              className="h-4 w-4 accent-brand"
            />
            <span className="text-sm font-medium">Yes, this is me — upload my video</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 has-[:checked]:border-brand has-[:checked]:bg-brand/5">
            <input
              type="radio"
              name="identityConfirm"
              value="no"
              checked={identityChoice === "no"}
              onChange={() => setIdentityChoice("no")}
              className="h-4 w-4 accent-brand"
            />
            <span className="text-sm font-medium">No, this isn&apos;t me</span>
          </label>
        </div>

        {identityChoice === "no" && (
          <p className="mt-3 rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">
            That's not your registration number. Double-check the 4-digit code
            you were given and try again.
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button type="button" onClick={handleWrongIdentity} className="btn-ghost flex-1">
            Back
          </button>
          <button
            type="button"
            onClick={handleConfirmIdentity}
            disabled={identityChoice !== "yes"}
            className="btn-primary flex-1 px-6 py-3 text-base"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Step 2 — verified: pick and upload the video.
  if (verified) {
    return (
      <div>
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
            <Video className="h-7 w-7 text-brand" />
          </div>
          <h3 className="mt-4 text-2xl font-bold font-display">
            Hi {verified.fullName.split(" ")[0]}, upload your video
          </h3>
          <p className="mt-1 text-sm text-content-muted">
            For <strong className="text-content">{verified.event}</strong> — registration #
            {verified.registrationCode}
          </p>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label htmlFor="video" className="label-field">Video file</label>
            <input
              id="video"
              type="file"
              accept="video/*"
              disabled={uploading}
              className="input-field file:mr-3 file:rounded-full file:border-0 file:bg-brand/10 file:px-4 file:py-1.5 file:text-sm file:font-medium file:text-brand"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setUploadError(null);
              }}
            />
            <p className="mt-1 text-xs text-content-muted">
              MP4, MOV, WEBM, MKV or AVI — up to 500 MB.
            </p>
            {uploadError && <p className="mt-1 text-xs text-danger">{uploadError}</p>}
          </div>

          {uploading && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-content-muted">{progress}% uploaded</p>
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="btn-primary w-full px-6 py-3 text-base"
          >
            {uploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <UploadCloud className="h-5 w-5" /> Upload video
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Step 1 — category / event / registration number.
  return (
    <div>
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-display">Upload your video</h3>
        <p className="mt-1 text-sm text-content-muted">
          Pick your category and event, then enter your 4-digit registration number.
        </p>
      </div>

      <form onSubmit={handleSubmit(onVerify)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="upload-categoryId" className="label-field">Category</label>
          <select id="upload-categoryId" className="input-field" {...register("categoryId")}>
            <option value="">Select category…</option>
            {uploadCategories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-xs text-danger">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="upload-event" className="label-field">Event</label>
          <select
            id="upload-event"
            className="input-field"
            disabled={!activeCategory}
            {...register("event")}
          >
            <option value="">
              {!activeCategory ? "Select a category first" : "Select event…"}
            </option>
            {onlineEvents.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          {errors.event && <p className="mt-1 text-xs text-danger">{errors.event.message}</p>}
        </div>

        <div>
          <label htmlFor="registrationCode" className="label-field">4-digit registration number</label>
          <input
            id="registrationCode"
            type="text"
            inputMode="numeric"
            maxLength={4}
            className="input-field"
            placeholder="e.g. 1042"
            {...register("registrationCode")}
          />
          {errors.registrationCode && (
            <p className="mt-1 text-xs text-danger">{errors.registrationCode.message}</p>
          )}
        </div>

        {serverError && (
          <p className="rounded-xl bg-danger/10 px-4 py-2.5 text-sm text-danger">{serverError}</p>
        )}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full px-6 py-3 text-base">
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Checking…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" /> Continue
            </>
          )}
        </button>
      </form>
    </div>
  );
}
