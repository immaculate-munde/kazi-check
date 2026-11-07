import { NextResponse } from "next/server";
import { absoluteAppUrl } from "@/lib/app-url";
import { prepareApplicationPack } from "@/lib/fit/prepare";
import { canPrepareForCheck } from "@/lib/fit/score";
import {
  readSeekerSession,
  seekerCookieName,
} from "@/lib/profile/session";
import { getUserById } from "@/lib/profile/store";
import { profileIsUsable } from "@/lib/profile/types";
import { getCheck } from "@/lib/store";
import { officialApplyUrl } from "@/lib/telegram/format";

export const instant = false;

type Params = Promise<{ id: string }>;

function userIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${seekerCookieName()}=`));
  const token = match?.slice(seekerCookieName().length + 1);
  return readSeekerSession(token);
}

export async function POST(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in with phone on /profile first", profileUrl: absoluteAppUrl("/profile") },
      { status: 401 },
    );
  }

  const check = await getCheck(id);
  if (!check) {
    return NextResponse.json({ error: "Check not found" }, { status: 404 });
  }
  if (!canPrepareForCheck(check)) {
    return NextResponse.json(
      { error: "This job looks too risky. We will not build a CV for it." },
      { status: 400 },
    );
  }

  const user = await getUserById(userId);
  if (!user || !profileIsUsable(user.profile)) {
    return NextResponse.json(
      {
        error: "Complete your profile first",
        profileUrl: absoluteAppUrl("/profile"),
      },
      { status: 400 },
    );
  }

  const pack = await prepareApplicationPack({
    check,
    userId,
    profile: user.profile!,
  });
  if ("blocked" in pack) {
    return NextResponse.json({ error: pack.reason }, { status: 400 });
  }

  return NextResponse.json({
    fit: pack.fit,
    fileName: pack.fileName,
    downloadUrl: absoluteAppUrl(`/api/checks/${id}/cv`),
    officialApplyUrl: officialApplyUrl(check),
    reportUrl: absoluteAppUrl(`/checks/${id}`),
  });
}
