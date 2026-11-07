"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { CheckDirection, RegistrySubject } from "@/lib/types";

export default function RegistryPage() {
  const [tab, setTab] = useState<CheckDirection | "all">("all");
  const [items, setItems] = useState<RegistrySubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const q = tab === "all" ? "" : `?direction=${tab}`;
      const res = await fetch(`/api/registry${q}`);
      const data = await res.json();
      if (!cancelled) {
        setItems(data.items ?? []);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const empty = useMemo(() => !loading && items.length === 0, [loading, items]);

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Public scam registry</SectionLabel>
      <p className="mt-6 max-w-2xl text-lg text-kc-ink/80">
        Community-flagged recruiters and risky applicants. Counts update when
        people tap Flag as scam.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["job_offer", "Recruiters / offers"],
            ["applicant", "Applicants"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full border-2 border-kc-ink px-4 py-2 text-sm font-medium ${
              tab === value
                ? "bg-kc-lime text-[#191a23]"
                : "bg-kc-white text-kc-ink hover:bg-kc-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="mt-10 text-lg">Loading registry…</p> : null}
      {empty ? <p className="mt-10 text-lg">No flagged subjects yet.</p> : null}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {items.map((item) => (
          <Link key={item.id} href={`/registry/${item.id}`}>
            <article className="flex h-full flex-col justify-between rounded-kc border-2 border-kc-ink bg-kc-white p-8 text-kc-ink shadow-brutal transition hover:-translate-y-0.5">
              <div>
                <p className="text-sm uppercase tracking-wide text-kc-gray">
                  {item.kind} ·{" "}
                  {item.direction === "applicant" ? "applicant" : "recruiter"}
                </p>
                <h2 className="mt-2 break-all text-2xl font-medium">{item.key}</h2>
                <p className="mt-4 text-kc-ink/75">{item.summary}</p>
                {item.topReasons?.[0] ? (
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Top reason:</span>{" "}
                    {item.topReasons[0]}
                  </p>
                ) : null}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <FlagCountPill count={item.flagCount} />
                <span className="text-sm text-kc-gray">
                  {item.lastFlaggedAt
                    ? `Updated ${item.lastFlaggedAt}`
                    : "No flags yet"}
                </span>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
