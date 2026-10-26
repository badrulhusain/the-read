# Migration verification

Verified locally on 26 October 2026. Production credentials and services were not accessed.

| Check | Result |
| --- | --- |
| Production Next.js build | Passed; static frontend and one API function |
| TypeScript | Passed for frontend and backend |
| Backend tests | 69 passed across 6 suites |
| Lint | No errors; 20 existing warnings in legacy UI and original tests |
| Lockfile installation | `npm ci --dry-run --ignore-scripts` passed |
| Production HTTP smoke | Deep links, API dispatch, validation, auth, multipart dispatch, cron protection, and database failure handling passed |
| Deployment trace | Includes compiled backend, generated Prisma client, and bcrypt native dependency; about 15.7 MiB locally |
| UI source comparison | Components, CSS, and all 5 public assets unchanged |
| Browser | Chrome, desktop 1440 px and mobile 390 px; no uncaught exceptions or horizontal overflow |

The three changed client files are `App.tsx` (global CSS import moved to Next's `_app`), `lib/api.ts`, and `features/the-read/api.ts` (same-origin API URLs). Vite's startup and environment declarations were replaced by Next's entry points.

## Database integration

A disposable local Prisma Postgres database was used. The Supabase platform roles `anon` and `authenticated` were added to that test database because the original migrations refer to them. All 10 original migrations then applied successfully, without modifying migration files.

Using the built Next.js server and that database, these operations passed:

- Readiness query (`SELECT 1`), registration, login, profile lookup, and role authorization.
- Admin user listing, draft creation, autosave, and rejection of a stale revision.
- Published article listing/detail and the existing UI's category/tag ID filters.
- Saved articles, reactions, reading history, and authenticated cron execution.

A published article was seeded directly into the disposable database for the read tests. This does not claim a full manual editorial approval journey was tested. Existing workflow unit tests passed.

Browser checks covered home, archive, article detail, login, and authenticated admin users. All 18 observed API requests stayed on the application origin.

## Remaining environment checks

No Vercel deployment has been made. Production database reachability, Cloudinary image delivery/upload, and Vercel's actual cron invocation require the user's service environment values. Use the root README for deployment setup; `/api/health` must return HTTP 200 after configuration.

The existing frontend remains a client-rendered React Router app hosted by Next.js. Backend logic remains in a compiled NestJS workspace package executed by the Next.js API handler. There is one deployment and no separate backend process.
