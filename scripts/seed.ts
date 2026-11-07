/**
 * Seed script scaffold.
 * Today: documents seed subjects (memory store loads MOCK_SEED_SUBJECTS on boot).
 * Next: prisma.domainWhitelist.createMany + subject flags when DATABASE_URL is set.
 */
import { MOCK_SEED_SUBJECTS } from "../src/lib/store/seed-data";
import { DOMAIN_WHITELIST, IMPERSONATIONS } from "../src/lib/rules/whitelist";

console.log("Kazi Check seed (scaffold)");
console.log(`Whitelist domains: ${Object.keys(DOMAIN_WHITELIST).length}`);
console.log(`Impersonation patterns: ${IMPERSONATIONS.length}`);
console.log(`Registry seed subjects: ${MOCK_SEED_SUBJECTS.length}`);
for (const s of MOCK_SEED_SUBJECTS) {
  console.log(` - [${s.flagCount} flags] ${s.kind}:${s.key}`);
}
console.log("Memory store auto-loads seed subjects at runtime.");
console.log("TODO: persist via Prisma when DATABASE_URL is configured.");
