import { CheckForm } from "@/components/check/CheckForm";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { CheckDirection } from "@/lib/types";

export const instant = false;

type SearchParams = Promise<{ direction?: string }>;

function resolveDirection(raw?: string): CheckDirection {
  return raw === "applicant" ? "applicant" : "job_offer";
}

export default async function CheckPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const direction = resolveDirection(params.direction);

  const title =
    direction === "applicant" ? "Check an applicant" : "Check a job offer";
  const blurb =
    direction === "applicant"
      ? "Paste applicant outreach, CV claims, or a suspicious message. You’ll get a credibility verdict with evidence."
      : "Paste the job ad or recruiter message. You’ll get a risk verdict, evidence, and what to confirm yourself.";

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>{title}</SectionLabel>
      <p className="mt-6 text-lg text-kc-ink/80">{blurb}</p>
      <div className="mt-10">
        <CheckForm direction={direction} />
      </div>
    </div>
  );
}
