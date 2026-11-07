import Link from "next/link";
import { PageIntro } from "@/components/ui/PageIntro";

const paths = [
  {
    href: "/check?direction=job_offer",
    label: "I have one advert",
    body: "Paste a WhatsApp, SMS, or email. Get a verdict and the official careers page.",
    step: "Start at Check",
  },
  {
    href: "/bot",
    label: "I have many ads",
    body: "Upload a batch. Blocked ads stay blocked. Eligible ones open the official portal.",
    step: "Start at Apply",
  },
  {
    href: "/offer",
    label: "I already have an offer letter",
    body: "Read red flags before you accept, pay, or share more documents.",
    step: "Start at Offer",
  },
  {
    href: "/check?direction=applicant",
    label: "I’m hiring — check an applicant",
    body: "Paste outreach or CV claims. Same engine. Still never labelled SAFE.",
    step: "Employer path",
  },
];

export default function StartPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
      <PageIntro kicker="Onboarding" title="What do you have in front of you?">
        Pick one. After this you land in the workspace, with the steps on the left: Check → Match → Apply → Offer → Track.
      </PageIntro>
      <ul className="mt-8 space-y-3">
        {paths.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="kc-cream block p-5 transition hover:-translate-y-0.5"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kc-gray">{item.step}</p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight">{item.label}</h2>
              <p className="mt-2 text-sm leading-6 text-kc-ink/70">{item.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
