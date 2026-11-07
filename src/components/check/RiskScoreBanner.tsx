import type { CheckDirection, RiskBand } from "@/lib/types";

export function riskSummary(riskBand: RiskBand, direction?: CheckDirection) {
  switch (riskBand) {
    case "LOW":
      return {
        label: "No red flags",
        guidance:
          "The checks did not find major warning signs in the content provided. This is not proof that the opportunity is legitimate.",
        style: "border-emerald-200 bg-emerald-50 text-emerald-950",
        queue: "CHECKED",
      };
    case "MODERATE":
      return {
        label: "Caution",
        guidance:
          "Review the details and verify the employer through an official channel before sharing money or personal information.",
        style: "border-amber-200 bg-amber-50 text-amber-950",
        queue: "REVIEW",
      };
    case "SUSPICIOUS":
      return {
        label: "High risk",
        guidance:
          "Several warning signs need attention. Do not pay or share sensitive documents until you verify independently.",
        style: "border-orange-300 bg-orange-50 text-orange-950",
        queue: "REVIEW",
      };
    case "HIGH":
      return {
        label: direction === "job_offer" ? "SCAM" : "High risk",
        guidance:
          "Strong scam indicators were found. Do not send money or sensitive information. Verify through the employer’s official careers channel.",
        style: "border-red-300 bg-red-50 text-red-950",
        queue: "BLOCKED",
      };
    case "INSUFFICIENT_INFORMATION":
      return {
        label: "Not enough information",
        guidance:
          "Add the full message, a link, or contact details before relying on this result.",
        style: "border-kc-ink/15 bg-kc-muted text-kc-ink",
        queue: "NEEDS INPUT",
      };
  }
}

export function RiskScoreBanner({
  riskBand,
  riskScore,
  direction,
  queueLine,
}: {
  riskBand: RiskBand;
  riskScore: number;
  direction?: CheckDirection;
  queueLine?: string;
}) {
  const summary = riskSummary(riskBand, direction);

  return (
    <section className={`result-enter rounded-3xl border p-5 sm:p-7 ${summary.style}`} aria-labelledby="verdict-title">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">Automated risk indicators</p>
          <h1 id="verdict-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{summary.label}</h1>
          <p className="mt-3 text-base leading-7 opacity-85">{summary.guidance}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-2 sm:block sm:text-right">
          <strong className="text-6xl font-semibold leading-none tracking-[-0.06em] sm:text-7xl">{riskScore}</strong>
          <span className="text-sm font-medium opacity-70">/ 100</span>
        </div>
      </div>
      {queueLine ? <p className="mt-6 border-t border-current/15 pt-4 font-mono text-xs leading-6 tracking-tight sm:text-sm">{queueLine}</p> : null}
    </section>
  );
}
