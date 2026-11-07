import type { ReactNode } from "react";

type Tone = "white" | "muted" | "lime" | "ink";

const toneClass: Record<Tone, string> = {
  white: "kc-glass text-foreground",
  muted: "kc-tile text-foreground",
  lime: "kc-glass text-foreground",
  ink: "kc-tile text-foreground",
};

export function BrutalCard({
  children,
  tone = "white",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-[1.5rem] p-5 sm:p-6 ${toneClass[tone]} ${className}`}>
      {children}
    </div>
  );
}
