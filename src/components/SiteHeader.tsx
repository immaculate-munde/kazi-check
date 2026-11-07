"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const links = [
  { href: "/#modes", label: "Services" },
  { href: "/bot", label: "Job Bot" },
  { href: "/skills", label: "Skill Match" },
  { href: "/offer", label: "Offer check" },
  { href: "/tracker", label: "Tracker" },
  { href: "/registry", label: "Registry" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-6 md:px-8">
      <Link href="/" className="flex items-center gap-2 text-xl font-medium tracking-tight text-kc-ink">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-kc-ink bg-kc-lime text-sm font-bold text-[#191a23]">
          KC
        </span>
        Kazi Check
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-base text-kc-ink hover:opacity-70"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        <ThemeToggle />
        <Button href="/check?direction=job_offer" variant="outline">
          Run a check
        </Button>
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button
          type="button"
          className="rounded-lg border-2 border-kc-ink px-3 py-2 text-kc-ink"
          aria-expanded={open}
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </div>

      {open ? (
        <div className="absolute left-0 right-0 top-[72px] z-40 border-b-2 border-kc-ink bg-kc-white px-5 py-4 shadow-brutal md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-2 text-lg text-kc-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Button href="/check?direction=job_offer" variant="solid">
              Run a check
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
