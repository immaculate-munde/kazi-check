/**
 * Seeds Postgres when DATABASE_URL is set:
 * - DomainWhitelist
 * - Impersonation patterns
 * - Registry subjects + sample flags
 *
 * Without DATABASE_URL, prints what memory mode would load.
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { DOMAIN_WHITELIST, IMPERSONATIONS } from "../src/lib/rules/whitelist";
import { MOCK_SEED_SUBJECTS } from "../src/lib/store/seed-data";

config({ override: true });

const databaseUrl = process.env.DATABASE_URL?.trim();

async function seedPostgres() {
  const prisma = new PrismaClient();
  try {
    for (const [domain, orgName] of Object.entries(DOMAIN_WHITELIST)) {
      await prisma.domainWhitelist.upsert({
        where: { domain },
        create: { domain, orgName },
        update: { orgName },
      });
    }

    for (const row of IMPERSONATIONS) {
      const existing = await prisma.impersonation.findFirst({
        where: { fakePattern: row.fake },
      });
      if (existing) {
        await prisma.impersonation.update({
          where: { id: existing.id },
          data: {
            officialDomain: row.official,
            orgName: row.org,
          },
        });
      } else {
        await prisma.impersonation.create({
          data: {
            fakePattern: row.fake,
            officialDomain: row.official,
            orgName: row.org,
          },
        });
      }
    }

    for (const s of MOCK_SEED_SUBJECTS) {
      const subject = await prisma.subject.upsert({
        where: {
          kind_key: { kind: s.kind, key: s.key },
        },
        create: {
          kind: s.kind,
          key: s.key,
          direction: s.direction,
          flagCount: s.flagCount,
          summary: s.summary,
          lastFlaggedAt: s.lastFlaggedAt
            ? new Date(`${s.lastFlaggedAt}T00:00:00.000Z`)
            : null,
        },
        update: {
          direction: s.direction,
          flagCount: s.flagCount,
          summary: s.summary,
          lastFlaggedAt: s.lastFlaggedAt
            ? new Date(`${s.lastFlaggedAt}T00:00:00.000Z`)
            : null,
        },
      });

      for (const [i, flag] of (s.recentFlags ?? []).entries()) {
        const fingerprintHash = `seed_${s.kind}_${s.key}_${i}`;
        await prisma.flag.upsert({
          where: {
            subjectId_fingerprintHash: {
              subjectId: subject.id,
              fingerprintHash,
            },
          },
          create: {
            subjectId: subject.id,
            fingerprintHash,
            reason: flag.reason,
            createdAt: new Date(flag.createdAt),
          },
          update: {
            reason: flag.reason,
          },
        });
      }
    }

    const counts = {
      whitelist: await prisma.domainWhitelist.count(),
      impersonations: await prisma.impersonation.count(),
      subjects: await prisma.subject.count(),
      flags: await prisma.flag.count(),
    };

    console.log("Seeded Postgres:");
    console.log(`  whitelist domains: ${counts.whitelist}`);
    console.log(`  impersonation patterns: ${counts.impersonations}`);
    console.log(`  subjects: ${counts.subjects}`);
    console.log(`  flags: ${counts.flags}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("Kazi Check seed");
  if (!databaseUrl) {
    console.log("DATABASE_URL not set — memory fallback mode.");
    console.log(`Whitelist domains: ${Object.keys(DOMAIN_WHITELIST).length}`);
    console.log(`Impersonation patterns: ${IMPERSONATIONS.length}`);
    console.log(`Registry seed subjects: ${MOCK_SEED_SUBJECTS.length}`);
    for (const s of MOCK_SEED_SUBJECTS) {
      console.log(` - [${s.flagCount} flags] ${s.kind}:${s.key}`);
    }
    console.log("Set DATABASE_URL and re-run to persist.");
    return;
  }

  await seedPostgres();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
