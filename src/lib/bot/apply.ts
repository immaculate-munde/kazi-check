import { canDraft } from "@/lib/bot/gate";
import { draftApplication } from "@/lib/bot/draft";
import { getCheck, saveBotItem } from "@/lib/store";
import { memoryUpsertTracker } from "@/lib/store/memory";
import type { ApplyPacket, BotQueueItem, CheckRecord } from "@/lib/types";

function isChatUrl(url: string): boolean {
  return /whatsapp|wa\.me|t\.me|telegram/i.test(url);
}

/**
 * Apply is a first-class Proceed step.
 * Destination is always an official portal/email — never WhatsApp, never a blocked ad.
 * We do not log into third-party sites or submit forms on the user's behalf.
 */
export function buildApplyPacket(
  item: BotQueueItem,
  check: CheckRecord | null,
): { ok: true; packet: ApplyPacket } | { ok: false; error: string } {
  const confirmed = (item.confirmedGaps?.length ?? 0) > 0;
  if (!item.gate || !canDraft(item.gate, confirmed)) {
    return {
      ok: false,
      error: "Apply is blocked until the ad is eligible or every gap is confirmed.",
    };
  }
  if (item.gate === "BLOCKED" || item.verdict === "SCAM" || item.verdict === "HIGH_RISK") {
    return { ok: false, error: "Blocked ads cannot be applied to." };
  }

  const jobTitle =
    check && "jobTitle" in check.extracted ? check.extracted.jobTitle : null;
  const draftText = item.draftText ?? draftApplication(item.maskedText, jobTitle);
  const listing = check?.officialListing;

  if (listing?.result === "MATCHES_LISTING" && listing.listing?.applyUrl) {
    if (isChatUrl(listing.listing.applyUrl)) {
      return { ok: false, error: "Official apply URL looks like a chat app. Refusing." };
    }
    return {
      ok: true,
      packet: {
        mode: "official_portal",
        applyUrl: listing.listing.applyUrl,
        draftText,
        orgName: listing.listing.orgName,
        note: `Apply on ${listing.listing.orgName}'s official portal. Paste the draft there. We do not submit the form for you.`,
      },
    };
  }

  if (listing?.result === "ROUTE_MISMATCH" && listing.listing?.applyUrl) {
    return {
      ok: true,
      packet: {
        mode: "official_portal",
        applyUrl: listing.listing.applyUrl,
        draftText,
        orgName: listing.listing.orgName,
        note: `The ad used WhatsApp or a free email. Apply on the official ${listing.listing.orgName} portal instead.`,
      },
    };
  }

  return {
    ok: true,
    packet: {
      mode: "draft_only",
      draftText,
      note: "No official portal indexed for this employer. Copy the draft and apply only on a site you have confirmed yourself.",
    },
  };
}

export async function recordApply(
  item: BotQueueItem,
  packet: ApplyPacket,
): Promise<BotQueueItem> {
  const check = item.checkId ? await getCheck(item.checkId) : null;
  const employer =
    (check && "claimedOrg" in check.extracted && check.extracted.claimedOrg) ||
    packet.orgName ||
    "Unknown employer";
  const title =
    (check && "jobTitle" in check.extracted && check.extracted.jobTitle) ||
    "Application";

  const tracker = memoryUpsertTracker({
    title: String(title).slice(0, 80),
    employer: String(employer),
    source: "job-bot-apply",
    verificationResult: `${item.verdict ?? "checked"} · ${packet.mode}`,
    checkId: item.checkId,
    status: "applied",
    notes: packet.note,
  });

  const updated: BotQueueItem = {
    ...item,
    status: "applied",
    draftText: packet.draftText,
    apply: { ...packet, trackerId: tracker.id },
    updatedAt: new Date().toISOString(),
  };
  await saveBotItem(updated);
  return updated;
}
