# XenoCRM

AI-native mini CRM for consumer brands. Built for **Thread & Co.** — an Indian fashion brand (casual but premium).

## Product overview

XenoCRM lets marketers manage customers, run segmented campaigns, and create launches through an **AI chat interface** instead of forms. A separate **channel stub** simulates WhatsApp/SMS/email delivery with async callbacks, while the CRM API tracks recipient state in real time.

**Core flows:**
- Dashboard with rules-based AI insights
- Data Hub (customers, orders, CSV import)
- AI Campaign Console (chat → segment → confirm → launch)
- Live campaign metrics via WebSocket
- Campaign tracker with AI post-campaign summaries

## Architecture

```
┌─────────────────┐     REST/WS      ┌──────────────────┐
│  Next.js (web)  │ ◄──────────────► │  CRM API         │
│  Vercel :3000   │                  │  Railway :3001   │
└─────────────────┘                  │  Fastify+Prisma  │
                                     └────────┬─────────┘
                                              │ POST /send
                                              ▼
                                     ┌──────────────────┐
                                     │  Channel Stub    │
                                     │  Railway :3002   │
                                     └────────┬─────────┘
                                              │ POST /api/receipt
                                              └──────────────────► CRM API
```

**Monorepo:** `pnpm` workspaces + Turborepo  
**Packages:** `apps/web`, `apps/crm-api`, `apps/channel-stub`, `packages/shared`

## Local setup

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres)

### Commands

```bash
pnpm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env

pnpm db:up
pnpm db:migrate:deploy
pnpm db:seed
pnpm dev
```

| Service       | URL                    |
|---------------|------------------------|
| Web           | http://localhost:3000  |
| CRM API       | http://localhost:3001  |
| Channel stub  | http://localhost:3002  |

### Seed data

- 200 customers, 500–700 orders, 5 campaigns (mix of completed/sending)
- `SEED_ONLY=true` for reproducible demo data
- Completed campaigns include one from ~6 days ago for “last week’s campaign” queries

## Environment variables

| Variable | Service | Description |
|----------|---------|-------------|
| `DATABASE_URL` | CRM API | PostgreSQL connection string |
| `GEMINI_API_KEY` | CRM API | Google Gemini for chat + summaries |
| `CHANNEL_STUB_URL` | CRM API | Stub base URL |
| `STUB_SECRET` | CRM API + stub | Shared secret for receipt callbacks |
| `CRM_CALLBACK_URL` | Channel stub | CRM base URL for receipts |
| `CORS_ORIGIN` | CRM API | Frontend origin(s), comma-separated |
| `NEXT_PUBLIC_CRM_API_URL` | Web | CRM API URL |
| `NEXT_PUBLIC_WS_URL` | Web | WebSocket URL (same host as CRM API) |
| `SEED_ONLY` | CRM API | Reproducible seed when `true` |

See [.env.example](.env.example) for the full list.

## Deployment

| App | Platform | Config |
|-----|----------|--------|
| `apps/web` | Vercel | `apps/web/vercel.json` |
| `apps/crm-api` | Railway | `apps/crm-api/railway.toml` |
| `apps/channel-stub` | Railway | `apps/channel-stub/railway.toml` |

**Production checklist:**
1. Neon (or Railway) Postgres → `DATABASE_URL` on CRM API
2. Deploy channel stub first; set `CRM_CALLBACK_URL` + `STUB_SECRET`
3. Deploy CRM API; set `CHANNEL_STUB_URL`, `CORS_ORIGIN`, `GEMINI_API_KEY`
4. Deploy web on Vercel; set `NEXT_PUBLIC_CRM_API_URL` and `NEXT_PUBLIC_WS_URL`
5. Run `pnpm db:migrate:deploy && pnpm db:seed` against production DB (once)

## Demo script

See [docs/demo-script.md](docs/demo-script.md) for the full evaluator walkthrough.

## Tradeoffs

| Decision | Rationale |
|----------|-----------|
| **Two services (CRM + stub)** | PRD requirement; mirrors real messaging provider integration |
| **Gemini 2.0 Flash** | Fast streaming, good tool use for campaign chat |
| **Rules-based insights + optional LLM polish** | Reliable dashboard banners; Gemini only polishes copy |
| **Server-side confirmation gate** | `fireCampaign` blocked until user explicitly approves in chat |
| **Template personalization only** | `{name}` + VIP tone rules — no per-recipient LLM at send time |
| **Socket.io on CRM API** | Simpler than separate realtime service for demo scale |
| **No auth** | Assignment scope — single-user demo |

## Tests

```bash
pnpm --filter @xeno/crm-api test
```

## License

Private — Xeno engineering assignment.
