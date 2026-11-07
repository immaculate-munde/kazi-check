"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRole } from "@/components/role/RoleProvider";
import { isFlowActive, stepsFor } from "@/lib/flow";

const NAV_KEY = "kc-nav-collapsed";

function DockLink({
  href,
  label,
  hint,
  active,
  collapsed,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  hint?: string;
  active: boolean;
  collapsed: boolean;
  icon: typeof SearchIcon;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      title={hint ? `${label} — ${hint}` : label}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={`flex min-h-11 items-center gap-3 rounded-2xl transition ${
        collapsed ? "w-11 justify-center px-0" : "w-full px-3"
      } ${
        active
          ? "bg-kc-teal text-white"
          : "text-foreground/75 hover:bg-foreground/8 hover:text-foreground"
      }`}
    >
      <Icon />
      {collapsed ? null : (
        <span className="text-sm font-medium">{label}</span>
      )}
    </Link>
  );
}

const ICON_BY_LABEL: Record<string, typeof HomeIcon> = {
  Home: HomeIcon,
  Check: SearchIcon,
  Match: UsersIcon,
  Apply: SendIcon,
  Offer: FileIcon,
  Track: ListIcon,
  Registry: FlagIcon,
};

export function AppSidebar() {
  const path = usePathname();
  const { role } = useRole();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const steps = stepsFor(role);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(NAV_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NAV_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const nav = (
    labeled: boolean,
    onNavigate?: () => void,
    isCollapsed = false,
  ) => (
    <>
      <Link
        href="/home"
        className={`inline-flex h-11 items-center overflow-hidden rounded-2xl bg-white/70 dark:bg-white/10 ${
          labeled && !isCollapsed ? "w-full gap-2 px-3" : "w-11 justify-center"
        }`}
        onClick={onNavigate}
        aria-label="Kazi Check home"
      >
        <Image src="/kazi-check-mark.png" alt="" width={379} height={501} className="h-7 w-auto object-contain" />
        {labeled && !isCollapsed ? (
          <span className="text-sm font-semibold text-foreground">Kazi Check</span>
        ) : null}
      </Link>

      <nav className={`mt-6 flex flex-1 flex-col gap-1.5 ${isCollapsed ? "items-center" : "w-full px-1"}`} aria-label="Workspace">
        {steps.map((item) => (
          <DockLink
            key={item.href}
            href={item.href}
            label={item.label}
            hint={item.hint}
            icon={ICON_BY_LABEL[item.label] ?? SearchIcon}
            active={isFlowActive(path, item.prefix)}
            collapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </>
  );

  return (
    <>
      <aside
        className={`kc-dock hidden h-full shrink-0 flex-col py-4 lg:flex ${
          collapsed ? "w-[4.75rem] items-center px-2" : "w-60 px-3"
        }`}
      >
        {nav(true, undefined, collapsed)}
        <button
          type="button"
          onClick={toggleCollapsed}
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl text-sm font-medium text-foreground/70 hover:bg-foreground/8 hover:text-foreground"
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
      </aside>

      <div className="kc-glass sticky top-0 z-40 flex items-center justify-between gap-3 rounded-[1.35rem] px-3 py-2 lg:hidden">
        <button
          type="button"
          className="min-h-11 rounded-full bg-kc-teal px-4 text-sm font-semibold text-white"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <ThemeToggle />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/35" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="kc-dock relative flex h-full w-[min(18rem,85vw)] flex-col gap-4 overflow-y-auto px-3 py-5">
            {nav(true, () => setOpen(false), false)}
          </aside>
        </div>
      ) : null}
    </>
  );
}

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
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
