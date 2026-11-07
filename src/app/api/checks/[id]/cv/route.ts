import { NextResponse } from "next/server";
import { getPreparedPdf, prepareApplicationPack } from "@/lib/fit/prepare";
import { canPrepareForCheck } from "@/lib/fit/score";
import {
  readSeekerSession,
  seekerCookieName,
} from "@/lib/profile/session";
import { getUserById } from "@/lib/profile/store";
import { profileIsUsable } from "@/lib/profile/types";
import { getCheck } from "@/lib/store";

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

export async function GET(
  request: Request,
  { params }: { params: Params },
) {
  const { id } = await params;
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file = await getPreparedPdf(id, userId);
  if (!file) {
    const check = await getCheck(id);
    const user = await getUserById(userId);
    if (
      check &&
      user?.profile &&
      profileIsUsable(user.profile) &&
      canPrepareForCheck(check)
    ) {
      const pack = await prepareApplicationPack({
        check,
        userId,
        profile: user.profile,
      });
      if (!("blocked" in pack)) {
        file = { fileName: pack.fileName, pdf: pack.pdf };
      }
    }
  }

  if (!file) {
    return NextResponse.json({ error: "CV not ready" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
