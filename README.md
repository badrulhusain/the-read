# The Read

One npm workspace repository and one Next.js deployment for the existing frontend and backend. The components, styles, public assets, screens, and browser URLs are preserved.

## Run locally

Use Node.js 24 LTS and npm. From this directory:

```sh
npm ci
cp .env.example .env.local
# Fill in DATABASE_URL and JWT_ACCESS_SECRET, plus Cloudinary credentials for uploads.
npm run db:check
# If migrations are pending, apply them explicitly:
npm run db:migrate
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env.local` and `npm.cmd` if your execution policy blocks `npm.ps1`. Open http://localhost:3000. API requests go to http://localhost:3000/api; no API URL or second development server is needed. `npm run dev` checks migration status before starting, so a missing schema update produces a setup error instead of broken pages.

## Structure

```text
pages/                  Next.js static shell and /api catch-all
src/client/             Existing React UI, lazy routes, and styles
public/                 Original assets
packages/backend/src/   Existing NestJS controllers, services, guards, and DTOs
packages/backend/prisma/ Original schema, migrations, and seed
vercel.json             Single deployment with daily Hobby-compatible cron
```

Next.js handles hosting and API execution. The backend remains a workspace package so its validation, auth, uploads, editorial workflow, and tests keep their existing behavior. It is compiled with TypeScript first to retain Nest's decorator metadata, then loaded by the Next.js API handler. It never starts a listener or another service. The React Router UI remains client-rendered, with its existing lazy chunks; this migration does not add server-rendered article content or per-article SEO metadata.

## Deploy to Vercel Hobby

1. Push this folder as one GitHub repository and import it into Vercel.
2. Select **Next.js**, root directory **`.`**, Node.js **24.x**. The checked-in configuration uses `npm ci` and `npm run build`; keep the default `.next` output directory.
3. Add `DATABASE_URL`, `JWT_ACCESS_SECRET`, and a random `CRON_SECRET`. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable image uploads. Use the existing JWT secret if existing login sessions should remain valid.
4. Use the **transaction pooler** URL on port **6543** for runtime `DATABASE_URL`. Keep `DIRECT_URL` for migration commands; a session pooler on port 5432 also works when your machine needs IPv4. URL-encode special characters in database passwords. Never prefix secrets with `NEXT_PUBLIC_`.
5. `vercel.json` selects **Seoul (`icn1`)**, matching the confirmed existing Supabase database in `ap-northeast-2`. If you move the database, update the function region to stay close to it.
6. Deploy. Check `/api/health` returns HTTP 200 and `database: "ok"` against your configured database.

No live deployment is created by initializing this local repository. Preview deployments require their own database or a deliberate decision to share production data; cron runs only on production deployments.

### Database setup

Existing database: keep the existing connection and data. Do not import SQL dumps or reseed it for this migration. Prisma generation runs during installation/build and needs no database access. Database migrations are **not** automatically run during builds or previews.

New database, or reviewed pending migrations:

```sh
npm run db:migrate
# Only for a new database, after setting ADMIN_EMAIL / ADMIN_PASSWORD:
npm run db:seed
```

These commands use Next.js environment loading, including root `.env.local` and `.env` with the same precedence. Migrations use `DIRECT_URL` when set. Seeding is an explicit action because it writes an admin account and taxonomy records. The existing Prisma migration history is included unchanged.

Errors such as `Blog.reactionCount does not exist` or `Contributor does not exist` mean the app and database are on different migrations. Run `npm run db:check`, then `npm run db:migrate` against the intended database. Do not reset or reseed an existing database to fix missing migrations.

### Scheduled publishing on Hobby

Vercel invokes `/api/internal/maintenance` once per day at `0 3 * * *` (03:00 UTC, 08:30 India time; Hobby execution can fall within that hour). Both publishing due articles and retrying up to 25 queued media deletions complete before the function responds. `CRON_SECRET` protects the endpoint. It fails closed when the secret is absent.

Scheduled articles publish on the next daily maintenance run, potentially about a day after their requested time. Manual admin publication remains immediate. Frequent scheduling requires a paid plan or an external scheduler calling this same endpoint with `Authorization: Bearer <CRON_SECRET>`. On Pro you can change the cron expression to `*/5 * * * *` for five-minute runs.

## Performance choices

- Static frontend shell served by Next/Vercel, with the original lazy-loaded screens.
- Same-origin `/api` calls, removing cross-origin configuration and an extra backend deployment.
- One reused initialization promise and Prisma pool per warm function instance; concurrent initialization requests share it and failed initialization can retry.
- Small Postgres pool (3 connections by default, configurable with `DATABASE_POOL_MAX`, clamped to 1–10), idle connection release, and an 8-second connection timeout. The Supabase transaction pooler protects the upstream database as instances scale.
- Existing database indexes, bounded list queries, and public CDN cache headers are retained. Other responses default to `private, no-store`.
- Public article/discovery reads share a bounded, 15-second in-memory cache per function instance. Taxonomy reads use 120 seconds. Concurrent identical requests share work; errors, health checks, and private reads are not cached. Successful writes and maintenance runs clear the local cache immediately. Another function instance can serve previously published article data for at most 15 seconds.
- Prisma's `relationJoins` preview option reduces separate database round trips for nested article data. It changes query execution, without changing the database schema or public response shape. The preview setting is covered by the backend checks and live public-response comparison.
- The client shares simultaneous public reads, avoiding duplicate requests during React Strict Mode development replay. It does not retain completed results.
- No in-process cron timers, signal handlers, or redundant response compression in the backend; Vercel serves/compresses responses.

The existing upload UI limits images to 2 MB, within Vercel's request-size limit. Direct callers of the older API must also stay within Vercel's 4.5 MB total request limit.

The original in-memory API rate limiter remains per function instance. Use Vercel Firewall rules or shared rate-limit storage if you later need a global limit under heavy traffic.

## Verify

```sh
npm run build
npm run typecheck
npm test
npm run lint
npm run test:smoke
```

The smoke test starts the built production server and checks deep UI links, API routing, validation, authentication, multipart dispatch, cron authorization, and database failure handling. It deliberately uses an unreachable local database and never accesses production. A successful live `/api/health` check and real login/upload/editorial checks require your own environment values.

Backend source edits need `npm run build:backend` and a restart of the development server. UI edits hot reload normally.

For timing checks, use `npm run build` followed by `npm start`: development mode also compiles routes and runs React's extra development checks. The [database/performance verification](docs/database-performance-fix.md) records the measured limits and improvements.

## Source repositories

- https://github.com/badrulhusain/theread-client
- https://github.com/badrulhusain/the-read-backend

Original backend documentation is retained under `packages/backend/docs`. Historical setup notes are under `docs/original`; this README describes the combined deployment.
