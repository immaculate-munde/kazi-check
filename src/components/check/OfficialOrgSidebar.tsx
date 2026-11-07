import { resolveOfficialEmployer } from "@/lib/orgs/from-check";
import type { CheckRecord } from "@/lib/types";

export function OfficialOrgSidebar({ check }: { check: CheckRecord }) {
  const employer = resolveOfficialEmployer(check);
  if (employer) {
    return (
      <section
        className="kc-glass min-w-0 p-4 sm:p-5"
        aria-labelledby="employer-link-title"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kc-gray">
          Independent verification
        </p>
        <h2 id="employer-link-title" className="mt-2 text-lg font-semibold">
          Verify with {employer.name}
        </h2>
        <p className="mt-2 text-sm leading-6 text-kc-ink/70">
          Use the organization’s own recruitment information to confirm this opportunity.
        </p>
        <a
          href={employer.careersUrl ?? employer.officialUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-full bg-kc-ink px-4 py-3 text-sm font-semibold text-kc-on-ink hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink"
        >
          {employer.careersUrl ? "Open official careers page" : "Open official website"}
          <span aria-hidden="true">↗</span>
        </a>
        <p className="mt-3 break-all font-mono text-xs text-kc-gray">
          {employer.careersUrl ?? employer.officialUrl}
        </p>
      </section>
    );
  }
  return (
    <section className="kc-glass min-w-0 p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-kc-gray">
        Verify independently
      </p>
      <h2 className="mt-2 text-lg font-semibold">Use an official channel</h2>
      <p className="mt-2 text-sm leading-6 text-kc-ink/70">
        Find the employer’s website yourself and use its published careers contact. Don’t rely on
        links in a suspicious message.
      </p>
    </section>
  );
}
