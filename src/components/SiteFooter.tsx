import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-6xl px-5 pb-8 pt-12 md:px-8 md:pt-16">
      <div className="rounded-3xl bg-kc-ink px-6 py-8 text-kc-on-ink sm:px-8 md:px-10 md:py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Link href="/" aria-label="Kazi Check home" className="inline-flex max-w-full items-center rounded-2xl bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kc-lime">
              <Image src="/kazi-check-logo.png" alt="Kazi Check. Verify. Match. Proceed." width={1680} height={538} className="h-auto w-full max-w-[320px] object-contain" />
            </Link>
            <p className="mt-3 leading-6 text-kc-on-ink/75">
              Risk indicators, not legal conclusions. If you lost money, report it to the DCI.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/check?direction=job_offer" className="flex min-h-11 items-center underline decoration-kc-on-ink/35 underline-offset-4 hover:decoration-kc-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-lime">
              Check offer
            </Link>
            <Link href="/check?direction=applicant" className="flex min-h-11 items-center underline decoration-kc-on-ink/35 underline-offset-4 hover:decoration-kc-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-lime">
              Check applicant
            </Link>
            <Link href="/registry" className="flex min-h-11 items-center underline decoration-kc-on-ink/35 underline-offset-4 hover:decoration-kc-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-lime">
              Registry
            </Link>
            <a href="https://www.dci.go.ke/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center underline decoration-kc-on-ink/35 underline-offset-4 hover:decoration-kc-on-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-lime">
              Report to DCI <span aria-hidden="true" className="ml-1">↗</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
