# XenoCRM Demo Script

Full path for evaluators. Target timings: dashboard < 2s, AI stream start < 3s, WebSocket updates < 500ms.

## Prerequisites

```bash
pnpm install && cp .env.example .env
# Set GEMINI_API_KEY in .env
pnpm db:up && pnpm db:migrate:deploy && pnpm db:seed
pnpm dev
```

All three services must be running (web :3000, CRM :3001, stub :3002).

---

## 1. Dashboard (/)

- [ ] Four stat cards load
- [ ] AI insight banner shows a rule-based suggestion with CTA
- [ ] Customer health donut renders
- [ ] Recent campaigns list shows 3–5 cards
- [ ] Click **Start campaign** on insight → lands on AI Console with context

## 2. Data Hub

### Customers (`/data/customers`)

- [ ] Search by name/email works
- [ ] Filter by tag (e.g. LAPSED, VIP)
- [ ] Click **View** → customer detail with orders
- [ ] **Import CSV** → paste sample, preview rows, confirm import

### Orders (`/data/orders`)

- [ ] Filter by channel and status
- [ ] Search by customer name

## 3. AI Campaign Console (`/campaigns/new`)

**Sample prompt:**

> Target lapsed customers who haven't bought in 60+ days. Draft a WhatsApp win-back message with a 20% off offer.

- [ ] AI calls `getCustomerSegment` — segment preview appears in right panel
- [ ] AI presents draft and asks for confirmation
- [ ] Reply: **Yes, launch it**
- [ ] `fireCampaign` succeeds — live metrics panel activates
- [ ] Progress bar and event feed update within ~500ms of stub callbacks

**Stub down test:** Stop channel-stub → launch shows amber warning about dispatch failure; campaign still created.

## 4. Campaign Tracker (`/campaigns`)

- [ ] Table shows metrics (delivery, open, click, convert)
- [ ] Filter by status/channel
- [ ] Click campaign name → detail view

## 5. Campaign Detail (`/campaigns/[id]`)

- [ ] Stat cards and recipient table
- [ ] AI summary (seed campaigns have pre-written summaries; new ones generate on COMPLETED)
- [ ] **Re-run campaign** → AI Console opens with injected context

## 6. AI Performance Q&A

In AI Console, ask:

> How did last week's campaign do?

- [ ] AI uses `getCampaignStats` and references the VIP re-engagement campaign (~6 days ago in seed data)

## 7. Architecture verification

- [ ] Channel stub runs on separate port (3002)
- [ ] Stub POSTs receipts to CRM `/api/receipt` with `x-stub-secret` header
- [ ] CRM pushes WebSocket events: `recipient:update`, `campaign:progress`, `campaign:completed`

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Dashboard empty / errors | `pnpm db:up && pnpm db:seed` |
| AI chat 503 | Set `GEMINI_API_KEY` and restart CRM API |
| No live metrics | Ensure stub is running; check `CHANNEL_STUB_URL` |
| WebSocket not connecting | `NEXT_PUBLIC_WS_URL` must point to CRM API |

## Latency checklist

- [ ] Dashboard loads under 2 seconds (warm)
- [ ] First AI token streams within 3 seconds
- [ ] Recipient updates appear in live panel within 500ms of receipt
