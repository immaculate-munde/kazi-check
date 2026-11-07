import { NextResponse } from "next/server";
import { parseCvTextToProfile } from "@/lib/profile/parse-cv-text";
import {
  readSeekerSession,
  seekerCookieName,
} from "@/lib/profile/session";
import { getUserById, saveProfile } from "@/lib/profile/store";
import type { SeekerProfile } from "@/lib/profile/types";

export const instant = false;

function userIdFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${seekerCookieName()}=`));
  const token = match?.slice(seekerCookieName().length + 1);
  return readSeekerSession(token);
}

export async function GET(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in with phone first" }, { status: 401 });
  }
  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  return NextResponse.json({ user });
}

export async function PUT(request: Request) {
  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in with phone first" }, { status: 401 });
  }
  const body = (await request.json().catch(() => ({}))) as {
    profile?: Partial<SeekerProfile>;
    cvText?: string;
  };

  let profile: SeekerProfile;
  if (body.cvText?.trim()) {
    profile = parseCvTextToProfile(body.cvText);
  } else if (body.profile) {
    const existing = await getUserById(userId);
    profile = {
      fullName: body.profile.fullName ?? existing?.profile?.fullName ?? "",
      headline: body.profile.headline ?? existing?.profile?.headline ?? "",
      location: body.profile.location ?? existing?.profile?.location ?? "",
      summary: body.profile.summary ?? existing?.profile?.summary ?? "",
      skills: body.profile.skills ?? existing?.profile?.skills ?? [],
      experience: body.profile.experience ?? existing?.profile?.experience ?? [],
      education: body.profile.education ?? existing?.profile?.education ?? [],
      languages: body.profile.languages ?? existing?.profile?.languages ?? [],
      links: body.profile.links ?? existing?.profile?.links ?? [],
      source: body.profile.source ?? existing?.profile?.source ?? "web_form",
      rawCvText: body.profile.rawCvText ?? existing?.profile?.rawCvText ?? null,
    };
  } else {
    return NextResponse.json({ error: "Send profile or cvText" }, { status: 400 });
  }

  const saved = await saveProfile(userId, profile);
  return NextResponse.json({ profile: saved });
}
