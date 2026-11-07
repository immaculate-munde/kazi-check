import { CheckForm } from "@/components/check/CheckForm";
import { PageIntro } from "@/components/ui/PageIntro";
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
    <div className="kc-page grid gap-8 xl:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] xl:items-start">
      <PageIntro kicker={direction === "applicant" ? "Employers" : "Job seekers"} title={title}>
        {blurb}
      </PageIntro>
      <CheckForm direction={direction} />
    </div>
  );
}
