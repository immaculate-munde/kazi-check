/** Seeded official Kenyan org domains — expand via seed script / DB. */
export const DOMAIN_WHITELIST: Record<string, string> = {
  "kengen.co.ke": "KenGen",
  "safaricom.co.ke": "Safaricom",
  "kra.go.ke": "Kenya Revenue Authority",
  "equitybank.co.ke": "Equity Bank",
  "kcbgroup.com": "KCB",
  "centralbank.go.ke": "Central Bank of Kenya",
};

/** Known lookalike / impersonation patterns → official domain. */
export const IMPERSONATIONS: { fake: string; official: string; org: string }[] = [
  {
    fake: "kencareers-apply.com",
    official: "kengen.co.ke",
    org: "KenGen",
  },
  {
    fake: "safaricom-jobs.com",
    official: "safaricom.co.ke",
    org: "Safaricom",
  },
  {
    fake: "kra-recruitment.com",
    official: "kra.go.ke",
    org: "Kenya Revenue Authority",
  },
];
