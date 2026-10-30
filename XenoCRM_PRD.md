# XenoCRM — Product Requirements Document
### AI-Native Mini CRM for Consumer Brands
**Version 1.0 | Assignment Build**

---

## A Note to the Builder (Cursor / AI Agent)

This PRD describes the product vision, architecture, features, data model, and implementation requirements for XenoCRM. You have **full freedom** to:

- Suggest a better tech stack if you believe an alternative is more efficient, performant, or faster to ship
- Propose UI/UX patterns not described here if you believe they serve the product better
- Add features that feel natural and strengthen the product
- Challenge any assumption in this document if you have a strong reason

What you must preserve: the **core product concept**, the **two-service architecture** (CRM + stub channel service), the **AI-native chat interface**, and the **real-time callback tracking loop**. Everything else is open to your judgment.

Please flag any deviation from this PRD with a short comment explaining why you made the change.

---

## 1. Product Overview

### 1.1 What We're Building

XenoCRM is an AI-native mini CRM designed for Direct-to-Consumer and retail brands (fashion, coffee, beauty, etc.) to intelligently reach their shoppers. The product helps a brand marketer decide **who to talk to**, **what to say**, and **reach them** over messaging channels — and then understand how those communications performed.

The key design philosophy: **the AI is the primary interface, not an add-on.** The marketer doesn't fill out forms to create campaigns. They talk to an AI assistant that understands their customer data, segments audiences, drafts messages, and executes campaigns — with the marketer confirming before anything goes out.

Think of it as: *Shopify's customer data foundation + an AI brain that does the marketing thinking for you.*

### 1.2 The Problem It Solves

Existing CRM and marketing tools (Shopify Email, Klaviyo, Mailchimp) are form-based and manual. The marketer must:
- Manually define segment conditions
- Write all message copy themselves
- Decide which channel to use
- Interpret analytics to understand what worked

XenoCRM replaces all of this with a conversational AI that can do all four — while the marketer stays in control through a confirmation gate before anything is sent.

### 1.3 The Target User

A marketer at a small-to-mid consumer brand. Not highly technical. Knows their customers intuitively but doesn't want to write SQL or configure complex filters. Wants to move fast and have confidence the right people are being reached.

---

## 2. Core Product Principles

1. **AI-first, not AI-bolted-on.** The AI chat is the primary way to interact with campaigns, not a sidebar feature.
2. **Human confirms, AI executes.** The AI never sends a campaign without explicit marketer approval.
3. **Real-time feedback.** When a campaign goes out, the marketer sees it happening live.
4. **Proactive intelligence.** The AI doesn't wait to be asked — it surfaces opportunities and risks on its own.
5. **Zero setup friction.** The app ships with pre-seeded realistic data. Evaluators and users can use it immediately without importing anything.

---

## 3. Architecture Overview

### 3.1 Two-Service Architecture (Required — Do Not Collapse Into One)

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│         CRM Service          │         │     Channel Stub Service      │
│                             │ ──────► │                              │
│  - Customer/Order data      │  Send   │  - Accepts send requests     │
│  - Segmentation engine      │  API    │  - Simulates delivery        │
│  - Campaign management      │         │  - Fires async callbacks     │
│  - AI chat interface        │ ◄────── │    per recipient             │
│  - Receipt/callback API     │Callbacks│  - Realistic outcome rates   │
│  - Real-time push (WS)      │         │                              │
└─────────────────────────────┘         └──────────────────────────────┘
         │
         │ WebSocket
         ▼
