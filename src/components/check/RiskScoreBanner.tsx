import type { CheckDirection, RiskBand } from "@/lib/types";

export function riskSummary(riskBand: RiskBand, direction?: CheckDirection) {
  switch (riskBand) {
    case "LOW":
      return {
        label: "No red flags",
        guidance:
          "The checks did not find major warning signs in the content provided. This is not proof that the opportunity is legitimate.",
        style: "kc-glass",
        chip: "bg-kc-muted",
        queue: "CHECKED",
      };
    case "MODERATE":
      return {
        label: "Caution",
        guidance:
          "Review the details and verify the employer through an official channel before sharing money or personal information.",
        style: "kc-glass ring-1 ring-amber-300/50",
        chip: "bg-amber-100",
        queue: "REVIEW",
      };
    case "SUSPICIOUS":
      return {
        label: "High risk",
        guidance:
          "Several warning signs need attention. Do not pay or share sensitive documents until you verify independently.",
        style: "kc-glass ring-1 ring-orange-300/50",
        chip: "bg-orange-100",
        queue: "REVIEW",
      };
    case "HIGH":
      return {
        label: direction === "job_offer" ? "SCAM" : "High risk",
        guidance:
          "Strong scam indicators were found. Do not send money or sensitive information. Verify through the employer’s official careers channel.",
        style: "kc-glass ring-1 ring-red-300/50",
        chip: "bg-red-100",
        queue: "BLOCKED",
      };
    case "INSUFFICIENT_INFORMATION":
      return {
        label: "Not enough information",
        guidance:
          "Add the full message, a link, or contact details before relying on this result.",
        style: "kc-glass",
        chip: "bg-kc-muted",
        queue: "NEEDS INPUT",
      };
  }
}

export function QueueChips({
  items,
  chipClass,
}: {
  items: { label: string; emphasize?: boolean }[];
  chipClass: string;
}) {
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className={`rounded-full px-3 py-1 text-xs font-semibold text-kc-ink ${
            item.emphasize ? "bg-kc-ink text-kc-on-ink" : chipClass
          }`}
        >
          {item.label}
        </li>
      ))}
    </ul>
  );
}

export function RiskScoreBanner({
  riskBand,
  riskScore,
  direction,
  queueLine,
  chips,
}: {
  riskBand: RiskBand;
  riskScore: number;
  direction?: CheckDirection;
  queueLine?: string;
  chips?: { label: string; emphasize?: boolean }[];
}) {
  const summary = riskSummary(riskBand, direction);
  const chipItems = chips?.length
    ? chips
    : queueLine
      ? queueLine.split(" · ").map((label, index) => ({ label, emphasize: index === 0 }))
      : [];

  return (
    <section className={`min-w-0 overflow-hidden rounded-[1.5rem] p-5 text-foreground sm:p-6 ${summary.style}`} aria-labelledby="verdict-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kc-gray">What this means</p>
          <h1 id="verdict-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            {summary.label}
          </h1>
          <p className="mt-3 text-sm leading-6 text-foreground/75 sm:text-base sm:leading-7">{summary.guidance}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-1.5 sm:text-right">
          <strong className="text-5xl font-semibold leading-none tracking-[-0.06em]">{riskScore}</strong>
          <span className="text-sm font-medium text-kc-gray">/ 100</span>
        </div>
      </div>
      {chipItems.length > 0 ? <QueueChips items={chipItems} chipClass={summary.chip} /> : null}
    </section>
  );
}
