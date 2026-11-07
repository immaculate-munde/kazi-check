import { createHash, randomInt } from "crypto";
import { prisma } from "@/lib/db";
import { prismaEnabled } from "@/lib/db";
import { normalizeKenyaPhone, sendSms } from "@/lib/thrivewave";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

type MemoryOtp = {
  phone: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
};

const g = globalThis as unknown as { __kcOtps?: Map<string, MemoryOtp> };

function mem(): Map<string, MemoryOtp> {
  g.__kcOtps ??= new Map();
  return g.__kcOtps;
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 999999));
}

export async function requestPhoneOtp(rawPhone: string): Promise<
  | { ok: true; phone: string; stubCode?: string }
  | { ok: false; error: string }
> {
  const phone = normalizeKenyaPhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Use a Kenyan number like 07XXXXXXXX or +2547XXXXXXXX." };
  }

  const code = generateOtpCode();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  if (prismaEnabled()) {
    await prisma.phoneOtp.deleteMany({ where: { phone } });
    await prisma.phoneOtp.create({
      data: { phone, codeHash, expiresAt },
    });
  } else {
    mem().set(phone, {
      phone,
      codeHash,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
    });
  }

  const sms = await sendSms({
    phone,
    message: `Kazi Check code: ${code}. Valid 10 minutes. Do not share it.`,
  });

  return {
    ok: true,
    phone,
    ...(sms.stub ? { stubCode: code } : {}),
  };
}

export async function verifyPhoneOtp(
  rawPhone: string,
  code: string,
): Promise<{ ok: true; phone: string } | { ok: false; error: string }> {
  const phone = normalizeKenyaPhone(rawPhone);
  if (!phone) {
    return { ok: false, error: "Invalid phone number." };
  }
  const trimmed = code.trim();
  if (!/^\d{6}$/.test(trimmed)) {
    return { ok: false, error: "Enter the 6-digit code from SMS." };
  }
  const expected = hashOtp(trimmed);

  if (prismaEnabled()) {
    const row = await prisma.phoneOtp.findFirst({
      where: { phone },
      orderBy: { createdAt: "desc" },
    });
    if (!row) return { ok: false, error: "No code found. Request a new one." };
    if (row.attempts >= MAX_ATTEMPTS) {
      return { ok: false, error: "Too many tries. Request a new code." };
    }
    if (row.expiresAt.getTime() < Date.now()) {
      return { ok: false, error: "Code expired. Request a new one." };
    }
    if (row.codeHash !== expected) {
      await prisma.phoneOtp.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "Wrong code. Try again." };
    }
    await prisma.phoneOtp.deleteMany({ where: { phone } });
    return { ok: true, phone };
  }

  const row = mem().get(phone);
  if (!row) return { ok: false, error: "No code found. Request a new one." };
  if (row.attempts >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many tries. Request a new code." };
  }
  if (row.expiresAt < Date.now()) {
    return { ok: false, error: "Code expired. Request a new one." };
  }
  if (row.codeHash !== expected) {
    row.attempts += 1;
    return { ok: false, error: "Wrong code. Try again." };
  }
  mem().delete(phone);
  return { ok: true, phone };
}

export function resetOtpsForTests() {
  mem().clear();
}
