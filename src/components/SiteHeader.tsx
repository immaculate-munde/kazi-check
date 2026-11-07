"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/#modes", label: "Services" },
  { href: "/skills", label: "Skill Match" },
  { href: "/offer", label: "Offer check" },
  { href: "/tracker", label: "Tracker" },
  { href: "/registry", label: "Registry" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
      <Link href="/" aria-label="Kazi Check home" className="flex min-h-11 shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink">
        <span className="flex min-h-11 items-center gap-2 text-lg font-semibold tracking-tight text-kc-ink lg:hidden">
          <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white">
            <Image src="/kazi-check-mark.png" alt="" width={379} height={501} className="h-9 w-auto object-contain" />
          </span>
          <span>Kazi Check</span>
        </span>
        <span className="hidden rounded-lg bg-white px-2 py-1 lg:inline-flex">
          <Image src="/kazi-check-logo.png" alt="Kazi Check. Verify. Match. Proceed." width={1680} height={538} className="h-12 w-auto object-contain" />
        </span>
      </Link>

      <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-md py-2 text-sm font-medium text-kc-ink/75 transition hover:text-kc-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 lg:flex">
        <ThemeToggle />
        <Button href="/check?direction=job_offer" variant="outline">
          Run a check
        </Button>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <ThemeToggle />
        <button
          type="button"
          className="min-h-11 min-w-11 rounded-xl border border-kc-ink/15 px-4 py-2 text-sm font-medium text-kc-ink transition hover:bg-kc-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink"
          aria-expanded={open}
          aria-controls="mobile-navigation"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav id="mobile-navigation" aria-label="Main navigation" className="absolute left-0 right-0 top-[68px] z-40 border-y border-kc-ink/10 bg-kc-white px-5 py-4 shadow-[0_16px_24px_rgba(25,26,35,0.10)] lg:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center rounded-lg px-3 text-base font-medium text-kc-ink hover:bg-kc-muted focus-visible:outline-2 focus-visible:outline-kc-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/check?direction=job_offer" variant="solid">
              Run a check
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
