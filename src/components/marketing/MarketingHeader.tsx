"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useRole } from "@/components/role/RoleProvider";

export function MarketingHeader() {
  const { onboarded } = useRole();

  return (
    <div className="sticky top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <header className="kc-glass mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-2.5">
        <Link href="/" aria-label="Kazi Check home" className="flex min-h-11 items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-white/80 dark:bg-white/10">
            <Image src="/kazi-check-mark.png" alt="" width={379} height={501} className="h-7 w-auto object-contain" />
          </span>
          <span className="text-base font-semibold tracking-tight text-foreground">Kazi Check</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button href={onboarded ? "/home" : "/start"} variant="lime">
            {onboarded ? "Dashboard" : "Get started"}
          </Button>
        </div>
      </header>
    </div>
  );
}
