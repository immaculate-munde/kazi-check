import { FindingRow, type FindingStatus } from "@/components/check/FindingRow";
import type { Finding } from "@/lib/types";

function statusOf(outcome: Finding["outcome"]): FindingStatus {
  if (outcome === "flagged") return "Flagged";
  if (outcome === "passed") return "Passed";
  return "Not determined";
}

function FindingList({ findings, startIndex = 0 }: { findings: Finding[]; startIndex?: number }) {
  return (
    <div className="space-y-2.5">
      {findings.map((item, index) => (
        <FindingRow
          key={`${item.checkKey}-${index}`}
          title={item.title}
          status={statusOf(item.outcome)}
          points={item.outcome === "unknown" ? null : item.points}
          explanation={item.explanation}
          snippet={item.evidence ?? undefined}
          source={item.source}
          index={startIndex + index}
        />
      ))}
    </div>
  );
}

export function CheckFindings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-kc-ink/70">No findings were recorded for this check.</p>
    );
  }

  const flagged = findings.filter((item) => item.outcome === "flagged");
  const unknown = findings.filter((item) => item.outcome === "unknown");
  const passed = findings.filter((item) => item.outcome === "passed");

  return (
    <div className="space-y-4">
      {flagged.length > 0 ? (
        <section aria-label="Flagged findings">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-800">
            Review these first · {flagged.length}
          </p>
          <FindingList findings={flagged} />
        </section>
      ) : null}

      {unknown.length > 0 ? (
        <details className="rounded-2xl border border-kc-ink/10 bg-kc-muted/50 p-3" open={flagged.length === 0}>
          <summary className="cursor-pointer text-sm font-semibold text-kc-ink">
            Could not determine · {unknown.length}
          </summary>
          <p className="mt-1 text-xs leading-5 text-kc-ink/70">
            Unknown is not a scam stamp. Confirm these yourself if they matter to you.
          </p>
          <div className="mt-3">
            <FindingList findings={unknown} startIndex={flagged.length} />
          </div>
        </details>
      ) : null}

      {passed.length > 0 ? (
        <details className="rounded-2xl border border-kc-ink/10 bg-kc-muted/30 p-3">
          <summary className="cursor-pointer text-sm font-semibold text-kc-ink">
            Passed · {passed.length}
          </summary>
          <div className="mt-3">
            <FindingList findings={passed} startIndex={flagged.length + unknown.length} />
          </div>
        </details>
      ) : null}
    </div>
  );
}
