"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { RegistrySubject } from "@/lib/types";

export function RegistryTeaser() {
  const [items, setItems] = useState<RegistrySubject[]>([]);

  useEffect(() => {
    fetch("/api/registry")
      .then((r) => r.json())
      .then((data) => setItems((data.items ?? []).slice(0, 3)))
      .catch(() => setItems([]));
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel>Community registry</SectionLabel>
          <p className="mt-4 max-w-lg text-lg text-kc-ink/80">
            When others get the same link, they see how many people already
            flagged it as scam.
          </p>
        </div>
        <Link href="/registry" className="font-medium underline underline-offset-4">
          See all flagged subjects →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <Link key={item.id} href={`/registry/${item.id}`}>
            <article className="flex h-full flex-col justify-between rounded-kc border-2 border-kc-ink bg-kc-ink p-8 text-white shadow-brutal transition hover:-translate-y-0.5">
              <div>
                <p className="text-sm uppercase tracking-wide text-white/60">
                  {item.kind} ·{" "}
                  {item.direction === "applicant" ? "applicant" : "recruiter"}
                </p>
                <h3 className="mt-3 break-all text-xl font-medium">{item.key}</h3>
                <p className="mt-4 text-white/75">{item.summary}</p>
              </div>
              <div className="mt-6">
                <FlagCountPill count={item.flagCount} />
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
