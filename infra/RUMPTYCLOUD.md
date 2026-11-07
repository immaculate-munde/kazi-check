# RumptyCloud deploy notes

1. Create workspace + managed Postgres.
2. New Deployment → connect `immaculate-munde/kazi-check` → Web Service / Next.js.
3. Set env vars from `.env.example` (`DATABASE_URL`, `LLM_*`, `THRIVEWAVE_*`, `NEXT_PUBLIC_APP_URL`).
4. Health check path: `/api/health`
5. Build: `npm install && npx prisma generate && npm run build`
6. Start: `npm run start` (binds via Rumpty/Next defaults; ensure `PORT` if required)

Until Prisma is migrated, the app uses the in-memory store (seed subjects included).
