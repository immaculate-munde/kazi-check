import { SectionLabel } from "@/components/ui/SectionLabel";

const steps = [
  {
    n: "01",
    title: "Verify the opportunity",
    body: "Submit an advert, get a risk score, evidence, and recommended action.",
  },
  {
    n: "02",
    title: "Match your skills",
    body: "Compare your CV to the role, review gaps, and take a short domain quiz.",
  },
  {
    n: "03",
    title: "Check the offer",
    body: "Analyse offer letters for green/red flags and draft clarification emails.",
  },
  {
    n: "04",
    title: "Track and flag",
    body: "Save opportunities, and flag recruiters with a clear reason for the community.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-8 max-w-xl">
        <SectionLabel>A clear path forward</SectionLabel>
        <p className="mt-5 text-lg leading-7 text-kc-ink/75">
          Start with a check, understand the signals, then decide what feels right for you.
        </p>
      </div>
      <div className="overflow-hidden rounded-3xl border border-kc-ink/10 bg-kc-white shadow-[0_12px_40px_rgba(25,26,35,0.06)]">
        {steps.map((step, index) => (
          <details
            key={step.n}
            className={`group border-kc-ink/10 open:bg-kc-muted/70 ${
              index < steps.length - 1 ? "border-b" : ""
            }`}
            open={index === 0}
          >
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-kc-ink sm:px-8 md:min-h-20 md:px-10">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="text-sm font-semibold tracking-wide text-kc-gray">{step.n}</span>
                <span className="text-lg font-semibold md:text-xl">{step.title}</span>
              </div>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-kc-ink/15 bg-kc-white text-xl group-open:hidden">
                +
              </span>
              <span aria-hidden="true" className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-kc-ink text-xl text-kc-on-ink group-open:flex">
                −
              </span>
            </summary>
            <p className="px-5 pb-6 pl-[3.75rem] text-base leading-7 text-kc-ink/75 sm:px-8 sm:pb-7 sm:pl-[5.75rem] md:px-10 md:pl-[7.5rem]">
              {step.body}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
