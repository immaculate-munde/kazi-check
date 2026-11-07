export type CheckDirection = "job_offer" | "applicant";

export type OfferVerdict = "SAFE" | "SUSPICIOUS" | "SCAM";
export type ApplicantVerdict = "CREDIBLE" | "SUSPICIOUS" | "HIGH_RISK";
export type Verdict = OfferVerdict | ApplicantVerdict;

export type SubjectKind = "domain" | "phone" | "url" | "handle" | "email";

export type EvidenceItem = {
  ruleId: string;
  title: string;
  snippet: string;
  severity: "low" | "medium" | "high";
};

export type ExtractedOffer = {
  domain?: string | null;
  salary?: string | null;
  contactMethod?: string | null;
  paymentTerms?: string | null;
  claimedOrg?: string | null;
  emails: string[];
  phones: string[];
  urls: string[];
  rawSignals: string[];
};

export type ExtractedApplicant = {
  claimedEmployer?: string | null;
  claimedEducation?: string | null;
  emails: string[];
  phones: string[];
  links: string[];
  feeAsks: string[];
  rawSignals: string[];
};

export type Extracted = ExtractedOffer | ExtractedApplicant;

export type SubjectRef = {
  id: string;
  kind: SubjectKind;
  key: string;
  flagCount: number;
};

export type CheckRecord = {
  id: string;
  direction: CheckDirection;
  rawText: string;
  url?: string | null;
  verdict: Verdict;
  score: number;
  extracted: Extracted;
  evidence: EvidenceItem[];
  subjects: SubjectRef[];
  createdAt: string;
};

export type RegistrySubject = {
  id: string;
  kind: SubjectKind;
  key: string;
  direction: CheckDirection | null;
  flagCount: number;
  summary: string;
  lastFlaggedAt: string | null;
};

export type CreateCheckInput = {
  direction: CheckDirection;
  text?: string;
  url?: string;
  phone_for_sms?: string;
};

export type FlagInput = {
  kind?: SubjectKind;
  key?: string;
  checkId?: string;
  reason?: string;
  fingerprintHash: string;
};
