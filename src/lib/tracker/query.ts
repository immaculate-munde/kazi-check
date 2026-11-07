/** Build `/tracker?...` URL so the form can prefill from a check/offer/skill result. */
export function trackerPrefillHref(input: {
  title?: string | null;
  employer?: string | null;
  notes?: string | null;
  checkId?: string | null;
  verificationResult?: string | null;
  source?: string | null;
  autosave?: boolean;
}): string {
  const params = new URLSearchParams();
  if (input.title?.trim()) params.set("title", input.title.trim());
  if (input.employer?.trim()) params.set("employer", input.employer.trim());
  if (input.notes?.trim()) params.set("notes", input.notes.trim());
  if (input.checkId?.trim()) params.set("checkId", input.checkId.trim());
  if (input.verificationResult?.trim()) {
    params.set("verificationResult", input.verificationResult.trim());
  }
  if (input.source?.trim()) params.set("source", input.source.trim());
  if (input.autosave) params.set("autosave", "1");
  const qs = params.toString();
  return qs ? `/tracker?${qs}` : "/tracker";
}
