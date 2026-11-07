import { SectionLabel } from "@/components/ui/SectionLabel";

const steps = [
  {
    n: "1",
    title: "Paste the advert",
    body: "Copy the message, email, or WhatsApp text exactly as you received it.",
  },
  {
    n: "2",
    title: "Read the verdict",
    body: "Flagged evidence first. Unknown and passed checks stay folded away.",
  },
  {
    n: "3",
    title: "Use the official page",
    body: "Open the employer’s careers site — not the link inside a suspicious message.",
  },
  {
    n: "4",
    title: "Apply or report",
    body: "If it is eligible, draft on the official portal. If it is blocked, flag it in the registry.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="px-5 pb-12 pt-2 md:px-8">
      <div className="mb-6">
        <SectionLabel>How it works</SectionLabel>
        <h2 className="mt-3 max-w-lg text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Verify first. Then decide.
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <article key={step.n} className="kc-cream p-5 sm:p-6">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-kc-muted text-sm font-semibold text-kc-ink">
              {step.n}
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-tight">{step.title}</h3>
            <p className="mt-2 text-sm leading-6 text-kc-ink/70">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
