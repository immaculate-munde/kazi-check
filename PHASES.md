# Kazi Check - Implementation Phases

> **Status**: Scaffold complete. These phases track **post-scaffold** implementation work.
> **Ref**: `docs/IMPLEMENTATION_PLAN.md` lists 6 post-scaffold items (GitHub issues #26+).
> **Goal**: Production-ready MVP for Kenya job scam prevention.

---

## Phase 0: Foundation (Week 0) — *Do First*

| Task | Owner | Done? |
|------|-------|-------|
| `docker compose up -d` — start Postgres | | ☐ |
| `cp .env.example .env` — set `DATABASE_URL` | | ☐ |
| `npx prisma migrate dev` — create tables | | ☐ |
| Replace `memory.ts` calls with Prisma Client in `run-check.ts`, `registry`, `flags`, `tracker` | | ☐ |
| Add Redis (Docker) for USSD sessions + rate limiting | | ☐ |
| Verify `npm run dev` works with persistent data | | ☐ |

**Exit criteria**: Checks persist across restarts; registry survives deploy; flags dedupe via fingerprint.

---

## Phase 1: Intelligence Upgrade (Week 1)

### 1.1 LLM Extraction (BE-3)
- [ ] Add `LLM_API_KEY` + provider (OpenAI/Gemini) to `.env`
- [ ] Implement `extractWithLlm()` in `src/lib/extract/index.ts` with JSON schema matching `Extracted` types
- [ ] Keep heuristic as fallback; add feature flag `USE_LLM_EXTRACT`
- [ ] Add prompt versioning + logging for prompt iteration

### 1.2 WHOIS / Domain Age (BE-2)
- [ ] Add `WHOIS_API_KEY` (whoisxmlapi / whoisapi / similar)
- [ ] Implement `checkDomainAge(domain)` in `rules/index.ts`
- [ ] Add evidence: `domain_age_days < 30` → HIGH severity; `< 90` → MEDIUM
- [ ] Cache results 24h (Redis)

### 1.3 M-Pesa / Payment Signal Enrichment
- [ ] Detect M-Pesa till/paybill numbers in text (regex)
- [ ] Optional: Safaricom Daraja sandbox STK push simulation for "verify this till"
- [ ] Add evidence rule: `unverified_till` → HIGH

---

## Phase 2: Auth & Abuse Prevention (Week 1-2)

| Task | Details |
|------|---------|
| Add authentication | NextAuth.js (GitHub/Google/Email magic link) or Clerk |
| Rate limit flag endpoint | 5 flags/hour per fingerprint (IP + UA hash); Redis-backed |
| Require auth for `/api/subjects/flags` | Anonymous can view registry; only authed can flag |
| Admin dashboard | View/remove flags, ban fingerprints, moderation queue |
| Privacy policy + Terms | Required for Kenya Data Protection Act compliance |

---

## Phase 3: External Integrations (Week 2)

### 3.1 ThriveWave SMS (BE-1)
- [ ] Implement real HTTP client in `src/lib/thrivewave/index.ts`
- [ ] Add webhook signature verification (`THRIVEWAVE_WEBHOOK_SECRET`)
- [ ] Handle delivery receipts + retry logic
- [ ] Test with sandbox credentials

### 3.2 ThriveWave USSD
- [ ] Move session state from in-memory `Map` → Redis (TTL 5 min)
- [ ] Implement full pipeline call from USSD text input
- [ ] Add Swahili menu option (`Lugha: 1. English 2. Kiswahili`)
- [ ] Load test: 100 concurrent sessions

---

## Phase 4: Data & Content (Week 2-3)

| Task | Priority | Seat |
|------|----------|------|
| Seed production whitelist | `domain_whitelist` table: safaricom.co.ke, kengen.co.ke, kra.go.ke, equitygroupholdings.com, kcbgroup.com, etc. | P0 | BE-2 |
| Seed impersonation patterns | `impersonation` table: `kencareers-apply.com → kengen.co.ke`, `safaricom-jobs.com → safaricom.co.ke`, etc. | P0 | BE-2 |
| Swahili/Sheng keyword rules | Add `lang: 'sw'` detection; rules for "kodi", "pesa", "haraka", "maombi" | P1 | BE-2 |
| PDF/OCR upload | Use `pdf-parse` or `tesseract.js` for file upload in CheckForm | P1 | FE-1 |
| Employer claim flow | `/claim/:domain` → email verification → publish official contacts to whitelist | P2 | FE-2 |
| **Curate 60-ad labeled dataset + eval** | Collect 60 real Kenyan job ads (30 scam / 30 legit); add eval script computing precision/recall per rule | P0 | BE-3 |

---

## Phase 5: Production Hardening (Week 3)

| Area | Tasks |
|------|-------|
| **CI/CD** | GitHub Actions: lint → test → build → deploy to RumptyCloud/Railway/Render |
| **Observability** | Sentry (errors), structured JSON logs (pino), `/api/health` with DB/Redis checks |
| **Security** | CSP headers, rate limit all API routes, sanitize all user inputs, helmet.js |
| **Performance** | `next.config.ts` image optimization, ISR for registry pages, bundle analysis |
| **Accessibility** | WCAG AA: contrast, focus states, ARIA labels, keyboard navigation |
| **RumptyCloud deploy** | Review `infra/` for RumptyCloud deploy config; provision DB + Redis + env vars |

---

## Phase 6: Growth Features (Week 4+)

| Feature | Description | Effort |
|---------|-------------|--------|
| Browser extension | Right-click → "Check with Kazi Check" on LinkedIn/BrighterMonday/MyJobMag | M |
| Employer verification portal | Companies claim domain, publish verified contacts, get "Verified Employer" badge | L |
| Job board API | `/api/v1/checks` for BrighterMonday, Fuzu, MyJobMag to pre-screen ads | M |
| Premium SMS alerts | "Alert me when this domain is flagged" → subscription (M-Pesa B2C) | M |
| Huduma/KRA sync | Periodic sync of registered companies for auto-whitelist | L |
| Analytics dashboard | Flags by region, top scam types, conversion funnel | M |

---

## Dependency Graph

```
Phase 0 (Persistence)
    │
    ├─→ Phase 1 (Intelligence) ──→ Phase 3 (Integrations)
    │                                   │
    ├─→ Phase 2 (Auth) ────────────────┤
    │                                   │
    └─→ Phase 4 (Data) ────────────────┤
                                        │
                              Phase 5 (Hardening)
                                        │
                              Phase 6 (Growth)
```

---

## Milestone Definitions

| Milestone | Criteria | Target |
|-----------|----------|--------|
| **M0: Persistent MVP** | Phase 0 complete; data survives restart | Day 1 |
| **M1: Smart MVP** | Phase 1 + 2 complete; LLM extraction, WHOIS, auth | Week 2 |
| **M2: Connected MVP** | Phase 3 complete; SMS/USSD live with ThriveWave | Week 3 |
| **M3: Launch Ready** | Phase 4 + 5 complete; production deploy, monitoring | Week 4 |
| **M4: Growth** | Phase 6 features shipping | Month 2+ |

---

## Resource Requirements (Seat Mapping)

| Role | Phase 0-1 | Phase 2-3 | Phase 4-5 | Maps to |
|------|-----------|-----------|-----------|---------|
| Backend (Node/Next.js) | 1 | 1 | 1 | BE-1, BE-2, BE-3 |
| ML/LLM Engineer | 0.5 | 0.5 | 0 | BE-3 |
| DevOps | 0 | 0.5 | 1 | DevOps |
| Designer/Swahili | 0 | 0 | 0.5 | FE-1, FE-2 |
| QA/Testing | 0 | 0.5 | 1 | QA |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ThriveWave sandbox not available | Medium | High | Build full stub mode; test with mock webhook |
| LLM extraction hallucinates | High | Medium | Strict JSON schema; confidence threshold; fallback to heuristic |
| WHOIS API rate limits | Medium | Low | Cache 24h; batch checks; fallback to "unknown" |
| Flag spam/abuse | High | High | Fingerprint + auth + rate limit + admin moderation |
| Kenya DPA non-compliance | Low | Critical | Privacy policy, consent, data retention, DPO contact |
| USSD session loss on deploy | High | Medium | Redis-backed sessions from Phase 0 |

---

## Quick Start Commands

```bash
# Phase 0
docker compose up -d
cp .env.example .env
# Edit .env → DATABASE_URL=postgresql://postgres:postgres@localhost:5432/kazi_check
npx prisma migrate dev --name init
npm run dev

# Verify
curl -X POST http://localhost:3000/api/checks \
  -H "Content-Type: application/json" \
  -d '{"direction":"job_offer","text":"Interview fee 5000 via M-Pesa for KenGen role hr@gmail.com"}'
# → Should return check ID; refresh page → data persists
```

---

## Definition of Done (per Phase)

- [ ] All tasks checked
- [ ] `npm test` passes (add tests for new logic)
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke test on `localhost:3000`
- [ ] Updated `PHASES.md` with actual completion dates
