# S10 Window Sticker Generator

A full-stack web application that generates historically accurate, Monroney-style window stickers for Chevrolet S10 trucks (1982–2004). Users enter a VIN, review decoded vehicle data, customize options, and download a print-ready PDF sticker.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/s10-sticker run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 18 + Vite + Tailwind CSS + shadcn/ui + wouter routing
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (stickers table)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- PDF generation: pdf-lib (pure JS, no browser dependency)
- PNG export: html2canvas (client-side)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/stickers.ts` — Sticker DB table definition
- `artifacts/api-server/src/lib/s10-database.ts` — Complete S10 configuration database (1982–2004)
- `artifacts/api-server/src/lib/vin-decoder.ts` — VIN decoding logic (check digit validation + S10 position decoding)
- `artifacts/api-server/src/lib/pdf-generator.ts` — PDF generation using pdf-lib
- `artifacts/api-server/src/routes/vin.ts` — POST /api/vin/decode
- `artifacts/api-server/src/routes/s10.ts` — GET /api/s10/configs, /api/s10/configs/:year
- `artifacts/api-server/src/routes/stickers.ts` — Full CRUD + PDF generation
- `artifacts/s10-sticker/src/` — React frontend (3-step wizard, sticker preview, archive)

## Architecture decisions

- **No browser-based PDF rendering**: pdf-lib generates the PDF entirely server-side without headless Chrome or Puppeteer, avoiding dependency complexity and long startup times.
- **PDF served as base64 data URL**: Avoids file storage dependencies; PDFs are generated on demand and returned as `data:application/pdf;base64,...` for direct browser download.
- **S10 database is static in-memory**: The historical configuration data is compiled into the server bundle as a TypeScript module — no DB rows needed for configs, only for user-created stickers.
- **VIN decode uses NHTSA check digit algorithm**: Position-by-position decode extracts year (position 9), engine (position 8), assembly plant (position 10), and cab config from model code positions.
- **Sticker options stored as JSONB**: `standardEquipment` and `selectedOptions` are stored as JSONB arrays, avoiding a many-to-many join table for a document-centric use case.

## Product

- 3-step wizard: VIN entry → vehicle details review/edit → sticker preview + download
- Supports all S10 trims: Base, Tahoe, LS, ZR2 across 1982–2004
- Engines: 2.0L I4, 2.5L Tech IV, 2.8L V6, 2.2L I4 OHV, 4.3L Vortec V6
- Cab configs: Regular Cab, Extended Cab, Crew Cab (2001+)
- Drivetrain: RWD and 4WD variants
- PDF export (server-side, print-ready letter size)
- PNG export (client-side via html2canvas)
- Archive of previously generated stickers
- Share links via share tokens

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Re-run codegen after any OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- PDF data URL approach means large PDFs (~150KB base64) are returned in the JSON response body — acceptable for this use case
- VIN check digit validation is strict but some vintage vehicles have edge cases; the decoder falls back gracefully

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
