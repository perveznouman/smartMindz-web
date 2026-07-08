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
  const [canClose, setCanClose] = useState(true);
  const [closeConfirm, setCloseConfirm] = useState(false);

  // `eventId` is accepted for backwards compatibility with existing callers
  // (e.g. RegisterButton on event pages) but the fest form manages its own
  // category → event cascade, so it is not used to preselect.
  const open = useCallback((_eventId?: string) => {
    setIsOpen(true);
    setCanClose(true);
    setCloseConfirm(false);
  }, []);

  const close = useCallback(() => {
    if (!canClose) {
      setCloseConfirm(true);
      return;
    }
    setIsOpen(false);
    setCloseConfirm(false);
  }, [canClose]);

  const forceClose = useCallback(() => {
    setIsOpen(false);
    setCloseConfirm(false);
  }, []);

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
              <RegistrationForm
                content={content}
                onClose={close}
                onRegistrationStart={() => setCanClose(false)}
                onRegistrationComplete={() => setCanClose(true)}
              />

              {closeConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <motion.div
                    className="card w-80 p-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <h3 className="text-lg font-bold text-content">Are you sure?</h3>
                    <p className="mt-2 text-sm text-content-muted">
                      Closing now will lose your registration. You'll have to register again.
                    </p>
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={() => setCloseConfirm(false)}
                        className="btn-ghost flex-1"
                      >
                        Keep filling
                      </button>
                      <button
                        onClick={forceClose}
                        className="btn-outline flex-1 text-content-muted"
                      >
                        Close anyway
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RegistrationContext.Provider>
  );
}
