"use client";

import type { ReactNode } from "react";
import { useUpload } from "./UploadContext";

/** Opens the video-upload modal from any (server-rendered) page. */
export function UploadButton({
  children,
  className = "btn-primary",
  disabled = false,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { open } = useUpload();
  return (
    <button
      type="button"
      className={`${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && open()}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
