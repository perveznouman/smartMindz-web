"use client";

import type { ReactNode } from "react";
import { useRegistration } from "./RegistrationContext";

/** Opens the registration modal from any (server-rendered) page. */
export function RegisterButton({
  eventId,
  children,
  className = "btn-primary",
}: {
  eventId?: string;
  children: ReactNode;
  className?: string;
}) {
  const { open } = useRegistration();
  return (
    <button type="button" className={className} onClick={() => open(eventId)}>
      {children}
    </button>
  );
}
