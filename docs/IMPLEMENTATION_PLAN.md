# Kazi Check — Implementation plan (summary)

## Done in scaffold

- Next.js Positivus UI (home, check, evidence, registry)
- API routes: checks, registry, flags, SMS, USSD webhook, health
- Heuristic extract + rules engine + community flag counts
- In-memory store with seed subjects; Prisma schema ready
- Vitest smoke tests for rules

## Post-scaffold work (GitHub issues #26+)

1. Prisma persistence on RumptyCloud Postgres
2. Real LLM extract
3. Deeper rules + WHOIS
4. Real ThriveWave SMS/USSD
5. 60-ad dataset + eval
6. UI polish + deploy + CI + E2E demo script

## Seats

BE-1 · BE-2 · BE-3 · FE-1 · FE-2 · DevOps
