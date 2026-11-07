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
    <section className="px-5 py-10 pb-12 md:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <SectionLabel>Community registry</SectionLabel>
          <h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Already flagged by someone else?
          </h2>
        </div>
        <Link href="/registry" className="font-medium text-foreground/70 underline decoration-foreground/25 underline-offset-4 hover:text-foreground hover:decoration-foreground">
          See all flagged subjects →
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="kc-tile px-5 py-8 text-sm text-foreground/65">
          No public flags yet. Reports from checks appear here.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={`/registry/${item.id}`} className="block h-full">
              <article className="kc-glass flex h-full min-w-0 flex-col justify-between overflow-hidden p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kc-gray">
                    {item.kind} · {item.direction === "applicant" ? "applicant" : "recruiter"}
                  </p>
                  <h3 className="mt-2 break-all text-lg font-semibold">{item.key}</h3>
                  <p className="mt-3 text-sm leading-6 text-kc-ink/70">{item.summary}</p>
                </div>
                <div className="mt-5">
                  <FlagCountPill count={item.flagCount} />
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