┌─────────────────────────────┐
│       Frontend (Next.js)    │
│  - Data Hub                 │
│  - AI Campaign Console      │
│  - Campaign Tracker         │
│  - Dashboard                │
└─────────────────────────────┘
```

### 3.2 Communication Flow

1. Marketer confirms campaign in chat UI
2. CRM backend sends batch payload to Channel Stub Service's `/send` endpoint
3. Stub service responds 200 immediately (accepted)
4. Stub service asynchronously (with randomised delays, 2–30 seconds) POSTs individual callbacks to CRM's `/receipt` endpoint for each recipient
5. CRM ingests each callback, updates DB status, pushes update via WebSocket to frontend
6. Frontend live metrics panel updates in real time

### 3.3 Suggested Tech Stack

The following is a recommendation. **If you have strong reasons to use a different stack, do so and explain why.**

| Layer | Suggested | Rationale |
|---|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind + shadcn/ui | Fast to build, great DX, Vercel deploy |
| Backend (CRM) | Node.js + Express or Fastify | Lightweight, fast WebSocket support |
| Backend (Stub) | Node.js + Express | Separate deployable, simple async callbacks |
| Database | PostgreSQL via Supabase | Free tier, managed, Prisma-compatible |
| ORM | Prisma | Clean schema, migrations, type safety |
| Real-time | Socket.io or native WebSocket | Push callback updates to frontend |
| AI | Any capable LLM API (OpenAI, Anthropic, Gemini, etc.) | Choose what you're most comfortable with |
| Hosting (Frontend) | Vercel | Free, instant, great for Next.js |
| Hosting (Backend) | Railway or Render | Free tier, simple deploys |

**If you believe a different stack (e.g. FastAPI + Python for the backend given AI integrations, or a BaaS like Convex or PlanetScale instead of Supabase) would be better — go for it and note why.**

---

## 4. Data Model

Below is the required schema. You may extend it with additional fields or tables. Do not remove required fields.

### 4.1 Customer

```
id              UUID, primary key
name            String
email           String, unique
phone           String, nullable
totalSpend      Float, default 0
orderCount      Int, default 0
lastPurchaseAt  DateTime, nullable
tag             Enum: NEW | REGULAR | VIP | LAPSED | AT_RISK
city            String, nullable
ageGroup        String, nullable  // "18-24", "25-34", etc.
gender          String, nullable
createdAt       DateTime
```

### 4.2 Order

```
id              UUID, primary key
customerId      UUID, FK → Customer
items           JSON  // [{name, quantity, price}]
totalValue      Float
channel         Enum: ONLINE | IN_STORE | APP
status          Enum: COMPLETED | RETURNED | PENDING
createdAt       DateTime
```

### 4.3 Campaign

```
id                  UUID, primary key
name                String
goal                String  // natural language goal, e.g. "win back lapsed customers"
segmentDefinition   JSON    // {filters: [...], description: "..."}
segmentSize         Int
messageTemplate     String
channel             Enum: WHATSAPP | SMS | EMAIL | RCS
status              Enum: DRAFT | SENDING | ACTIVE | COMPLETED | FAILED
aiSummary           String, nullable  // post-campaign AI analysis
createdAt           DateTime
completedAt         DateTime, nullable
```

### 4.4 CampaignRecipient

```
id              UUID, primary key
campaignId      UUID, FK → Campaign
customerId      UUID, FK → Customer
personalizedMsg String   // the actual message sent to this specific customer
status          Enum: QUEUED | SENT | DELIVERED | FAILED | OPENED | CLICKED | CONVERTED
sentAt          DateTime, nullable
deliveredAt     DateTime, nullable
openedAt        DateTime, nullable
clickedAt       DateTime, nullable
convertedAt     DateTime, nullable
failureReason   String, nullable
```

### 4.5 AIConversation

```
id          UUID, primary key
messages    JSON  // [{role: "user"|"assistant", content: "...", timestamp: "..."}]
campaignId  UUID, nullable, FK → Campaign  // if this conversation led to a campaign
createdAt   DateTime
```

---

## 5. Feature Specifications

### 5.1 Screen 1: Dashboard (Home)

**Purpose:** At-a-glance overview of the brand's CRM health and AI-surfaced opportunities.

**Components:**

**Top Stats Row**
- Total Customers
- Total Revenue (sum of all order values)
- Active Campaigns
- Avg Open Rate across all campaigns

**AI Insight Banner**
- A highlighted card at the top with a proactive AI observation
- Examples:
  - "127 customers haven't purchased in 60+ days. Consider a win-back campaign."
  - "Your VIP segment (top 10% spenders) hasn't been contacted in 45 days."
  - "Last Friday's campaign had a 52% open rate — your best ever."
- "Start Campaign" CTA that opens the AI console pre-filled with context

**Recent Campaigns**
- Last 3-5 campaigns as cards
- Each card: campaign name, channel, date, key metric (open rate or click rate), status badge

**Customer Health Breakdown**
- Simple visual (donut chart or bar) showing: New / Regular / VIP / Lapsed / At-Risk split

---

### 5.2 Screen 2: Data Hub

**Purpose:** Browse, search, and manage customer and order data. Import new data.

**Tabs: Customers | Orders**

**Customers Tab**
- Table with columns: Name, Email, Phone, Tag (coloured badge), Total Spend, Order Count, Last Purchase, Actions
- Search by name or email
- Filter by Tag (multi-select)
- Sort by Total Spend, Order Count, Last Purchase (asc/desc)
- "Import CSV" button — accepts CSV with columns: name, email, phone, city, ageGroup, gender
- Click row → Customer Detail Panel (slide-over or new page):
  - Full customer info
  - Order history table
  - Tag and spend summary
  - "Create Campaign for this customer" shortcut

**Orders Tab**
- Table: Order ID (short), Customer Name, Items (truncated), Value, Channel, Status, Date
- Filter by channel and status
- Search by customer name

**CSV Import Behaviour**
- Accepts file, parses, validates required fields (name + email minimum)
- Shows preview of first 5 rows before confirming import
- On import: creates Customer records, calculates tag based on order history if orders are also imported
- Gracefully handles duplicates (match on email, update rather than create)

---

### 5.3 Screen 3: AI Campaign Console

**Purpose:** The centrepiece of the product. Chat-first campaign creation with live metrics.

**Layout: Split screen**
- Left 60%: Chat interface
- Right 40%: Live Campaign Metrics Panel

#### 5.3.1 Chat Interface

**Behaviour:**
- Standard chat UI (user messages right-aligned, AI messages left-aligned)
- AI has full read access to the customer and order database
- AI can perform these actions in conversation:
  - Segment customers based on natural language description
  - Show segment preview (inline mini-table: first 5 customers + total count)
  - Draft campaign message copy
  - Suggest channel (WhatsApp, SMS, Email, RCS) with reasoning
  - Fire campaign (only after explicit confirmation)
  - Answer questions about existing campaigns and their performance
  - Proactively recommend campaigns

**Example conversation flows the AI must handle:**

Flow 1 — Marketer-initiated:
```
Marketer: "Find customers who spent over 3000 but haven't bought in 45 days"
AI: "Found 89 customers matching that. [shows mini-table]. These are high-value 
     customers showing early churn signals. Want me to create a win-back campaign for them?"
