/**
 * Canonical organization destinations shared by result UX and application
 * guidance. A Job Bot route can consume this same directory when added.
 */
export const OFFICIAL_ORGANIZATIONS = [
  {
    name: "KenGen",
    domains: ["kengen.co.ke"],
    aliases: ["kengen", "kenya electricity generating company"],
    careersUrl: "https://career.kengen.co.ke/",
    officialUrl: "https://www.kengen.co.ke/",
  },
  {
    name: "Safaricom",
    domains: ["safaricom.co.ke"],
    aliases: ["safaricom"],
    careersUrl: "https://www.safaricom.co.ke/careers",
    officialUrl: "https://www.safaricom.co.ke/",
  },
  {
    name: "Kenya Revenue Authority",
    domains: ["kra.go.ke"],
    aliases: ["kra", "kenya revenue authority"],
    careersUrl: "https://www.kra.go.ke/index.php/careers",
    officialUrl: "https://www.kra.go.ke/",
  },
  {
    name: "Equity Bank",
    domains: ["equitybank.co.ke"],
    aliases: ["equity bank", "equity"],
    careersUrl: null,
    officialUrl: "https://www.equitygroupholdings.com/",
  },
  {
    name: "KCB",
    domains: ["kcbgroup.com"],
    aliases: ["kcb", "kenya commercial bank"],
    careersUrl: "https://ke.kcbgroup.com/careers",
    officialUrl: "https://ke.kcbgroup.com/",
  },
  {
    name: "Central Bank of Kenya",
    domains: ["centralbank.go.ke"],
    aliases: ["central bank of kenya", "cbk"],
    careersUrl: "https://www.centralbank.go.ke/cbkcareers/",
    officialUrl: "https://www.centralbank.go.ke/",
  },
  {
    name: "Kenya Defence Forces",
    domains: ["mod.go.ke"],
    aliases: [
      "kdf",
      "kenya defence forces",
      "ministry of defence",
      "kenya ministry of defence",
    ],
    careersUrl: "https://mod.go.ke",
    officialUrl: "https://mod.go.ke",
  },
] as const;

/** Seeded official Kenyan domains used by the rules engine. */
export const DOMAIN_WHITELIST = Object.fromEntries(
  OFFICIAL_ORGANIZATIONS.flatMap((organization) =>
    organization.domains.map((domain) => [domain, organization.name]),
  ),
) as Record<string, string>;

export function findOfficialOrganization(value?: string | null) {
  if (!value?.trim()) return null;
  const candidate = value.toLocaleLowerCase();
  return (
    OFFICIAL_ORGANIZATIONS.find((organization) =>
      [...organization.aliases, ...organization.domains].some((alias) =>
        candidate.includes(alias.toLocaleLowerCase()),
      ),
    ) ?? null
  );
}

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
