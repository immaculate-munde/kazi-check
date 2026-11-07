export type FindingStatus = "Flagged" | "Passed" | "Not determined";

const statusStyles: Record<FindingStatus, string> = {
  Flagged: "border-red-200 bg-red-50 text-red-950",
  Passed: "border-emerald-200 bg-emerald-50 text-emerald-950",
  "Not determined": "border-amber-200 bg-amber-50 text-amber-950",
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
      className="motion-safe:animate-[result-enter_350ms_ease-out_both] rounded-2xl border border-kc-ink/10 bg-kc-white p-4 shadow-[0_8px_24px_rgba(25,26,35,0.04)] sm:p-5"
      style={{ animationDelay: `${Math.min(index * 55, 330)}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-kc-ink">{title}</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>
            {status}
          </span>
          <span className="min-w-12 text-right font-mono text-sm font-medium text-kc-ink/75">
            {points === null ? "—" : points < 0 ? `−${Math.abs(points)}` : `+${points}`}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-6 text-kc-ink/75">{explanation}</p>
      {snippet ? (
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-kc-muted px-3 py-3 font-mono text-xs leading-5 text-kc-ink/85">
          {snippet}
        </pre>
      ) : null}
      <p className="mt-3 text-xs text-kc-gray">Source: {source}</p>
    </article>
  );
}
