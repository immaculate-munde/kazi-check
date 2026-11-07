"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRole } from "@/components/role/RoleProvider";
import { guideFor } from "@/lib/flow";

export function WorkspaceHeader() {
  const path = usePathname();
  const search = useSearchParams();
  const { role } = useRole();
  const guide = guideFor(path, search.get("direction"));

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">
          {role === "recruiter" ? "Recruiter" : "Job seeker"}
        </p>
        <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {guide.here}
        </h1>
      </div>
      <ThemeToggle className="hidden shrink-0 lg:inline-flex" />
    </header>
  );
}
