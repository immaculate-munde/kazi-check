export function FlagCountPill({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-kc-ink bg-kc-lime px-3 py-1 text-sm font-medium text-kc-ink">
      <span aria-hidden>⚠</span>
      {count} {count === 1 ? "person" : "people"} flagged this as scam
    </span>
  );
}
