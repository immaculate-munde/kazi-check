export function aggregateReasons(flags: { reason?: string | null }[]): string[] {
  const counts = new Map<string, number>();
  for (const f of flags) {
    const r = (f.reason ?? "").trim();
    if (!r) continue;
    counts.set(r, (counts.get(r) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reason]) => reason)
    .slice(0, 5);
}
