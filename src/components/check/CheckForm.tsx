"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import type { CheckDirection } from "@/lib/types";

const channels = [
  ["job-advert", "Job advert"],
  ["email", "Email"],
  ["sms", "SMS"],
  ["whatsapp", "WhatsApp"],
  ["link", "Link"],
  ["screenshot", "Screenshot"],
] as const;

type CheckChannel = (typeof channels)[number][0];

const samplePaste: Record<CheckChannel, string> = {
  "job-advert":
    "KenGen is hiring an Operations Assistant. Apply at kencareers-apply.com and pay an interview fee of KSh 2,000. Contact hr@gmail.com.",
  email:
    "Subject: Interview invitation\n\nCongratulations. Pay an interview fee of KSh 2,000 to secure your KenGen interview. Reply with your M-Pesa confirmation.",
  sms: "KRA jobs: pay an application fee of KSh 1,500 today to confirm your interview. Send M-Pesa to 0700000111.",
  whatsapp:
    "Safaricom HR: You have been shortlisted. Send a training fee today to guarantee your job placement.",
  link: "This role asks candidates to pay an application fee before an interview.",
  screenshot:
    "Screenshot text: Pay an interview fee of KSh 2,000 to secure your KenGen interview. Send M-Pesa to 0700000111.",
};

export function CheckForm({ direction }: { direction: CheckDirection }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<CheckChannel>(
    direction === "applicant" ? "email" : "job-advert",
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlInput = useRef<HTMLInputElement>(null);

  function selectChannel(next: CheckChannel) {
    setChannel(next);
    if (next === "link") window.setTimeout(() => urlInput.current?.focus(), 0);
  }

  async function onFile(file: File | null) {
    if (!file) return;
    const raw = await file.text();
    setText((prev) => (prev ? `${prev}\n\n${raw}` : raw));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim() && !url.trim()) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          direction,
          text,
          url: url.trim() || undefined,
          phone_for_sms: phone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Check failed");
      router.push(`/checks/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <BrutalCard tone="white">
      <form className="space-y-6" onSubmit={onSubmit}>
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            Where did you receive it?
          </legend>
          <div className="flex flex-wrap gap-2">
            {channels.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={channel === value}
                onClick={() => selectChannel(value)}
                className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition duration-150 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink ${channel === value ? "bg-kc-ink text-kc-on-ink" : "bg-kc-muted text-kc-ink hover:brightness-95"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {channel === "screenshot" ? (
            <p className="mt-3 rounded-xl border border-amber-700/20 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              Screenshot text recognition is not available yet. Copy the text
              from the image and paste it below.
            </p>
          ) : null}
        </fieldset>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="ad-text" className="block text-sm font-semibold">
              {direction === "applicant"
                ? "Applicant details"
                : "Message or advert text"}
            </label>
            <button
              type="button"
              onClick={() => setText(samplePaste[channel])}
              className="min-h-11 rounded-lg px-3 text-sm font-medium text-kc-ink underline decoration-kc-ink/30 underline-offset-4 hover:decoration-kc-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kc-ink"
            >
              Use sample paste
            </button>
          </div>
          <p id="ad-text-help" className="mb-3 text-sm leading-6 text-kc-gray">
            Paste the {channels
              .find(([value]) => value === channel)?.[1]
              .toLowerCase()} exactly as you received it. Personal details can
            be removed first.
          </p>
          <textarea
            id="ad-text"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-describedby="ad-text-help"
            placeholder="Paste the complete message here…"
            className="kc-field resize-y leading-7"
          />
          {!text.trim() && !url.trim() ? (
            <p className="mt-2 text-sm text-kc-gray" role="status">
              Add a message or a link to start. You can also load a sample paste.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="url" className="mb-2 block text-sm font-semibold">
            {channel === "link"
              ? "Link to check"
              : "Advert or profile link (optional)"}
          </label>
          <input
            ref={urlInput}
            id="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="kc-field"
          />
        </div>

        <div>
          <label htmlFor="file" className="mb-2 block text-sm font-semibold">
            Add a text file (optional)
          </label>
          <input
            id="file"
            type="file"
            accept=".txt,.md,.csv,.json,text/plain"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="block min-h-11 w-full text-sm file:mr-3 file:min-h-11 file:rounded-full file:border-0 file:bg-kc-muted file:px-4 file:font-medium file:text-kc-ink"
          />
          <p className="mt-2 text-sm leading-6 text-kc-gray">
            Text files only. Copy text from PDFs or screenshots before adding it.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold" htmlFor="phone">
            Phone for SMS verdict (optional)
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07XXXXXXXX"
            className="kc-field"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-900"
          >
            {error} Check your connection and try again.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="submit" variant="lime" disabled={submitting || (!text.trim() && !url.trim())}>
            {submitting ? "Checking the details…" : "Run check"}
          </Button>
          <Button
            href={
              direction === "applicant"
                ? "/check?direction=job_offer"
                : "/check?direction=applicant"
            }
            variant="outline"
          >
            Switch to {direction === "applicant" ? "job offer" : "applicant"}
          </Button>
        </div>
      </form>
    </BrutalCard>
  );
}
