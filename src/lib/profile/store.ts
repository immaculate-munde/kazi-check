import { prisma, prismaEnabled } from "@/lib/db";
import {
  emptyProfile,
  type SeekerProfile,
  type SeekerUser,
} from "@/lib/profile/types";

type MemoryUser = {
  id: string;
  phone: string;
  phoneVerifiedAt: string | null;
  telegramChatId: string | null;
  telegramUserId: string | null;
  profile: SeekerProfile | null;
};

const g = globalThis as unknown as { __kcUsers?: Map<string, MemoryUser> };

function mem(): Map<string, MemoryUser> {
  g.__kcUsers ??= new Map();
  return g.__kcUsers;
}

function mapProfile(raw: {
  fullName: string;
  headline: string;
  location: string;
  summary: string;
  skills: unknown;
  experience: unknown;
  education: unknown;
  languages: unknown;
  links: unknown;
  source: string;
  rawCvText: string | null;
}): SeekerProfile {
  return {
    fullName: raw.fullName,
    headline: raw.headline,
    location: raw.location,
    summary: raw.summary,
    skills: Array.isArray(raw.skills) ? (raw.skills as string[]) : [],
    experience: Array.isArray(raw.experience)
      ? (raw.experience as SeekerProfile["experience"])
      : [],
    education: Array.isArray(raw.education)
      ? (raw.education as SeekerProfile["education"])
      : [],
    languages: Array.isArray(raw.languages) ? (raw.languages as string[]) : [],
    links: Array.isArray(raw.links) ? (raw.links as string[]) : [],
    source: (raw.source as SeekerProfile["source"]) || "web_form",
    rawCvText: raw.rawCvText,
  };
}

function toSeeker(u: MemoryUser): SeekerUser {
  return { ...u };
}

export async function upsertVerifiedUser(phone: string): Promise<SeekerUser> {
  if (prismaEnabled()) {
    const row = await prisma.user.upsert({
      where: { phone },
      create: { phone, phoneVerifiedAt: new Date() },
      update: { phoneVerifiedAt: new Date() },
      include: { profile: true },
    });
    return {
      id: row.id,
      phone: row.phone,
      phoneVerifiedAt: row.phoneVerifiedAt?.toISOString() ?? null,
      telegramChatId: row.telegramChatId,
      telegramUserId: row.telegramUserId,
      profile: row.profile ? mapProfile(row.profile) : null,
    };
  }

  const existing = [...mem().values()].find((u) => u.phone === phone);
  if (existing) {
    existing.phoneVerifiedAt = new Date().toISOString();
    return toSeeker(existing);
  }
  const created: MemoryUser = {
    id: `user_${phone}`,
    phone,
    phoneVerifiedAt: new Date().toISOString(),
    telegramChatId: null,
    telegramUserId: null,
    profile: null,
  };
  mem().set(created.id, created);
  return toSeeker(created);
}

export async function linkTelegramToUser(
  userId: string,
  chatId: number,
  telegramUserId?: number,
): Promise<void> {
  const chat = String(chatId);
  const tgUser = telegramUserId != null ? String(telegramUserId) : null;
  if (prismaEnabled()) {
    await prisma.user.updateMany({
      where: { telegramChatId: chat, NOT: { id: userId } },
      data: { telegramChatId: null, telegramUserId: null },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { telegramChatId: chat, telegramUserId: tgUser },
    });
    return;
  }
  for (const u of mem().values()) {
    if (u.telegramChatId === chat && u.id !== userId) {
      u.telegramChatId = null;
      u.telegramUserId = null;
    }
  }
  const user = mem().get(userId);
  if (user) {
    user.telegramChatId = chat;
    user.telegramUserId = tgUser;
  }
}

export async function getUserByTelegramChat(
  chatId: number,
): Promise<SeekerUser | null> {
  const chat = String(chatId);
  if (prismaEnabled()) {
    const row = await prisma.user.findUnique({
      where: { telegramChatId: chat },
      include: { profile: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      phone: row.phone,
      phoneVerifiedAt: row.phoneVerifiedAt?.toISOString() ?? null,
      telegramChatId: row.telegramChatId,
      telegramUserId: row.telegramUserId,
      profile: row.profile ? mapProfile(row.profile) : null,
    };
  }
  const found = [...mem().values()].find((u) => u.telegramChatId === chat);
  return found ? toSeeker(found) : null;
}

export async function getUserById(id: string): Promise<SeekerUser | null> {
  if (prismaEnabled()) {
    const row = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      phone: row.phone,
      phoneVerifiedAt: row.phoneVerifiedAt?.toISOString() ?? null,
      telegramChatId: row.telegramChatId,
      telegramUserId: row.telegramUserId,
      profile: row.profile ? mapProfile(row.profile) : null,
    };
  }
  const found = mem().get(id);
  return found ? toSeeker(found) : null;
}

export async function saveProfile(
  userId: string,
  profile: SeekerProfile,
): Promise<SeekerProfile> {
  if (prismaEnabled()) {
    const row = await prisma.profile.upsert({
      where: { userId },
      create: {
        userId,
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        languages: profile.languages,
        links: profile.links,
        source: profile.source,
        rawCvText: profile.rawCvText ?? null,
      },
      update: {
        fullName: profile.fullName,
        headline: profile.headline,
        location: profile.location,
        summary: profile.summary,
        skills: profile.skills,
        experience: profile.experience,
        education: profile.education,
        languages: profile.languages,
        links: profile.links,
        source: profile.source,
        rawCvText: profile.rawCvText ?? null,
      },
    });
    return mapProfile(row);
  }

  const user = mem().get(userId);
  if (!user) throw new Error("User not found");
  user.profile = { ...profile };
  return user.profile;
}

export async function ensureProfile(
  userId: string,
): Promise<SeekerProfile> {
  const user = await getUserById(userId);
  if (user?.profile) return user.profile;
  return saveProfile(userId, emptyProfile());
}

export function resetProfileStoreForTests() {
  mem().clear();
}
