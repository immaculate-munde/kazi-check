"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/check?direction=job_offer", prefix: "/check", label: "1 Check" },
  { href: "/skills", prefix: "/skills", label: "2 Match" },
  { href: "/bot", prefix: "/bot", label: "3 Apply" },
  { href: "/offer", prefix: "/offer", label: "4 Offer" },
  { href: "/tracker", prefix: "/tracker", label: "5 Track" },
  { href: "/registry", prefix: "/registry", label: "Registry" },
];

function isActive(pathname: string, prefix: string) {
  if (prefix === "/check") return pathname === "/check" || pathname.startsWith("/checks/");
  if (prefix === "/skills") return pathname.startsWith("/skills") || pathname === "/quiz";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 border-b border-kc-ink/10 bg-kc-canvas/80 backdrop-blur-xl">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href="/" aria-label="Kazi Check home" className="flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink">
          <span className="flex min-h-11 items-center gap-2 text-base font-semibold tracking-tight text-kc-ink lg:hidden">
            <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-kc-white">
              <Image src="/kazi-check-mark.png" alt="" width={379} height={501} className="h-7 w-auto object-contain" />
            </span>
            <span>Kazi Check</span>
          </span>
          <span className="hidden rounded-full bg-kc-white px-3 py-1 lg:inline-flex">
            <Image src="/kazi-check-logo.png" alt="Kazi Check. Verify. Match. Proceed." width={1680} height={538} className="h-8 w-auto object-contain" />
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink ${
                isActive(pathname, link.prefix)
                  ? "bg-kc-white text-kc-ink"
                  : "text-kc-ink/70 hover:bg-kc-white/70 hover:text-kc-ink"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <ThemeToggle />
          <Button href="/check?direction=job_offer" variant="lime">
            Check an advert
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="min-h-11 rounded-full border border-kc-ink/10 bg-kc-white px-4 py-2 text-sm font-medium text-kc-ink transition hover:bg-kc-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink"
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>
      </header>

      {open ? (
        <nav id="mobile-navigation" aria-label="Main navigation" className="border-t border-kc-ink/10 bg-kc-canvas px-5 py-4 lg:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-xl px-3 text-base font-medium text-kc-ink hover:bg-kc-white focus-visible:outline-2 focus-visible:outline-kc-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/check?direction=job_offer" variant="lime">
              Check an advert
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
}
