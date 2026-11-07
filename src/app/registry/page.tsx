"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FlagCountPill } from "@/components/ui/FlagCountPill";
import { PageIntro } from "@/components/ui/PageIntro";
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
    <div className="kc-page">
      <PageIntro kicker="Public registry" title="Who has already been flagged?">
        Community-flagged recruiters and risky applicants. Counts update when
        people report a scam.
      </PageIntro>

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
            className={`kc-tab ${tab === value ? "kc-tab-active" : ""}`}
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
            <article className="kc-glass flex h-full min-w-0 flex-col justify-between overflow-hidden p-5 text-foreground transition hover:-translate-y-0.5 sm:p-6">
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
