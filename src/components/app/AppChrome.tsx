"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app/AppSidebar";
import { WorkspaceHeader } from "@/components/app/WorkspaceHeader";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { SiteFooter } from "@/components/SiteFooter";

function isMarketing(path: string) {
  return path === "/" || path === "/start";
}

export function AppChrome({ children }: { children: ReactNode }) {
  const path = usePathname();

  if (isMarketing(path)) {
    return (
      <div className="kc-scene flex min-h-full flex-col">
        <MarketingHeader />
        <main className="flex-1 px-3 pb-3 md:px-5 md:pb-5">
          <div className="kc-stage mx-auto w-full max-w-[1120px] overflow-hidden">{children}</div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="kc-scene flex min-h-dvh flex-col gap-3 p-3 lg:flex-row md:gap-4 md:p-4">
      <Suspense fallback={<aside className="hidden w-[4.75rem] shrink-0 lg:block" />}>
        <AppSidebar />
      </Suspense>
      <div className="kc-stage flex min-w-0 flex-1 flex-col overflow-hidden">
        <Suspense fallback={null}>
          <WorkspaceHeader />
        </Suspense>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
