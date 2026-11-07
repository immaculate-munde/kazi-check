import { NextResponse } from "next/server";
import { requestPhoneOtp } from "@/lib/profile/otp";

export const instant = false;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { phone?: string };
  const result = await requestPhoneOtp(body.phone ?? "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({
    ok: true,
    phone: result.phone,
    ...(result.stubCode ? { stubCode: result.stubCode } : {}),
  });
}
