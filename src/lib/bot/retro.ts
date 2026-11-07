import { absoluteAppUrl } from "@/lib/app-url";
import { sendSms } from "@/lib/thrivewave";
import { getSubject, listBotQueue, listChecks, saveBotItem, updateCheck } from "@/lib/store";
import type { BotQueueItem, CheckRecord, SubjectKind } from "@/lib/types";

export type RetroAlert = {
  checkId?: string;
  botId?: string;
  phone: string;
  dryRun: boolean;
  sent: boolean;
  message: string;
};

function matchesSubject(
  check: CheckRecord,
  kind: SubjectKind,
  key: string,
): boolean {
  return check.subjects.some(
    (s) => s.kind === kind && s.key.toLowerCase() === key.toLowerCase(),
  );
}

function formatRetroSms(input: {
  checkId: string;
  reason: string;
  flagCount: number;
}): string {
  const reportUrl = absoluteAppUrl(`/checks/${input.checkId}`);
  return [
    `Kazi Check retro-alert: an identifier from an ad you checked was flagged (${input.flagCount} reports).`,
    `${input.reason.slice(0, 60)}. Don't pay.`,
    "Open full report:",
    reportUrl,
  ].join("\n");
}

/**
 * If a new registry flag (or later warning) matches an ad already checked,
 * SMS the phone stored for that check/bot item. Once per item.
 */
export async function dispatchRetroAlerts(input: {
  subjectId: string;
  reason: string;
  dryRun?: boolean;
}): Promise<RetroAlert[]> {
  const subject = await getSubject(input.subjectId);
  if (!subject) return [];

  const messageFor = (checkId: string) =>
    formatRetroSms({
      checkId,
      reason: input.reason,
      flagCount: subject.flagCount,
    });

  const alerts: RetroAlert[] = [];
  const checks = (await listChecks()).filter((c) =>
    matchesSubject(c, subject.kind, subject.key),
  );

  for (const check of checks) {
    if (check.retroAlertedAt || !check.notifyPhone) continue;
    const message = messageFor(check.id);
    if (!input.dryRun) {
      await sendSms({ phone: check.notifyPhone, message });
      await updateCheck(check.id, { retroAlertedAt: new Date().toISOString() });
    }
    alerts.push({
      checkId: check.id,
      phone: check.notifyPhone,
      dryRun: Boolean(input.dryRun),
      sent: !input.dryRun,
      message,
    });
  }

  for (const item of await listBotQueue()) {
    if (item.retroAlertedAt || !item.notifyPhone) continue;
    const check = checks.find((c) => c.id === item.checkId);
    if (!check) continue;
    const message = messageFor(check.id);
    if (!input.dryRun) {
      await sendSms({ phone: item.notifyPhone, message });
      const next: BotQueueItem = {
        ...item,
        retroAlertedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveBotItem(next);
    }
    alerts.push({
      botId: item.id,
      checkId: check.id,
      phone: item.notifyPhone,
      dryRun: Boolean(input.dryRun),
      sent: !input.dryRun,
      message,
    });
  }

  return alerts;
}