Marketer: "Yes, on WhatsApp"
AI: "Here's a draft message: [shows message]. This campaign would reach 89 customers 
     on WhatsApp. Should I send it?"
Marketer: "Change the tone to be more urgent"
AI: "Updated: [shows revised message]. Ready to send to 89 customers on WhatsApp. Confirm?"
Marketer: "Yes send it"
AI: "Campaign launched. Tracking delivery in the panel on the right →"
```

Flow 2 — AI-initiated recommendation:
```
AI: "Hey — I noticed you have 234 customers who made their first purchase 
     over 30 days ago but never returned. That's a big re-engagement opportunity. 
     Want me to put together a second-purchase nudge campaign?"
Marketer: "Sure, what would the message look like?"
AI: [drafts message, continues flow]
```

Flow 3 — Performance query:
```
Marketer: "How did last week's campaign do?"
AI: "Your 'Summer Win-Back' campaign reached 89 customers on WhatsApp. 
     76 delivered (85%), 41 opened (46%), 12 clicked (13%), and 6 placed 
     an order (7%). That's above your average open rate. The urgency angle 
     in the message likely helped."
```

**Confirmation Gate (Required):**
The AI must NEVER fire a campaign without one of these exact phrases from the marketer:
- "yes", "yes send it", "send it", "confirm", "go ahead", "do it"

The AI must explicitly ask "Should I send this?" or "Ready to send — confirm?" before firing.

**Message Personalisation:**
When a campaign fires, the AI should personalise the message per recipient where possible:
- Replace `{name}` with actual customer name
- Optionally adjust tone slightly based on customer tag (VIP gets more premium language)

#### 5.3.2 Live Metrics Panel (Right Side)

**Default state (no active campaign):** Shows the most recent campaign's final stats, or an empty state with "Launch a campaign in the chat to see live tracking."

**When a campaign is firing:**
- Campaign name and channel badge at top
- Progress bar: X of Y messages sent
- Live stat cards updating in real time:
  - Sent (count + %)
  - Delivered (count + %)
  - Opened (count + %)
  - Clicked (count + %)
  - Converted (count + %)
  - Failed (count + %)
- Live feed: last 5 callback events as they arrive ("Priya Mehta — Opened", "Rahul Singh — Clicked")
- Status: SENDING → COMPLETED when all callbacks are received

---

### 5.4 Screen 4: Campaign Tracker

**Purpose:** Historical view of all campaigns with drill-down.

**Campaign List View**
- Table: Campaign Name, Channel, Segment Description, Size, Date, Delivery %, Open %, Click %, Converted %, Status
- Filter by status and channel
- Sort by date or performance metrics
- Click row → Campaign Detail

**Campaign Detail View**
- Header: Campaign name, date, channel, status
- AI Summary card (generated after campaign completes): natural language paragraph explaining performance and recommendations
- Aggregate stats: Sent, Delivered, Opened, Clicked, Converted, Failed — with % and absolute numbers
- Per-recipient table: Customer Name, Status, Timestamps (sent at, opened at, clicked at), personalised message preview
- "Re-run Campaign" button — re-evaluates segment dynamically (picks up newly eligible customers) and opens in chat for confirmation

---

## 6. AI System Behaviour

### 6.1 What the AI Must Be Able To Do

The AI assistant has access to all customer and order data via function/tool calls. It must be able to:

1. **Query customers** by any combination of: spend thresholds, order count, last purchase date, tag, city, age group, channel preference
2. **Explain its reasoning** — not just return a segment but say why these customers are a good target
3. **Draft message copy** appropriate to the brand tone, the channel (WhatsApp is casual, Email can be longer), and the campaign goal
4. **Suggest channel** based on data available (prefer WhatsApp if phone exists, email as fallback)
5. **Generate campaign names** automatically
6. **Answer performance questions** about past campaigns in natural language
7. **Proactively recommend** campaigns based on patterns it detects in the data

### 6.2 AI Tool Calls / Function Calls

The AI backend should implement these as callable functions:

```
getCustomerSegment(filters)
  → Returns list of customers matching filter criteria

