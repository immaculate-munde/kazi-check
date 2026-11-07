export const FLOW_STEPS = [
  { href: "/check?direction=job_offer", prefix: "/check", label: "Check", hint: "Paste one advert" },
  { href: "/skills", prefix: "/skills", label: "Match", hint: "CV vs the role" },
  { href: "/bot", prefix: "/bot", label: "Apply", hint: "Batch + official portal" },
  { href: "/offer", prefix: "/offer", label: "Offer", hint: "After you have a letter" },
  { href: "/tracker", prefix: "/tracker", label: "Track", hint: "Saved opportunities" },
] as const;

export const FLOW_EXTRA = {
  href: "/registry",
  prefix: "/registry",
  label: "Registry",
  hint: "Community flags",
} as const;

export function isFlowActive(pathname: string, prefix: string) {
  if (prefix === "/check") return pathname === "/check" || pathname.startsWith("/checks/");
  if (prefix === "/skills") return pathname.startsWith("/skills") || pathname === "/quiz";
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function guideFor(path: string, direction: string | null) {
  if (path === "/check" && direction === "applicant") {
    return {
      here: "Check an applicant",
      doThis:
        "Employer path. Paste the applicant’s message or claims — not a job advert you received.",
    };
  }
  if (path === "/check") {
    return {
      here: "Check an advert",
      doThis:
        "Paste the WhatsApp, SMS, or email exactly. Read the verdict first. This app never says SAFE. Then open the official careers page.",
    };
  }
  if (path.startsWith("/checks/")) {
    return {
      here: "Your result",
      doThis:
        "SCAM: do not pay, report it. Caution: confirm on the official site. Then Match your CV or Track the role.",
    };
  }
  if (path.startsWith("/bot")) {
    return {
      here: "Apply (Job Bot)",
      doThis:
        "Upload ads, pick one. BLOCKED = stop. Confirm gaps if asked. ELIGIBLE opens the official portal with a draft — never WhatsApp.",
    };
  }
  if (path === "/skills" || path.startsWith("/skills/") || path === "/quiz") {
    return {
      here: "Match skills",
      doThis:
        "Do this after a check that is not blocked. Compatibility is guidance, not a chance of hire. Quiz is optional.",
    };
  }
  if (path === "/offer" || path.startsWith("/offer/")) {
    return {
      here: "Offer letter",
      doThis:
        "Only after you have an offer or HR email. Read red flags before you accept or pay.",
    };
  }
  if (path.startsWith("/tracker")) {
    return {
      here: "Track",
      doThis: "Roles you already checked. Update status as you apply, interview, or walk away.",
    };
  }
  if (path.startsWith("/registry")) {
    return {
      here: "Registry",
      doThis: "Who others flagged. Context, not proof. Still run a Check on any new message.",
    };
  }
  return {
    here: "Workspace",
    doThis: "Verify first. Match only if the advert is usable. Apply only on an official portal.",
  };
}
