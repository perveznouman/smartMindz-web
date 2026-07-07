"use client";

import type { ReactNode } from "react";
import { useRegistration } from "./RegistrationContext";

/** Opens the registration modal from any (server-rendered) page. */
export function RegisterButton({
  eventId,
  children,
  className = "btn-primary",
  disabled = false,
}: {
  eventId?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { open } = useRegistration();
  return (
    <button
      type="button"
      className={`${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      onClick={() => !disabled && open(eventId)}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