getCampaignStats(campaignId?)
  → Returns performance stats for one or all campaigns

getCustomerProfile(customerId)
  → Returns full customer detail

getChurnRiskCustomers(daysSinceLastPurchase, minSpend?)
  → Returns customers at churn risk

getTopSpenders(limit, daysSinceLastPurchase?)
  → Returns top customers by spend

fireCampaign(segmentFilters, message, channel, campaignName)
  → Creates campaign, queues sends, triggers channel stub service
```

### 6.3 Proactive Suggestions

On app load (dashboard) and periodically in the chat (every few minutes of inactivity), the AI should proactively surface one insight. Logic:

- If any tag=LAPSED count > 50: suggest win-back campaign
- If VIP customers haven't been in a campaign in 30+ days: suggest VIP loyalty message
- If last campaign open rate > 40%: congratulate and suggest follow-up to non-openers
- If new customers (tag=NEW, created in last 7 days) > 20: suggest welcome campaign

---

## 7. Channel Stub Service Specification

### 7.1 Endpoints

**POST /send**
Accepts: `{ campaignId, recipients: [{recipientId, customerId, phone, email, message, channel}] }`
Returns: `{ accepted: true, jobId: UUID }` immediately

**Internal async behaviour after accepting:**
For each recipient, after a random delay (2000ms to 25000ms), POST to CRM's `/api/receipt`:
```json
{
  "recipientId": "...",
  "campaignId": "...",
  "customerId": "...",
  "event": "delivered" | "failed" | "opened" | "clicked" | "converted",
  "timestamp": "ISO string"
}
```

Callbacks fire in sequence per recipient (delivered first, then opened if applicable, etc.) with additional delays between events.

### 7.2 Simulated Outcome Rates

Apply these probabilistically per recipient:

| Event | Probability |
|---|---|
| delivered (given sent) | 88% |
| failed (given sent) | 12% |
| opened (given delivered) | 45% |
| clicked (given opened) | 35% |
| converted (given clicked) | 45% |

For WhatsApp channel, bump opened rate to 60% (WhatsApp has higher engagement).

### 7.3 Failure Simulation

For the 12% failed: randomly assign a failureReason:
- "invalid_number" (40% of failures)
- "user_opted_out" (30% of failures)
- "network_timeout" (30% of failures)

### 7.4 Retry Simulation

For network_timeout failures, the stub service should retry once after 5 seconds and potentially succeed on the second attempt (50% chance). The CRM should handle receiving the same recipientId twice gracefully (idempotent).

---

## 8. Seed Data Requirements

The app must be pre-seeded with realistic data so it is usable immediately without any imports.

**Customers: 200 records**
- Realistic Indian names (this brand is India-focused)
- Mix of tags: ~15% NEW, ~45% REGULAR, ~15% VIP, ~20% LAPSED, ~5% AT_RISK
- Realistic spend distribution: NEW (500-3000), REGULAR (3000-15000), VIP (15000-80000), LAPSED (2000-20000)
- Mix of cities: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata
- Age groups: 18-24, 25-34, 35-44, 45-54

**Orders: 500-700 records**
- Linked to customers (VIPs have more orders, LAPSED have older last orders)
- Realistic items (clothing, accessories, shoes for a fashion brand)
- Mix of channels (70% online, 20% app, 10% in-store)
- Date range: last 18 months (LAPSED customers have nothing in last 60 days)

**Campaigns: 5 historical campaigns**
- With realistic CampaignRecipient records and varied statuses
- So the Campaign Tracker screen has data immediately
- Include one campaign from 7 days ago so AI can reference "last week's campaign" in demos

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Dashboard must load in under 2 seconds
- AI chat responses must start streaming within 3 seconds
- WebSocket updates for callbacks must reflect in the UI within 500ms of receipt

### 9.2 Error Handling
- If AI fails to parse a natural language query, respond gracefully: "I didn't quite get that. Could you rephrase? For example: 'Find customers who haven't bought in 30 days'"
- If channel stub service is unreachable, show error in chat: "Campaign queued but channel service is currently unavailable. Will retry."
- CSV import errors should show per-row validation feedback, not crash the import

### 9.3 Deployment
- Both services (CRM backend and Channel Stub) must be deployed and publicly accessible
- Frontend must be deployed on a public URL
- Environment variables must be documented in README
- A `.env.example` file must be included

### 9.4 README Requirements
- What the product does (2-3 sentences)
- Architecture diagram (can be ASCII or image)
- Setup instructions (local and deployed)
- Seed data instructions
- Environment variables list
- Any tradeoffs or conscious choices made

---

## 10. Screens Summary

| Screen | Route | Primary Purpose |
|---|---|---|
| Dashboard | `/` | Overview, AI insights, recent campaigns |
| Data Hub — Customers | `/data/customers` | Browse, search, import customers |
| Data Hub — Orders | `/data/orders` | Browse orders |
| Customer Detail | `/data/customers/[id]` | Individual customer profile |
| AI Campaign Console | `/campaigns/new` | Chat-first campaign creation + live tracking |
| Campaign Tracker | `/campaigns` | All campaigns, stats, drill-down |
| Campaign Detail | `/campaigns/[id]` | Per-campaign analytics and AI summary |

---

## 11. What NOT to Build

To keep scope focused and quality high, explicitly do not build:

- User authentication / login (single-user app is fine for this assignment)
- Multi-brand or multi-tenant support
- Actual integration with any real messaging provider (WhatsApp Business API, Twilio, etc.)
- A/B testing of message variants
- Email builder with rich HTML templates
- Mobile app
- Billing or subscription management
- A deals pipeline or support ticket system (this is NOT a sales CRM)

---

## 12. Evaluation Context

This product is being built for an engineering assignment at Xeno, a CRM company for consumer brands. The evaluators will specifically look at:

- **The two-service architecture and callback loop** — how cleanly it's modelled
- **AI integration depth** — is AI genuinely woven in or just a chatbox wrapper
- **Code quality** — clean, readable, well-organised
- **System design thinking** — tradeoffs documented, scale assumptions stated
- **Demo-ability** — works end to end, has data, feels real

The goal is a product that feels genuinely intelligent and production-adjacent, not a prototype with hardcoded responses.

---

## 13. Suggested Build Order

1. Schema + DB setup + seed data (foundation everything else depends on)
2. CRM backend API (customers, orders, campaigns CRUD)
3. Channel Stub Service (send endpoint + async callback loop)
4. WebSocket setup (callback → realtime push)
5. Frontend scaffold (routing, layout, nav)
6. Data Hub screens (customers, orders, import)
7. Dashboard
8. AI chat backend (LLM integration + tool calls)
9. AI Campaign Console (chat UI + live metrics panel)
10. Campaign Tracker + Detail
11. AI proactive suggestions + post-campaign summaries
12. Polish, error handling, README

---

*End of PRD — Version 1.0*
