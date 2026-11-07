import { NextResponse } from "next/server";
import { verifyPhoneOtp } from "@/lib/profile/otp";
import { seekerCookieHeader } from "@/lib/profile/session";
import { upsertVerifiedUser } from "@/lib/profile/store";

export const instant = false;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    phone?: string;
    code?: string;
  };
  const verified = await verifyPhoneOtp(body.phone ?? "", body.code ?? "");
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 400 });
  }
  const user = await upsertVerifiedUser(verified.phone);
  const res = NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      phone: user.phone,
      hasProfile: Boolean(user.profile),
    },
  });
  res.headers.set("Set-Cookie", seekerCookieHeader(user.id));
  return res;
}
