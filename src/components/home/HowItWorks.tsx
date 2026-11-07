import { SectionLabel } from "@/components/ui/SectionLabel";

const steps = [
  {
    n: "01",
    title: "Choose your side",
    body: "Job offer or applicant — same product, different rule pack.",
  },
  {
    n: "02",
    title: "Paste the text",
    body: "We extract domains, fees, contacts, and claims into structured signals.",
  },
  {
    n: "03",
    title: "Read the evidence",
    body: "Verdict plus rule hits, WHOIS/whitelist checks, and community flag counts.",
  },
  {
    n: "04",
    title: "Act",
    body: "SMS the result, flag the recruiter, or draft a takedown alert.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-5 py-16 md:px-8">
      <div className="mb-10">
        <SectionLabel>How it works</SectionLabel>
      </div>
      <div className="overflow-hidden rounded-kc border-2 border-kc-ink shadow-brutal">
        {steps.map((step, index) => (
          <details
            key={step.n}
            className={`group border-kc-ink open:bg-kc-lime/30 ${
              index < steps.length - 1 ? "border-b-2" : ""
            }`}
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-6 md:px-10 md:py-8">
              <div className="flex items-center gap-4 md:gap-8">
                <span className="text-2xl font-medium md:text-4xl">{step.n}</span>
                <span className="text-xl font-medium md:text-2xl">{step.title}</span>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-kc-ink bg-white text-2xl group-open:hidden">
                +
              </span>
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-kc-ink bg-kc-ink text-2xl text-white group-open:flex">
                −
              </span>
            </summary>
            <p className="px-6 pb-8 text-lg text-kc-ink/80 md:px-10 md:pl-[7.5rem]">
              {step.body}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
