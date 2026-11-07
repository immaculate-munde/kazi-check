"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { PageIntro } from "@/components/ui/PageIntro";

type ProfileState = {
  fullName: string;
  headline: string;
  location: string;
  summary: string;
  skills: string;
  cvText: string;
};

const empty: ProfileState = {
  fullName: "",
  headline: "",
  location: "",
  summary: "",
  skills: "",
  cvText: "",
};

export default function ProfilePage() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp" | "edit">("phone");
  const [stubHint, setStubHint] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<ProfileState>(empty);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/profile");
      if (!res.ok) return;
      const data = await res.json();
      const p = data.user?.profile;
      if (p) {
        setForm({
          fullName: p.fullName ?? "",
          headline: p.headline ?? "",
          location: p.location ?? "",
          summary: p.summary ?? "",
          skills: Array.isArray(p.skills) ? p.skills.join(", ") : "",
          cvText: p.rawCvText ?? "",
        });
      }
      setStep("edit");
    })();
  }, []);

  async function requestOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setStubHint(data.stubCode ? `Dev SMS stub — code ${data.stubCode}` : null);
      setStep("otp");
      setMessage("Code sent. Enter the 6 digits from SMS.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Wrong code");
      setStep("edit");
      setMessage("Phone verified. Save your profile below.");
      setStubHint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = form.cvText.trim()
        ? { cvText: form.cvText }
        : {
            profile: {
              fullName: form.fullName,
              headline: form.headline,
              location: form.location,
              summary: form.summary,
              skills: form.skills
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
              source: "web_form" as const,
            },
          };
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      if (data.profile) {
        setForm((f) => ({
          ...f,
          fullName: data.profile.fullName || f.fullName,
          headline: data.profile.headline || f.headline,
          skills: (data.profile.skills ?? []).join(", "),
          summary: data.profile.summary || f.summary,
        }));
      }
      setMessage("Profile saved. Check a job, then download your tailored CV on the report page or in Telegram.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kc-page mx-auto max-w-2xl space-y-6">
      <PageIntro kicker="Your profile" title="CV & match score">
        Sign in with your phone once. Upload or paste your CV. After a job check that is
        not a scam, we score your fit and give you a tailored ATS PDF — we never apply for you.
      </PageIntro>

      {step === "phone" ? (
        <BrutalCard tone="white">
          <form onSubmit={requestOtp} className="space-y-4">
            <label className="block text-sm font-medium">
              Phone number
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="07XXXXXXXX"
                required
              />
            </label>
            <Button type="submit" disabled={busy}>
              {busy ? "Sending…" : "Send SMS code"}
            </Button>
          </form>
        </BrutalCard>
      ) : null}

      {step === "otp" ? (
        <BrutalCard tone="white">
          <form onSubmit={verifyOtp} className="space-y-4">
            <label className="block text-sm font-medium">
              6-digit code
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2 tracking-widest"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                maxLength={6}
                required
              />
            </label>
            {stubHint ? <p className="text-sm text-kc-ink/70">{stubHint}</p> : null}
            <Button type="submit" disabled={busy}>
              {busy ? "Checking…" : "Verify & continue"}
            </Button>
          </form>
        </BrutalCard>
      ) : null}

      {step === "edit" ? (
        <BrutalCard tone="white">
          <form onSubmit={saveProfile} className="space-y-4">
            <label className="block text-sm font-medium">
              Paste full CV text (fastest)
              <textarea
                className="mt-1 min-h-36 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.cvText}
                onChange={(e) => setForm({ ...form, cvText: e.target.value })}
                placeholder="Paste your CV here…"
              />
            </label>
            <p className="text-xs text-kc-ink/60">Or fill the fields below if you prefer.</p>
            <label className="block text-sm font-medium">
              Full name
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Headline
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                placeholder="e.g. Customer support specialist"
              />
            </label>
            <label className="block text-sm font-medium">
              Location
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Skills (comma-separated)
              <input
                className="mt-1 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </label>
            <label className="block text-sm font-medium">
              Short summary
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-kc-ink/15 bg-white px-3 py-2"
                value={form.summary}
                onChange={(e) => setForm({ ...form, summary: e.target.value })}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save profile"}
              </Button>
              <Button href="/check" variant="outline">
                Check a job
              </Button>
            </div>
          </form>
        </BrutalCard>
      ) : null}

      {message ? <p className="text-sm text-kc-ink/80">{message}</p> : null}
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
