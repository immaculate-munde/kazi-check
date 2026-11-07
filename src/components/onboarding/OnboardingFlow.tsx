"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useRole } from "@/components/role/RoleProvider";
import type { UserRole } from "@/lib/role";

export type OnboardOption = { id: string; label: string; hint?: string };
export type OnboardStep = { title: string; body: string; options: OnboardOption[] };

export function OnboardingFlow({
  role,
  kicker,
  steps,
}: {
  role: UserRole;
  kicker: string;
  steps: OnboardStep[];
}) {
  const router = useRouter();
  const { setRole, completeOnboarding } = useRole();
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<string[]>([]);
  const step = steps[index];
  const selected = picks[index];
  const last = index === steps.length - 1;

  function choose(id: string) {
    const next = [...picks];
    next[index] = id;
    setPicks(next);
  }

  function continueNext() {
    if (!selected) return;
    if (!last) {
      setIndex((i) => i + 1);
      return;
    }
    setRole(role);
    completeOnboarding(role, picks[0] ?? selected);
    router.push("/home");
  }

  return (
    <div className="kc-page mx-auto flex max-w-2xl flex-1 flex-col justify-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">{kicker}</p>
      <p className="mt-2 text-sm text-foreground/55">
        Step {index + 1} of {steps.length}
      </p>
      <div className="mt-3 flex gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-kc-teal" : "bg-foreground/15"}`}
          />
        ))}
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{step.title}</h1>
      <p className="mt-3 text-base leading-7 text-foreground/70">{step.body}</p>
      <ul className="mt-8 space-y-3">
        {step.options.map((option) => {
          const active = selected === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => choose(option.id)}
                className={`kc-glass w-full rounded-[1.5rem] p-5 text-left transition ${
                  active ? "ring-2 ring-kc-teal" : "hover:-translate-y-0.5"
                }`}
              >
                <p className="text-lg font-semibold tracking-tight">{option.label}</p>
                {option.hint ? <p className="mt-1 text-sm leading-6 text-foreground/65">{option.hint}</p> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        {index > 0 ? (
          <Button type="button" variant="outline" onClick={() => setIndex((i) => i - 1)}>
            Back
          </Button>
        ) : null}
        <Button type="button" variant="lime" onClick={continueNext} disabled={!selected}>
          {last ? "Open my dashboard" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
