# Database and loading fix — 27 October 2026

The configured Supabase database had six applied Prisma migrations while the application required ten. The missing migrations accounted for `Contributor`, `Blog.reactionCount`, and other current fields. The CLI also read only `.env`, whereas the running Next.js application used `.env.local`.

The CLI and seed now use Next.js environment loading. The four existing pending migrations were reviewed and applied to the configured database using Prisma's migration runner. All ten are applied, the missing table/column are present, and seven existing articles remain. No database reset or reseed was performed. The original migration files were unchanged.

`npm run db:check` checks migration status. Development startup runs it automatically and stops with setup instructions when the database is behind.

## Loading changes

- Public read results are cached in the backend for 15 seconds, with 120 seconds for taxonomy. The cache is limited to 64 entries and 512 KiB per entry.
- Identical concurrent reads share one in-flight operation. Errors and private data are excluded. Successful mutations invalidate the local cache, including pending old results. Other server instances can retain article results for at most 15 seconds.
- Prisma's documented `relationJoins` preview option loads related records with database joins, reducing network round trips. No DDL is needed for this client option.
- The frontend shares simultaneous public reads without retaining completed results. Components, markup, CSS, and assets are unchanged.
- Vercel's function region is set to Seoul (`icn1`) to match the existing database.

## Verification and timings

Measured from this machine against the configured database, through a local **production** Next.js server. The homepage makes five independent API requests. These timings describe those API requests, not a full browser load or a deployed Vercel benchmark.

| Measurement | Result |
| --- | --- |
| Before caching/join changes, five parallel homepage reads | About 1,675 ms total |
| After join changes, first uncached run including API initialization | About 1,179 ms total |
| Uncached article list, same test | 859 ms versus about 1,675 ms before |
| Cached repeat, five parallel homepage reads | 8–12 ms total |
| Warm database `SELECT 1` round trips from this machine | 130–476 ms |

The first local load still pays network and connection setup costs. Configuring the Vercel region affects future deployments; it does not relocate the database or change the network distance from this machine.

All five public endpoint responses were compared before/after joined reads and matched exactly. The production build, TypeScript check, 75 backend tests, and HTTP smoke checks passed. Lint has no errors; existing legacy warnings remain. Cache tests cover concurrent reads, expiry, error retry, invalidation during an in-flight read, query isolation, memory bounds, and mutation invalidation through the real Nest/Express runtime.
