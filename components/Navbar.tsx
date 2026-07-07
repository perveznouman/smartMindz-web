"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useRegistration } from "@/components/registration/RegistrationContext";
import { cn, isRegistrationOpen } from "@/lib/utils";
import type { SiteContent } from "@/lib/types";

// Nav links scroll to home-page sections (single-page feel). `match` still
// highlights the item when a standalone page (e.g. /events/some-event) is open.
const links: { href: string; label: string; match?: string }[] = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About", match: "/about" },
  { href: "/#events", label: "Events", match: "/events" },
  { href: "/#team", label: "Team", match: "/team" },
  { href: "/#contact", label: "Contact", match: "/contact" },
];

// IDs of the home-page anchor sections, in document order — used for scroll-spy.
const SECTION_IDS = ["about", "events", "team", "contact"];

export function Navbar({ content }: { content: SiteContent }) {
  const pathname = usePathname();
  const { open } = useRegistration();
  const regOpen = isRegistrationOpen(content);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Which anchor is currently in view; empty string means "Home" (top of page).
  const [activeSection, setActiveSection] = useState<string>("");

  // Track which section is currently in the viewport so the nav item can
  // highlight as the user scrolls. Only runs on the home page, where the
  // anchors live.
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }

    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el,
    );
    if (sections.length === 0) return;

    // Update on every scroll: whichever section's top has crossed above the
    // navbar wins. Using getBoundingClientRect().top (viewport-relative) instead
    // of offsetTop, since offsetTop is relative to offsetParent and can be
    // wrong for sections nested inside positioned containers.
    const NAV_OFFSET = 96; // navbar height + a small breathing room
    function update() {
      // If the user is at the very top, no section is highlighted → Home wins.
      if (window.scrollY < 40) {
        setActiveSection("");
        return;
      }
      let current = "";
      for (const el of sections) {
        if (el.getBoundingClientRect().top - NAV_OFFSET <= 0) current = el.id;
      }
      setActiveSection(current);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [pathname]);

  // Next's <Link> doesn't scroll on same-page hash-only navigation, so when we
  // are already on the home page, smooth-scroll to the section ourselves.
  function handleNavClick(e: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname !== "/") return; // cross-page: let Next navigate + scroll on load
    if (href === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, "", "/");
      return;
    }
    if (!href.startsWith("/#")) return;
    const el = document.getElementById(href.slice(2));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: "smooth" });
    history.pushState(null, "", href);
  }

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
            const target = link.match ?? link.href;
            const anchorId = link.href.startsWith("/#") ? link.href.slice(2) : "";
            const active =
              pathname === "/"
                ? // On the home page, activate based on which section is scrolled to.
                  link.href === "/"
                  ? activeSection === ""
                  : anchorId === activeSection
                : // On a standalone page, activate by pathname prefix match.
                  link.href === "/"
                  ? false
                  : pathname.startsWith(target);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
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
            onClick={() => regOpen && open()}
            disabled={!regOpen}
            className={cn(
              "btn-primary hidden sm:inline-flex",
              !regOpen && "opacity-50 cursor-not-allowed",
            )}
          >
            {regOpen ? "Register" : "Registrations closed"}
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
                onClick={(e) => {
                  setMobileOpen(false);
                  handleNavClick(e, link.href);
                }}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-content hover:bg-surface-2"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                if (!regOpen) return;
                setMobileOpen(false);
                open();
              }}
              disabled={!regOpen}
              className={cn("btn-primary mt-2 w-full", !regOpen && "opacity-50 cursor-not-allowed")}
            >
              {regOpen ? "Register for an event" : "Registrations closed"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
