import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-16 pt-6 md:grid-cols-2 md:gap-12 md:px-8 md:pb-20 md:pt-10">
      <div>
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-kc-gray">
          Kazi Check
        </p>
        <h1 className="text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl lg:text-[60px]">
          Separate fake recruitment noise from real career signals
        </h1>
        <p className="mt-6 max-w-md text-lg leading-7 text-kc-ink/80">
          Paste a job offer or an applicant message. Get an evidence-backed
          verdict — then SMS it or flag the recruiter for everyone else.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/#modes" variant="solid">
            Start a check
          </Button>
          <Button href="/registry" variant="outline">
            View registry
          </Button>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-md">
        <div className="absolute inset-8 rounded-full border-2 border-kc-ink bg-kc-lime/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-56 w-56 rounded-[2rem] border-2 border-kc-ink bg-white shadow-brutal md:h-64 md:w-64">
            <div className="absolute -right-4 -top-4 rounded-full border-2 border-kc-ink bg-kc-lime px-3 py-1 text-xs font-medium">
              Evidence
            </div>
            <div className="flex h-full flex-col justify-between p-6">
              <div>
                <p className="text-sm text-kc-gray">Verdict</p>
                <p className="mt-1 text-2xl font-medium">SCAM</p>
              </div>
              <ul className="space-y-2 text-sm">
                <li className="rounded-lg border border-kc-ink/20 bg-kc-muted px-3 py-2">
                  Pay-to-apply fee
                </li>
                <li className="rounded-lg border border-kc-ink/20 bg-kc-muted px-3 py-2">
                  Lookalike domain
                </li>
                <li className="rounded-lg border border-kc-ink/20 bg-kc-lime/50 px-3 py-2">
                  12 community flags
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
