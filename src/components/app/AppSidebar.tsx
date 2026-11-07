"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FLOW_EXTRA, FLOW_STEPS, isFlowActive } from "@/lib/flow";

const dock = [
  ...FLOW_STEPS.map((step, index) => ({
    ...step,
    icon: [SearchIcon, UsersIcon, SendIcon, FileIcon, ListIcon][index] ?? SearchIcon,
  })),
  { ...FLOW_EXTRA, icon: FlagIcon },
];

function DockLink({
  href,
  label,
  active,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: typeof SearchIcon;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl transition ${
        active
          ? "bg-kc-cream text-kc-ink"
          : "text-foreground/70 hover:bg-foreground/8 hover:text-foreground"
      }`}
    >
      <Icon />
    </Link>
  );
}

function NavBody({ onNavigate, labeled = false }: { onNavigate?: () => void; labeled?: boolean }) {
  const path = usePathname();

  return (
    <>
      <Link
        href="/"
        className={`inline-flex h-11 items-center justify-center overflow-hidden rounded-2xl bg-kc-cream ${labeled ? "w-auto gap-2 px-3" : "w-11"}`}
        onClick={onNavigate}
        aria-label="Kazi Check home"
      >
        <Image src="/kazi-check-mark.png" alt="" width={379} height={501} className="h-7 w-auto object-contain" />
        {labeled ? <span className="text-sm font-semibold text-kc-ink">Kazi Check</span> : null}
      </Link>

      <nav className={`mt-6 flex flex-col gap-1.5 ${labeled ? "w-full px-3" : "items-center"}`} aria-label="Workspace steps">
        {dock.map((item) => {
          const active = isFlowActive(path, item.prefix);
          if (!labeled) {
            return (
              <DockLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={active}
                onNavigate={onNavigate}
              />
            );
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium ${
                active ? "bg-kc-cream text-kc-ink" : "text-foreground/75 hover:bg-foreground/8"
              }`}
            >
              <Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export function AppSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="kc-dock sticky top-4 hidden h-[calc(100dvh-2rem)] w-[4.75rem] shrink-0 flex-col items-center overflow-y-auto py-4 lg:flex">
        <NavBody />
      </aside>

      <div className="kc-glass sticky top-0 z-40 flex items-center justify-between gap-3 rounded-[1.35rem] px-3 py-2 lg:hidden">
        <button
          type="button"
          className="min-h-11 rounded-full bg-kc-cream px-4 text-sm font-semibold text-kc-ink"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Steps"}
        </button>
        <ThemeToggle />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/35" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="kc-dock relative flex h-full w-[min(18rem,85vw)] flex-col gap-4 overflow-y-auto py-5">
            <NavBody labeled onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M20 20l-3.4-3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M4 19a5 5 0 0 1 10 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 19a4 4 0 0 1 4-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12 20 4l-6 16-2.5-6.5L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 7h11M9 12h11M9 17h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="5" cy="7" r="1.2" fill="currentColor" />
      <circle cx="5" cy="12" r="1.2" fill="currentColor" />
      <circle cx="5" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 4v16M6 5h11l-2 4 2 4H6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
