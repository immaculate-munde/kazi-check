"use client";

import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function SeekerOnboardingPage() {
  return (
    <OnboardingFlow
      role="seeker"
      kicker="Job seeker"
      steps={[
        {
          title: "What do you have in front of you?",
          body: "We’ll put that tool first on your dashboard. You can still use the others later.",
          options: [
            {
              id: "check",
              label: "A job message or advert",
              hint: "WhatsApp, SMS, email, or a link. Start with a check.",
            },
            {
              id: "apply",
              label: "Several ads I want to apply to",
              hint: "Batch check, then open the official careers portal only.",
            },
            {
              id: "offer",
              label: "An offer letter or HR email",
              hint: "Read red flags before you accept or pay.",
            },
          ],
        },
        {
          title: "If someone asks you to pay to get the job…",
          body: "Legitimate employers in Kenya do not charge interview, training, or placement fees.",
          options: [
            {
              id: "wont-pay",
              label: "I will not pay",
              hint: "Correct. Treat a fee request as a scam signal.",
            },
            {
              id: "unsure",
              label: "I’m not sure yet",
              hint: "That’s okay. The check will flag fee language for you.",
            },
          ],
        },
      ]}
    />
  );
}
