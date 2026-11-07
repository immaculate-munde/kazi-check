import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-kc-lime px-3 py-1 text-sm font-semibold leading-5 tracking-wide text-[#191a23]">
      {children}
    </span>
  );
}
