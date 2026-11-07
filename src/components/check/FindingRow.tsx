export type FindingStatus = "Flagged" | "Passed" | "Not determined";

const statusStyles: Record<FindingStatus, string> = {
  Flagged: "bg-red-100 text-red-900",
  Passed: "bg-emerald-100 text-emerald-900",
  "Not determined": "bg-amber-100 text-amber-950",
};

const barStyles: Record<FindingStatus, string> = {
  Flagged: "bg-red-400",
  Passed: "bg-emerald-400",
  "Not determined": "bg-amber-400",
};

export function FindingRow({
  title,
  status,
  points,
  explanation,
  snippet,
  source,
  index = 0,
}: {
  title: string;
  status: FindingStatus;
  points: number | null;
  explanation: string;
  snippet?: string;
  source: string;
  index?: number;
}) {
  return (
    <article
      className="kc-glass relative min-w-0 overflow-hidden p-3.5 pl-5 motion-safe:animate-[result-enter_350ms_ease-out_both] sm:p-4 sm:pl-5"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
    >
      <span className={`absolute inset-y-0 left-0 w-1.5 ${barStyles[status]}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold leading-6 text-kc-ink sm:text-base">{title}</h3>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${statusStyles[status]}`}>
            {status}
          </span>
          <span className="w-9 text-right font-mono text-xs font-medium text-kc-ink/70 sm:w-10 sm:text-sm">
            {points === null ? "—" : points < 0 ? `−${Math.abs(points)}` : `+${points}`}
          </span>
        </div>
      </div>
      <p className="mt-1.5 text-sm leading-6 text-kc-ink/75">{explanation}</p>
      {snippet ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-kc-ink underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink">
            Why this matched
          </summary>
          <pre className="mt-2 max-h-24 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-kc-muted px-3 py-2 font-mono text-xs leading-5 text-kc-ink/85">
            {snippet}
          </pre>
        </details>
      ) : null}
      <p className="mt-2 text-xs text-kc-ink/50">Source: {source}</p>
    </article>
  );
}
