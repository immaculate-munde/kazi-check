export type CheckDirection = "job_offer" | "applicant" | "offer_letter";

export type OfferVerdict = "SAFE" | "SUSPICIOUS" | "SCAM";
export type ApplicantVerdict = "CREDIBLE" | "SUSPICIOUS" | "HIGH_RISK";
export type OfferLetterVerdict = "PROCEED" | "CAUTION" | "DO_NOT_PROCEED";
export type Verdict = OfferVerdict | ApplicantVerdict | OfferLetterVerdict;

export type RiskBand =
  | "LOW"
  | "MODERATE"
  | "SUSPICIOUS"
  | "HIGH"
  | "INSUFFICIENT_INFORMATION";

export type SubjectKind = "domain" | "phone" | "url" | "handle" | "email";

export type EvidenceItem = {
  ruleId: string;
  title: string;
  snippet: string;
  severity: "low" | "medium" | "high";
  source?: string;
  sourceType?: "content" | "registry" | "whitelist" | "community" | "heuristic";
  retrievedAt?: string;
};

export type ExtractedOffer = {
  domain?: string | null;
  jobTitle?: string | null;
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

export type ExtractedOfferLetter = {
  employer?: string | null;
  jobTitle?: string | null;
  salary?: string | null;
  startDate?: string | null;
  workplace?: string | null;
  senderEmail?: string | null;
  paymentInstructions?: string | null;
  emails: string[];
  phones: string[];
  urls: string[];
  rawSignals: string[];
};

export type Extracted =
  | ExtractedOffer
  | ExtractedApplicant
  | ExtractedOfferLetter;

export type SubjectRef = {
  id: string;
  kind: SubjectKind;
  key: string;
  flagCount: number;
  topReasons?: string[];
};

export type FlagRecord = {
  fingerprintHash: string;
  reason: string;
  createdAt: string;
};

export type CheckRecord = {
  id: string;
  direction: CheckDirection;
  rawText: string;
  url?: string | null;
  verdict: Verdict;
  score: number;
  riskScore: number;
  riskBand: RiskBand;
  recommendedAction: string;
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
  topReasons: string[];
  recentFlags: { reason: string; createdAt: string }[];
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

export type SkillLevel = "strong" | "developing" | "needs_improvement" | "missing";

export type SkillGapRow = {
  skill: string;
  requirement: "high" | "medium" | "low";
  assessment: SkillLevel;
  note: string;
};

export type SkillMatchRecord = {
  id: string;
  checkId?: string | null;
  jobTitle: string;
  jobText: string;
  cvText: string;
  compatibilityScore: number;
  gaps: SkillGapRow[];
  strongSkills: string[];
  missingSkills: string[];
  roadmap: string[];
  createdAt: string;
};

export type QuizQuestion = {
  id: string;
  domain: string;
  prompt: string;
  options: string[];
  answerIndex: number;
  explanation: string;
};

export type QuizResult = {
  id: string;
  domain: string;
  score: number;
  total: number;
  feedback: string[];
  createdAt: string;
};

export type OfferAnalysisRecord = {
  id: string;
  rawText: string;
  verdict: OfferLetterVerdict;
  riskScore: number;
  riskBand: RiskBand;
  greenFlags: EvidenceItem[];
  redFlags: EvidenceItem[];
  unresolved: string[];
  questions: string[];
  emailDraft: { subject: string; body: string };
  extracted: ExtractedOfferLetter;
  createdAt: string;
};

export type TrackerStatus =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export type TrackerItem = {
  id: string;
  title: string;
  employer: string;
  source: string;
  verificationResult: string;
  checkId?: string | null;
  status: TrackerStatus;
  notes: string;
  followUpDate?: string | null;
  createdAt: string;
  updatedAt: string;
};
