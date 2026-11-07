import type { ReactNode } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="max-w-2xl">
      <SectionLabel>{kicker}</SectionLabel>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {children ? (
        <p className="mt-3 text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">{children}</p>
      ) : null}
    </header>
  );
}
