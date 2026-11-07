"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { SectionLabel } from "@/components/ui/SectionLabel";
import type { TrackerItem, TrackerStatus } from "@/lib/types";

export default function TrackerPage() {
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [title, setTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    const res = await fetch("/api/tracker");
    const data = await res.json();
    setItems(data.items ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await fetch("/api/tracker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, employer, notes, status: "saved" }),
    });
    setTitle("");
    setEmployer("");
    setNotes("");
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
    <div className="mx-auto w-full max-w-4xl px-5 py-10 md:px-8 md:py-14">
      <SectionLabel>Application safety tracker</SectionLabel>
      <p className="mt-6 max-w-2xl text-lg text-kc-ink/80">
        Save opportunities you checked and track application, interview, and
        offer status.
      </p>

      <BrutalCard className="mt-8" tone="muted">
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job title"
            className="rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
          />
          <input
            required
            value={employer}
            onChange={(e) => setEmployer(e.target.value)}
            placeholder="Employer"
            className="rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink"
          />
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes"
            className="rounded-xl border-2 border-kc-ink bg-kc-white px-4 py-3 text-kc-ink md:col-span-2"
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
              className="rounded-kc border-2 border-kc-ink bg-kc-white p-6 shadow-brutal"
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
                <span className="rounded-full bg-kc-lime px-3 py-1 text-xs font-medium uppercase text-[#191a23]">
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
                    className="rounded-full border-2 border-kc-ink px-3 py-1 text-xs hover:bg-kc-muted"
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="rounded-full border-2 border-kc-ink px-3 py-1 text-xs text-red-600"
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
