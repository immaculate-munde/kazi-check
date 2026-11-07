"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function RecruiterOnboardingPage() {
  return (
    <OnboardingFlow
      role="recruiter"
      kicker="Recruiter"
      steps={[
        {
          title: "What do you want to do first?",
          body: "We’ll pin that on your dashboard. You can still open the registry anytime.",
          options: [
            {
              id: "applicant",
              label: "Check an applicant",
              hint: "Paste outreach, CV claims, or a suspicious message.",
            },
            {
              id: "registry",
              label: "See who others already flagged",
              hint: "Community context, not proof. Still run a check on anything new.",
            },
          ],
        },
        {
          title: "This tool never says SAFE.",
          body: "A quiet result only means we did not find major warning signs in the text you pasted. You still verify independently.",
          options: [
            {
              id: "understand",
              label: "I understand",
              hint: "Risk indicators, not a hiring decision.",
            },
          ],
        },
      ]}
    />
  );
}
