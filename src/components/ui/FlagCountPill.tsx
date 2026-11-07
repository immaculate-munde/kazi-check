export function FlagCountPill({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-950">
      <span aria-hidden>⚠</span>
      {count} {count === 1 ? "person" : "people"} flagged this as scam
    </span>
  );
}
