# Digital Tasbeeh

An offline-first digital Tasbeeh counter that remembers every tap locally and can be installed as a PWA.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/digital-tasbeeh/src/App.tsx` — the counter UI and interaction state
- `artifacts/digital-tasbeeh/src/lib/counter-storage.ts` — IndexedDB persistence
- `artifacts/digital-tasbeeh/public/manifest.webmanifest` — PWA install metadata
- `artifacts/digital-tasbeeh/public/sw.js` — offline shell and asset caching
- `artifacts/digital-tasbeeh/src/index.css` — responsive visual system

## Architecture decisions

- The core counter is fully local; it does not use the API server, a database, authentication, or network requests.
- Counts are stored as decimal strings in IndexedDB and represented as `bigint` in the UI so counting never hits JavaScript's safe-integer ceiling.
- Every change is written through a serialized persistence queue to preserve rapid taps in order.
- The service worker uses a runtime cache so the app shell and its bundled assets are available after the first successful load.

## Product

- A single, touch-first counter screen with a large circular tap target.
- Persistent local count that survives refreshes, restarts, offline use, and PWA relaunches.
- A single small reset control protected by confirmation.

## User preferences

- Keep the interface extremely minimal: count, tap button, and one reset icon only.

## Gotchas

- The PWA is intentionally local-only; do not add server persistence or make counting depend on connectivity.
- The web artifact workflow supplies `PORT` and `BASE_PATH`; use the managed workflow for preview.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
