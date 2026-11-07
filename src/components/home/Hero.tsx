import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section>
      <div className="grid items-center gap-10 px-5 py-10 md:grid-cols-[1.1fr_0.9fr] md:gap-12 md:px-8 md:py-12">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-foreground/8 px-3 py-1.5 text-sm font-medium text-foreground/80">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-500" />
            Job-offer trust for Kenya
          </p>
          <h1 className="max-w-xl text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
            Verify first. Then decide.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-foreground/70 sm:text-lg sm:leading-8">
            Job seekers check adverts before they pay. Recruiters check applicants
            before they trust the file. Same engine. Never labelled SAFE.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/start" variant="lime" className="min-h-12 px-7">
              Get started <span aria-hidden="true">→</span>
            </Button>
            <Button href="/registry" variant="outline" className="min-h-12 px-7">
              Browse community flags
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/55">
            <li>No fee to verify</li>
            <li aria-hidden="true">·</li>
            <li>Never auto-apply</li>
            <li aria-hidden="true">·</li>
            <li>Official portal only</li>
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div className="kc-tile relative overflow-hidden p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-foreground/45">Sample result</p>
                <p className="mt-1 font-medium text-foreground">KenGen “interview fee”</p>
              </div>
              <span className="rounded-full bg-kc-cream px-3 py-1 text-xs font-semibold text-red-800">SCAM</span>
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-tight text-foreground">
              100 <span className="text-base font-medium text-foreground/45">/ 100</span>
            </p>
            <div className="mt-5 space-y-2.5">
              <div className="rounded-2xl bg-kc-cream px-4 py-3 text-kc-ink">
                <p className="text-sm font-semibold">Asked for an interview fee</p>
                <p className="mt-1 text-sm leading-5 text-kc-ink/70">Do not send M-Pesa to secure a job.</p>
              </div>
              <div className="rounded-2xl bg-foreground/6 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Next step</p>
                <p className="mt-1 text-sm leading-5 text-foreground/65">Use the official KenGen careers portal, not the link in the message.</p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground/45">Illustrative example. Always review the evidence yourself.</p>
          </div>
          <Link href="/start" className="relative mt-5 inline-flex min-h-11 items-center text-sm font-medium text-foreground/70 underline decoration-foreground/25 underline-offset-4 hover:text-foreground hover:decoration-foreground">
            Get started — pick what you have →
          </Link>
        </div>
      </div>
    </section>
  );
}
