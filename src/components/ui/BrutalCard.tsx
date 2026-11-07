import type { ReactNode } from "react";

type Tone = "white" | "muted" | "lime" | "ink";

const toneClass: Record<Tone, string> = {
  white: "bg-kc-white text-kc-ink",
  muted: "bg-kc-muted text-kc-ink",
  lime: "bg-kc-lime text-kc-ink",
  ink: "bg-kc-ink text-kc-on-ink",
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
    <div
      className={`rounded-kc border-2 border-kc-ink p-8 shadow-brutal md:p-10 ${toneClass[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
