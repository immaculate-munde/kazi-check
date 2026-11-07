import Link from "next/link";
import { Button } from "@/components/ui/Button";

const checks = ["No fee to verify", "Clear risk signals", "Community context"];

export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:pt-12 md:grid-cols-[1.08fr_0.92fr] md:gap-10 md:px-8 md:pb-24">
      <div>
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-kc-ink/15 bg-kc-muted px-3 py-1.5 text-sm font-medium text-kc-ink/80">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-600" />
          Built for job seekers in Kenya
        </p>
        <h1 className="max-w-2xl text-[2.65rem] font-semibold leading-[1.06] tracking-[-0.045em] sm:text-5xl lg:text-[4.25rem]">
          Know what you&apos;re walking into.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-kc-ink/75 sm:text-xl">
          Check a job advert, recruiter, applicant, or offer before you share
          your time or personal details. Get clear signals and practical next
          steps.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/check?direction=job_offer" variant="solid" className="min-h-12 px-7">
            Check an opportunity <span aria-hidden="true">→</span>
          </Button>
          <Button href="/registry" variant="outline" className="min-h-12 px-7">
            Browse community flags
          </Button>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-kc-ink/70">
          {checks.map((check) => (
            <li key={check} className="inline-flex items-center gap-2">
              <span aria-hidden="true" className="font-semibold text-emerald-700">✓</span>
              {check}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mx-auto w-full max-w-lg md:pl-4">
        <div className="absolute -right-2 -top-5 h-24 w-24 rounded-full bg-kc-lime/70 sm:-right-4 sm:-top-8 sm:h-32 sm:w-32" aria-hidden="true" />
        <div className="absolute -bottom-5 -left-3 h-20 w-20 rounded-full border border-kc-ink/10 bg-kc-muted sm:-left-7 sm:h-28 sm:w-28" aria-hidden="true" />
        <div className="relative rounded-[1.75rem] border border-kc-ink/10 bg-kc-white p-5 shadow-[0_24px_70px_rgba(25,26,35,0.12)] sm:p-7">
          <div className="flex items-center justify-between border-b border-kc-ink/10 pb-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-kc-gray">Opportunity review</p>
              <p className="mt-1 font-medium">Operations associate</p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">Review carefully</span>
          </div>
          <div className="py-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-kc-gray">Risk signals found</p>
                <p className="mt-1 text-4xl font-semibold tracking-tight">2 <span className="text-base font-normal text-kc-gray">to review</span></p>
              </div>
              <span className="mb-1 rounded-xl bg-kc-lime px-3 py-2 text-sm font-semibold text-[#191a23]">Check details</span>
            </div>
            <div className="mt-6 space-y-3">
              <div className="rounded-xl border border-kc-ink/10 bg-kc-muted/70 p-4">
                <p className="text-sm font-semibold">Application fee requested</p>
                <p className="mt-1 text-sm leading-6 text-kc-ink/70">Legitimate employers should not ask you to pay to apply.</p>
              </div>
              <div className="rounded-xl border border-kc-ink/10 bg-kc-muted/70 p-4">
                <p className="text-sm font-semibold">Verify the sender</p>
                <p className="mt-1 text-sm leading-6 text-kc-ink/70">Review the contact details and employer domain before replying.</p>
              </div>
            </div>
          </div>
          <p className="border-t border-kc-ink/10 pt-4 text-xs leading-5 text-kc-gray">Illustrative example. Always review the evidence and make your own decision.</p>
        </div>
        <Link href="/check?direction=applicant" className="relative mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-kc-ink underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-ink">
          Employers can verify applicants too <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
