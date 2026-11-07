"use client";

import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { PageIntro } from "@/components/ui/PageIntro";
import type { TrackerItem, TrackerStatus } from "@/lib/types";

function TrackerPageInner() {
  const search = useSearchParams();
  const router = useRouter();
  const autosaved = useRef(false);

  const [items, setItems] = useState<TrackerItem[]>([]);
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [notes, setNotes] = useState("");
  const [checkId, setCheckId] = useState<string | undefined>();
  const [verificationResult, setVerificationResult] = useState("unchecked");
  const [source, setSource] = useState("manual");
  const [prefillNote, setPrefillNote] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/tracker");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const qTitle = search.get("title")?.trim() ?? "";
    const qEmployer = search.get("employer")?.trim() ?? "";
    const qNotes = search.get("notes")?.trim() ?? "";
    const qCheckId = search.get("checkId")?.trim() || undefined;
    const qVerification = search.get("verificationResult")?.trim() || "unchecked";
    const qSource = search.get("source")?.trim() || "manual";
    const shouldAutosave = search.get("autosave") === "1";

    if (!qTitle && !qEmployer && !qCheckId) return;

    setTitle(qTitle);
    setEmployer(qEmployer);
    setNotes(qNotes);
    setCheckId(qCheckId);
    setVerificationResult(qVerification);
    setSource(qSource);
    setPrefillNote(
      qTitle || qEmployer
        ? "Prefilled from your check. Review and save, or edit first."
        : null,
    );

    if (!shouldAutosave || autosaved.current) return;
    if (!qTitle || !qEmployer) return;

    autosaved.current = true;
    void (async () => {
      await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: qTitle,
          employer: qEmployer,
          notes: qNotes,
          checkId: qCheckId,
          verificationResult: qVerification,
          source: qSource,
          status: "saved",
        }),
      });
      await load();
      setPrefillNote("Saved from your check. Status starts as saved.");
      router.replace("/tracker");
    })();
  }, [search, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        employer,
        notes,
        checkId,
        verificationResult,
        source,
        status: "saved",
      }),
    });
    setTitle("");
    setEmployer("");
    setNotes("");
    setCheckId(undefined);
    setVerificationResult("unchecked");
    setSource("manual");
    setPrefillNote(null);
    router.replace("/tracker");
    load();
  }

  async function updateStatus(id: string, status: TrackerStatus) {
    const item = items.find((i) => i.id === id);
    if (!item) return;
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...item, status }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/tracker?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <PageIntro kicker="Applications" title="Track what you checked">
        Save opportunities you checked and track application, interview, and
        offer status.
      </PageIntro>

      <BrutalCard className="mt-8" tone="white">
        {prefillNote ? (
          <p className="mb-4 rounded-xl bg-kc-muted px-4 py-3 text-sm text-kc-ink">
            {prefillNote}
          </p>
        ) : null}
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            className="kc-field"
          />
          <input
            required
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Employer"
            className="kc-field"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="kc-field md:col-span-2"
          />
          <Button type="submit" variant="solid">
            Add opportunity
          </Button>
        </form>
      </BrutalCard>

      <div className="mt-8 space-y-4">
        {items.length === 0 ? (
          <p className="text-kc-gray">No saved opportunities yet.</p>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="kc-cream p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-medium">{item.title}</h2>
                  <p className="text-kc-ink/75">{item.employer}</p>
                  <p className="mt-2 text-sm">
                    Verification: {item.verificationResult}
                  </p>
                  {item.notes ? (
                    <p className="mt-1 text-sm text-kc-gray">{item.notes}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-kc-muted px-3 py-1 text-xs font-medium uppercase text-kc-ink">
                  {item.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "saved",
                    "applied",
                    "interview",
                    "offer",
                    "rejected",
                    "withdrawn",
                  ] as TrackerStatus[]
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateStatus(item.id, s)}
                    className="rounded-full border border-kc-ink/15 px-3 py-1 text-xs hover:bg-kc-muted"
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700"
                >
                  Delete
                </button>
                {item.checkId ? (
                  <Button href={`/checks/${item.checkId}`} variant="outline">
                    Open check
                  </Button>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="p-10">Loading tracker…</div>}>
      <TrackerPageInner />
    </Suspense>
  );
}
