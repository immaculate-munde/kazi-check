"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FLOW_EXTRA, FLOW_STEPS, guideFor, isFlowActive } from "@/lib/flow";

const tabs = [...FLOW_STEPS, FLOW_EXTRA];

export function WorkspaceHeader() {
  const path = usePathname();
  const search = useSearchParams();
  const guide = guideFor(path, search.get("direction"));

  return (
    <header className="shrink-0 px-4 pb-2 pt-4 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <nav
          aria-label="Workspace"
          className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1"
        >
          {tabs.map((step) => {
            const active = isFlowActive(path, step.prefix);
            return (
              <Link
                key={step.href}
                href={step.href}
                className={`kc-tab shrink-0 ${active ? "kc-tab-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {step.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle className="hidden shrink-0 lg:inline-flex" />
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground/55">
        {guide.doThis}
      </p>
    </header>
  );
}
