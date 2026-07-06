"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { SiteContent } from "@/lib/types";
import { RegistrationForm } from "./RegistrationForm";

interface RegistrationContextValue {
  /** Open the registration modal. */
  open: (eventId?: string) => void;
  close: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | null>(null);

export function useRegistration() {
  const ctx = useContext(RegistrationContext);
  if (!ctx) {
    throw new Error("useRegistration must be used within RegistrationProvider");
  }
  return ctx;
}

export function RegistrationProvider({
  content,
  children,
}: {
  content: SiteContent;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  // `eventId` is accepted for backwards compatibility with existing callers
  // (e.g. RegisterButton on event pages) but the fest form manages its own
  // category → event cascade, so it is not used to preselect.
  const open = useCallback((_eventId?: string) => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <RegistrationContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Event registration"
          >
            <motion.div
              className="card relative my-8 w-full max-w-lg p-6 sm:p-8"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-content-muted transition-colors hover:bg-surface-2"
              >
                <X className="h-5 w-5" />
              </button>
              <RegistrationForm content={content} onClose={close} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RegistrationContext.Provider>
  );
}
