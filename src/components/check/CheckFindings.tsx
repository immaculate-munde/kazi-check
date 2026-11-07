import { FindingRow, type FindingStatus } from "@/components/check/FindingRow";
import type { Finding } from "@/lib/types";

function statusOf(outcome: Finding["outcome"]): FindingStatus {
  if (outcome === "flagged") return "Flagged";
  if (outcome === "passed") return "Passed";
  return "Not determined";
}

export function CheckFindings({ findings }: { findings: Finding[] }) {
  if (findings.length === 0) {
    return (
      <p className="text-sm text-kc-ink/70">No findings were recorded for this check.</p>
    );
  }
  return (
    <div className="space-y-3">
      {findings.map((item, index) => (
        <FindingRow
          key={`${item.checkKey}-${index}`}
          title={item.title}
          status={statusOf(item.outcome)}
          points={item.outcome === "unknown" ? null : item.points}
          explanation={item.explanation}
          snippet={item.evidence ?? undefined}
          source={item.source}
          index={index}
        />
      ))}
    </div>
  );
}
