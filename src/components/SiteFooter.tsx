import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-6xl px-5 pb-10 pt-16 md:px-8">
      <div className="rounded-kc border-2 border-kc-ink bg-kc-ink px-8 py-10 text-kc-on-ink shadow-brutal md:px-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-2xl font-medium">Kazi Check</p>
            <p className="mt-2 max-w-md text-kc-on-ink/75">
              Two-way recruitment trust: verify job offers, verify applicants,
              and flag scammers for the community.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/check?direction=job_offer" className="underline">
              Check offer
            </Link>
            <Link href="/check?direction=applicant" className="underline">
              Check applicant
            </Link>
            <Link href="/registry" className="underline">
              Registry
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
