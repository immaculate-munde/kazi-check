import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-[1400px] px-3 pb-4 md:px-5">
      <div className="kc-glass px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-md">
            <Link href="/" aria-label="Kazi Check home" className="inline-flex max-w-full items-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground">
              <Image src="/kazi-check-logo.png" alt="Kazi Check. Verify. Match. Proceed." width={1680} height={538} className="h-auto w-full max-w-[240px] object-contain" />
            </Link>
            <p className="mt-3 text-sm leading-6 text-foreground/65">
              Risk indicators, not legal conclusions. If you lost money, report it to the DCI.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium">
            <Link href="/check?direction=job_offer" className="flex min-h-11 items-center text-foreground/70 hover:text-foreground">
              Check offer
            </Link>
            <Link href="/check?direction=applicant" className="flex min-h-11 items-center text-foreground/70 hover:text-foreground">
              Check applicant
            </Link>
            <Link href="/registry" className="flex min-h-11 items-center text-foreground/70 hover:text-foreground">
              Registry
            </Link>
            <a href="https://www.dci.go.ke/" target="_blank" rel="noreferrer" className="flex min-h-11 items-center text-foreground/70 hover:text-foreground">
              Report to DCI <span aria-hidden="true" className="ml-1">↗</span>
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
