"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useRegistration } from "@/components/registration/RegistrationContext";
import { cn } from "@/lib/utils";
import type { SiteContent } from "@/lib/types";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/events", label: "Events" },
  { href: "/team", label: "Team" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  const { open } = useRegistration();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={content.orgName}>
          {content.logoUrl && (
            <Image
              src={content.logoUrl}
              alt={`${content.orgName} logo`}
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover"
            />
          )}
          <span className="text-lg font-bold tracking-tight font-display">
            Smart<span className="text-brand">Mindz</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-surface-2 text-content"
                    : "text-content-muted hover:text-content",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => open()}
            className="btn-primary hidden sm:inline-flex"
          >
            Register
          </button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface md:hidden"
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border bg-bg md:hidden">
          <div className="container-page flex flex-col gap-1 py-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-content hover:bg-surface-2"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                open();
              }}
              className="btn-primary mt-2 w-full"
            >
              Register for an event
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
