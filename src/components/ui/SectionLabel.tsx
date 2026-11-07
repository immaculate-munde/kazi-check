import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-md bg-kc-lime px-2 py-0.5 text-2xl font-medium leading-tight text-[#191a23] md:text-[28px]">
      {children}
    </span>
  );
}
