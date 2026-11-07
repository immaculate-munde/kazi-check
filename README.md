# Kazi Check

Two-way recruitment trust for Kenya: **verify job offers**, **verify applicants**, and **community-flag** scam recruiters so the next person sees **“N people flagged this as scam.”**

## Stack

- **Next.js** (App Router) + TypeScript + Tailwind CSS
- UI: [Positivus](https://www.figma.com/community/file/1230604708032389430/positivus-landing-page-design)
- API Route Handlers + in-memory store (Prisma schema ready for Postgres)
- ThriveWave SMS/USSD stubs · RumptyCloud deploy notes in `infra/`

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test
npm run seed
```

Optional Postgres (when wiring Prisma persistence):

```bash
docker compose up -d
cp .env.example .env   # set DATABASE_URL
npx prisma migrate dev
```

## API (scaffolded)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Health |
| POST | `/api/checks` | Run extract → rules → verdict |
| GET | `/api/checks/[id]` | Fetch check |
| POST | `/api/checks/[id]/sms` | ThriveWave SMS (stub without keys) |
| GET | `/api/registry` | List subjects (`?direction=`) |
| GET | `/api/registry/[subjectId]` | Subject detail |
| POST | `/api/subjects/flags` | Community flag (+ fingerprint dedupe) |
| POST | `/api/webhooks/thrivewave/ussd` | USSD menu webhook |

## App routes

| Route | Pillar |
|-------|--------|
| `/check` · `/checks/[id]` | Verify (pre-application) |
| `/skills` · `/quiz` | Match |
| `/offer` · `/offer/[id]` | Post-offer check + email draft |
| `/tracker` | Application safety tracker |
| `/registry` | Community flags **with reasons** |

## Team work

Scaffold is complete. GitHub issues should track **post-scaffold** implementation (real LLM, Prisma persistence, ThriveWave HTTP, WHOIS, datasets, RumptyCloud go-live), not re-scaffolding.
