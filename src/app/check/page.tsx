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

  const telegramUser = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim().replace(
    /^@/,
    "",
  );

  return (
    <div className="kc-page grid gap-8 xl:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] xl:items-start">
      <PageIntro kicker={direction === "applicant" ? "Employers" : "Job seekers"} title={title}>
        {blurb}
        {telegramUser ? (
          <p className="mt-4 text-sm text-kc-ink/70">
            Also available on Telegram:{" "}
            <a
              href={`https://t.me/${telegramUser}`}
              className="font-medium text-kc-ink underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink"
              target="_blank"
              rel="noreferrer"
            >
              @{telegramUser}
            </a>
            . Paste an ad or upload a file in chat.
          </p>
        ) : null}
      </PageIntro>
      <CheckForm direction={direction} />
    </div>
  );
}
