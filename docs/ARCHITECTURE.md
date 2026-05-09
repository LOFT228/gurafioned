# RouteGuardian — Solana-Native Smart Route Optimizer Agent

**Bounty:** Build an Autonomous Onchain Agent using the Zerion CLI
**Chain:** Solana **only** — the agent rejects any non-Solana intent at the validator layer.
**Stack:** Node.js + TypeScript backend, Next.js 14 + Tailwind + shadcn/ui dashboard (Storytale-inspired visual identity), Prisma + SQLite for MVP, Zerion CLI (`zerion-cli`) as the sole execution layer, Jupiter + Titan for independent route comparison.

---

## 0. What we’re building, in one paragraph

RouteGuardian is an autonomous Solana swap agent. When a swap is requested (manually from the dashboard or by a scheduled job), the agent independently fetches quotes from at least two Solana routing sources, scores them on output amount, slippage, price impact and fee, picks the best one, validates it against an active scoped policy (small / medium / large trade), and only then executes the swap **through the Zerion CLI** using a pre-minted agent token bound to that policy. Every step — sources queried, scores, policy decision, CLI call, tx hash — is persisted as an audit record and surfaced in the dashboard.

The non-negotiables from the bounty are baked in:

- Forks `zeriontech/zerion-ai` (the repo that ships `zerion-cli`).
- All swaps go through `zerion swap solana …` — never a direct Jupiter `/swap` or Raydium SDK call.
- Routing decisions are made by RouteGuardian itself, not delegated to a single aggregator.
- Real on-chain transactions on **Solana mainnet only** (no `--dry-run`, no simulation, no EVM fallback).
- Three scoped policies (`small-trade-policy`, `medium-trade-policy`, `large-trade-policy`), enforced both **client-side** (in the agent core, before calling the CLI) and **chain-side** (by the policy bound to the agent token in Zerion).
- Open-source repo + demo video.

---

## 1. Repo / project layout

`pnpm` workspace, monorepo. Clean separation between the autonomous agent (backend), the dashboard (frontend), and the Zerion CLI fork.

```
routeguardian/
├── apps/
│   ├── api/                              # Backend agent + HTTP API
│   │   ├── src/
│   │   │   ├── server.ts                 # Fastify entry — boots HTTP + scheduler
│   │   │   ├── config/
│   │   │   │   ├── env.ts                # zod-validated env
│   │   │   │   └── constants.ts          # Solana mints, RPC, defaults
│   │   │   ├── modules/
│   │   │   │   ├── routes/               # ROUTE COMPARISON
│   │   │   │   │   ├── sources/
│   │   │   │   │   │   ├── source.types.ts   # Common Quote interface
│   │   │   │   │   │   ├── jupiter.ts        # Jupiter Lite/Quote API adapter
│   │   │   │   │   │   ├── titan.ts          # Titan Gateway adapter (or OKX)
│   │   │   │   │   │   └── index.ts          # Exports getAllSources()
│   │   │   │   │   ├── normalizer.ts     # Normalize quotes into one shape
│   │   │   │   │   ├── scoring.ts        # Weighted scoring function
│   │   │   │   │   └── comparator.ts     # Orchestrates fetch + score + pick
│   │   │   │   │
│   │   │   │   ├── policies/             # POLICY ENGINE (client-side mirror)
│   │   │   │   │   ├── policy.types.ts
│   │   │   │   │   ├── presets/
│   │   │   │   │   │   ├── small-trade.json
│   │   │   │   │   │   ├── medium-trade.json
│   │   │   │   │   │   └── large-trade.json
│   │   │   │   │   ├── registry.ts       # Loads + caches active policies
│   │   │   │   │   ├── selector.ts       # Pick policy by USD size / market state
│   │   │   │   │   └── validators.ts     # Slippage / size / daily-cap / expiry checks
│   │   │   │   │
│   │   │   │   ├── zerion/               # ZERION CLI EXECUTION LAYER
│   │   │   │   │   ├── client.ts         # spawn `zerion …` child process, JSON parse
│   │   │   │   │   ├── swap.ts           # zerion swap solana <amt> <from> <to>
│   │   │   │   │   ├── tokens.ts         # `zerion swap tokens solana` → symbol→mint
│   │   │   │   │   ├── agent.ts          # use-token / list-tokens / list-policies
│   │   │   │   │   └── errors.ts         # Map structured CLI errors
│   │   │   │   │
│   │   │   │   ├── agent/                # AUTONOMOUS DECISION CORE
│   │   │   │   │   ├── orchestrator.ts   # End-to-end pipeline (the “brain”)
│   │   │   │   │   ├── intent.ts         # SwapIntent parsing + validation
│   │   │   │   │   └── reasoning.ts      # Build human-readable reasoning log
│   │   │   │   │
│   │   │   │   ├── ledger/               # PERSISTENCE
│   │   │   │   │   ├── audit.ts          # Decision + execution records
│   │   │   │   │   └── usage.ts          # Rolling daily-spend counter per policy
│   │   │   │   │
│   │   │   │   └── scheduler/
│   │   │   │       └── cron.ts           # Optional DCA / scheduled swaps
│   │   │   │
│   │   │   ├── routes/                   # HTTP — thin controllers only
│   │   │   │   ├── quotes.ts             # POST /api/quotes (preview)
│   │   │   │   ├── swaps.ts              # POST /api/swaps (execute)
│   │   │   │   ├── policies.ts           # GET /api/policies, POST /api/policies/active
│   │   │   │   ├── audit.ts              # GET /api/audit
│   │   │   │   └── health.ts
│   │   │   ├── db/prisma.ts
│   │   │   └── lib/logger.ts             # pino
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                              # Next.js 14 dashboard
│       ├── app/
│       │   ├── page.tsx                  # Overview (active policy, balances, last 5 swaps)
│       │   ├── swap/page.tsx             # New swap → preview quotes → execute
│       │   ├── policies/page.tsx         # Policy switcher + rules + daily usage
│       │   └── audit/page.tsx            # Full decision log
│       ├── components/
│       │   ├── ui/                       # shadcn/ui generated
│       │   ├── QuoteTable.tsx            # Side-by-side quote comparison
│       │   ├── PolicyCard.tsx
│       │   └── ReasoningPanel.tsx
│       ├── lib/api.ts                    # Typed fetch wrappers
│       └── package.json
│
├── packages/
│   ├── shared/                           # Shared TS types (Quote, Decision, Policy)
│   └── zerion-cli/                       # Forked zerion-ai (git submodule or workspace)
│
├── scripts/
│   ├── setup-zerion.sh                   # Idempotent: wallet + policies + agent token
│   └── seed-policies.ts                  # Seeds presets/*.json into DB
│
├── .env.example
├── docker-compose.yml                    # Optional Postgres for prod-style runs
├── pnpm-workspace.yaml
└── README.md
```

### Why this shape

- **`modules/` enforces separation of concerns.** Route comparison, policy engine, Zerion execution, and the agent core never import each other’s internals — they communicate via typed inputs/outputs defined in `packages/shared`. Easy to swap Titan for OKX, or add a third source, without touching the policy layer.
- **`zerion/client.ts` is the only place** that spawns child processes. Everything else just sees typed function calls. Makes mocking trivial in tests.
- **Policies live as JSON presets** under version control, plus a DB row for runtime overrides (slippage tweaks, daily-cap edits) made from the dashboard. The JSON is the single source of truth that gets translated into Zerion CLI flags.
- **`agent/orchestrator.ts` is the single entry point** for autonomous behaviour. The HTTP routes and the scheduler both just call `orchestrator.executeSwap(intent)`. This keeps the decision pipeline testable as a pure function of `(intent, policies, sources, clock)`.

---

## 2. Detailed agent flow

### 2.1 End-to-end pipeline (`orchestrator.executeSwap`)

```
┌──────────────────┐
│ 1. SwapIntent    │  { fromToken, toToken, amount, requester, source: "manual" | "scheduler" }
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 2. Resolve mints + USD value             │  via `zerion swap tokens solana` + Pyth/Jupiter price
│    → { fromMint, toMint, usdValue }      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 3. Policy selector                       │  selector.pick(usdValue, marketState)
│    → activePolicy: small | medium | large│  (overridable from dashboard)
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 4. Route comparator                      │  Promise.allSettled([
│    fan-out to all enabled sources        │    jupiter.quote(intent),
│                                          │    titan.quote(intent),
│                                          │  ])
│    → normalize, score, rank              │  scoring.score(quote, activePolicy)
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 5. Pre-flight policy validation          │  validators.run(bestQuote, activePolicy, usage)
│    (client-side mirror of CLI policy)    │
│    → APPROVED | REJECTED(reason)         │
└────────┬─────────────────────────────────┘
         │ APPROVED
         ▼
┌──────────────────────────────────────────┐
│ 6. Switch agent token if needed          │  zerion agent use-token --wallet <wallet>
│    (binds the right policy on-chain)     │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 7. Execute via Zerion CLI                │  zerion swap solana <amt> <from> <to>
│                                          │    --slippage <policy.maxSlippagePct>
│                                          │    --timeout <policy.txTimeoutSec>
│                                          │    --wallet <walletName>
│    → parse JSON: tx.hash, tx.status      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ 8. Persist + emit                        │  Decision + Execution rows; SSE to dashboard
│    update daily-spend counter            │
└──────────────────────────────────────────┘
```

If step 5 rejects, the orchestrator returns the rejection reason, persists a `Decision(status: "rejected")` row, and notifies the dashboard. Nothing touches the chain.

### 2.2 What the agent compares (and how)

For each Solana intent we fetch quotes from **at least two independent sources** running in parallel. A quote is normalized to:

```ts
type Quote = {
  source: "jupiter" | "titan";              // (or "okx", "raydium-direct", …)
  inAmount: bigint;                          // raw lamports of fromMint
  outAmount: bigint;                         // raw lamports of toMint, gross of fees
  outAmountWithSlippage: bigint;             // worst-case after slippage (minimum guaranteed)
  priceImpactPct: number;                    // 0..1
  feeBps: number;                            // platform/router fee
  estimatedNetworkFeeLamports: number;       // Solana priority + base fee
  routePlanSummary: string[];                // e.g. ["Raydium CLMM", "Whirlpool"]
  raw: unknown;                              // original payload, kept for the audit log
};
```

The scoring function is **weighted, transparent and policy-aware**:

```
score = w1 * normalize(outAmountWithSlippage)        // higher is better
      - w2 * priceImpactPct
      - w3 * feeBps / 10_000
      - w4 * estimatedNetworkFeeLamports / 1e9
      - hardPenalty if priceImpact > policy.maxPriceImpactPct
      - hardPenalty if maxSlippageNeeded > policy.maxSlippagePct
```

Default weights: `w1=1.0, w2=0.4, w3=0.2, w4=0.1`. They live in `policy.scoringWeights` so different policies can prioritise differently (e.g. large-trade caps slippage harder, small-trade ignores network fee).

A quote that triggers any **hardPenalty** is automatically disqualified — but it’s still recorded in the audit log so the demo can show *“route X had better output but was rejected for price-impact > 1.5%”*.

The whole comparison runs with a **per-source timeout (~1.5 s)** and continues with whatever responded — never blocks the user on a slow aggregator.

### 2.3 Reasoning log (what makes the demo land)

`reasoning.ts` builds a structured array surfaced in the dashboard, e.g.:

```json
[
  { "step": "intent",   "msg": "Swap 250 USDC → SOL ($250.04)" },
  { "step": "policy",   "msg": "Selected small-trade-policy (≤ $500)" },
  { "step": "quotes",   "msg": "Fetched 2 quotes: Jupiter, Titan" },
  { "step": "score",    "msg": "Titan won: 1.7423 SOL vs 1.7401 (Jupiter), priceImpact 0.04% vs 0.06%" },
  { "step": "validate", "msg": "Slippage 0.5% ≤ policy max 1.0% — OK" },
  { "step": "execute",  "msg": "zerion swap solana 250 USDC SOL --slippage 1" },
  { "step": "tx",       "msg": "Confirmed: 5xZk…q8 (status: success, 1.7416 SOL received)" }
]
```

This is what we show on the dashboard and pause on in the demo video.

---

## 3. Scoped policies — how they bind to Zerion

We keep a **two-level policy model**: presets that live in the repo and are mirrored on Zerion.

### 3.1 Policy preset shape

`apps/api/src/modules/policies/presets/medium-trade.json`:

```jsonc
{
  "name": "medium-trade-policy",
  "tier": "medium",
  "usdRange": { "min": 500, "max": 5000 },

  // Client-side rules (enforced by the agent before calling the CLI)
  "maxSlippagePct": 1.0,
  "maxPriceImpactPct": 1.0,
  "maxNotionalUsd": 5000,
  "dailySpendCapUsd": 20000,
  "txTimeoutSec": 180,
  "allowedFromTokens": ["SOL", "USDC", "USDT"],
  "allowedToTokens":   ["SOL", "USDC", "USDT", "JUP", "JTO", "BONK"],
  "scoringWeights": { "out": 1.0, "impact": 0.5, "fee": 0.2, "gas": 0.1 },

  // Mapped to Zerion CLI flags when the on-chain policy is created
  "zerion": {
    "chains":   ["solana"],
    "expires":  "7d",
    "denyTransfers": true,
    "denyApprovals": true
    // "allowlist" is EVM-only (contract addresses); not used on Solana
  }
}
```

### 3.2 Three presets at a glance

| Policy                | USD range   | Max slippage | Max impact | Daily cap   | Tx timeout | Zerion expiry | Notes                                                      |
|-----------------------|-------------|--------------|------------|-------------|------------|---------------|------------------------------------------------------------|
| `small-trade-policy`  | $0–$500     | 1.5%         | 1.5%       | $5,000      | 120 s      | `7d`          | Default for autonomous + scheduled DCA. Wide token list.   |
| `medium-trade-policy` | $500–$5,000 | 1.0%         | 1.0%       | $20,000     | 180 s      | `7d`          | Tighter slippage, narrower token list.                     |
| `large-trade-policy`  | $5,000+     | 0.5%         | 0.5%       | $50,000     | 240 s      | `24h`         | **Requires manual confirmation** in the dashboard before exec. Short-lived agent token. |

The `large-trade-policy` adds a `requiresConfirmation: true` flag the orchestrator checks before step 6 — when set, it parks the request as `Decision(status: "awaiting_confirmation")` and the dashboard shows a one-click approve button.

### 3.3 Mapping presets to Zerion CLI commands

The `scripts/setup-zerion.sh` script (idempotent — safe to re-run) does:

```bash
# 1. Create the trading wallet once (manual, prompts passphrase)
zerion wallet create --name routeguardian-bot

# 2. Create one Zerion policy per tier
zerion agent create-policy --name small-trade-policy \
  --chains solana \
  --expires 7d \
  --deny-transfers \
  --deny-approvals

zerion agent create-policy --name medium-trade-policy \
  --chains solana \
  --expires 7d \
  --deny-transfers \
  --deny-approvals

zerion agent create-policy --name large-trade-policy \
  --chains solana \
  --expires 24h \
  --deny-transfers \
  --deny-approvals

# 3. Mint one agent token per policy, all bound to the same wallet
zerion agent create-token --name rg-small  --wallet routeguardian-bot --policy <small-id>
zerion agent create-token --name rg-medium --wallet routeguardian-bot --policy <medium-id>
zerion agent create-token --name rg-large  --wallet routeguardian-bot --policy <large-id>

# 4. Verify
zerion agent list-tokens
zerion agent list-policies
```

**Why one token per tier (instead of one token + multiple policies):**
1. Switching tokens with `zerion agent use-token --wallet …` is a config edit — no passphrase, safe to do autonomously between swaps.
2. Each token can be revoked independently if a tier is compromised (e.g. revoke the large one immediately if the dashboard is exposed).
3. Audit logs in Zerion show *which* token signed each tx → maps 1:1 to the policy that authorised it.

**Important constraint we discovered in the CLI source** (`cli/commands/agent/create-policy.js`):
- The “executable” policy plugins shipped today are `deny-transfers`, `deny-approvals`, and `allowlist`. The **`allowlist` plugin only validates EVM contract addresses** — it isn’t a useful “allowed Solana program / pool” gate for this bounty. So Solana-side hard gating relies on `--chains solana` + `--expires` + `--deny-*` plus our **client-side validators** for slippage / size / daily caps. (We can extend the CLI fork with a Solana-aware policy plugin later — it’s a great talking point for the demo.)

### 3.4 Defence in depth

Each swap is checked at three layers:

1. **Client-side validators** in `modules/policies/validators.ts` — fastest, gives clean rejection reasons in the reasoning log, also enforces things Zerion can’t (USD daily cap, max notional, token allowlist).
2. **Zerion CLI argument shaping** — `--slippage` is always set from the active policy; never user-supplied. `--timeout` likewise.
3. **Zerion on-chain policy** bound to the agent token — chain lock + expiry + deny-transfers/approvals are enforced even if the client-side layer is bypassed.

If an attacker compromises only the API key, they still can’t exfiltrate funds because `--deny-transfers` blocks raw `zerion send`, the chain is pinned to Solana, and the token expires.

---

## 4. Route comparison — recommended approach

### 4.1 Primary source: Jupiter

Jupiter is the de facto Solana aggregator and the strongest baseline.

- Endpoint: `GET https://lite-api.jup.ag/swap/v1/quote` (free, no key) or `https://quote-api.jup.ag/v6/quote`.
- Params we use: `inputMint`, `outputMint`, `amount` (raw), `slippageBps` (we always send `policy.maxSlippagePct * 100`), `swapMode=ExactIn`, `restrictIntermediateTokens=true`, `onlyDirectRoutes=false`.
- We read `outAmount`, `otherAmountThreshold` (worst-case out), `priceImpactPct`, `routePlan[]` (for the route summary), and the platform fee fields.
- **We never call Jupiter’s `/swap` endpoint** — Jupiter is used only for the quote/comparison; execution is always Zerion.

### 4.2 Secondary source: Titan Gateway (recommended)

Titan is itself a meta-aggregator — it pulls from Jupiter + others and runs them through their own router (Argos). That makes it the highest-signal “second opinion” because:

- It frequently differs from Jupiter on long-tail tokens.
- It exposes the same quote shape (input, output, route summary, slippage, fees) so the adapter is small.
- REST endpoint with sub-100 ms quotes; works fine in a hackathon setup.

Endpoint family: `https://api.titanex.io/v1/quote?inputMint=…&outputMint=…&amountIn=…&slippageBps=…` (exact path/auth confirmed during implementation; Titan also offers a WebSocket stream we can plug in later).

**Backup picks if Titan onboarding is slow:**
- **OKX DEX Aggregator API** (`/api/v5/dex/aggregator/quote`) — free tier, well-documented, Solana-supported.
- **Raptor by SolanaTracker** — open-source self-hostable aggregator, no API keys, can be run locally as a third source for the demo.
- **Direct-DEX comparison** via Raydium SDK or Orca Whirlpools SDK — most “impressive” for the bounty since it’s clearly *not* an aggregator, but also the most code. Use only if we want a third source.

### 4.3 Why this composition matches the bounty

> *“The agent must compare routes itself (do not rely on a single aggregator blindly).”*

Jupiter alone is a single aggregator. Jupiter + Titan are two **independent** routers — they decide which pools to use differently, and Titan beats Jupiter ~80% of the time on its own published numbers, so disagreement is meaningful. Adding a direct-DEX fallback (Raydium SDK) for select pairs is the cherry on top for the demo: in the video we can show one case where Raydium-direct gives a better quote than either aggregator and the agent picks it.

---

## 5. Persistence schema (Prisma)

```prisma
model SwapIntent {
  id           String   @id @default(cuid())
  fromToken    String
  toToken      String
  amount       String   // decimal as string
  fromMint     String
  toMint       String
  usdValue     Float
  source       String   // "manual" | "scheduler"
  createdAt    DateTime @default(now())
  decision     Decision?
}

model Decision {
  id              String   @id @default(cuid())
  intentId        String   @unique
  intent          SwapIntent @relation(fields: [intentId], references: [id])
  policyName      String
  status          String   // "approved" | "rejected" | "awaiting_confirmation"
  rejectionReason String?
  quotes          Json     // all quotes we considered
  chosenSource    String?
  reasoning       Json     // structured reasoning log
  createdAt       DateTime @default(now())
  execution       Execution?
}

model Execution {
  id            String   @id @default(cuid())
  decisionId    String   @unique
  decision      Decision @relation(fields: [decisionId], references: [id])
  agentToken    String   // which token signed (rg-small / rg-medium / rg-large)
  txHash        String?
  txStatus      String   // "pending" | "success" | "failed"
  receivedAmount String?
  cliStdout     String?
  cliStderr     String?
  createdAt     DateTime @default(now())
}

model PolicyUsage {
  id          String   @id @default(cuid())
  policyName  String
  day         String   // YYYY-MM-DD UTC
  spentUsd    Float    @default(0)
  count       Int      @default(0)
  @@unique([policyName, day])
}
```

Daily caps come from `PolicyUsage` (incremented atomically inside the same DB tx that writes the `Execution`).

---

## 6. Dashboard (Next.js 14)

### 6.0 Visual identity — Storytale-inspired

The dashboard isn't a generic admin UI — it's branded with a playful illustration-led aesthetic inspired by [storytale.io](https://storytale.io). This makes the demo memorable and visually differentiates RouteGuardian from typical hackathon projects.

**Palette** (Tailwind tokens in `apps/web/tailwind.config.ts`):

| Token        | Hex       | Use                                              |
|--------------|-----------|--------------------------------------------------|
| `cream`      | `#FBF6E9` | Page background, primary canvas                  |
| `ink`        | `#1A1A2E` | Body text                                        |
| `purple`     | `#4F3CC9` | Primary brand, headlines, primary buttons        |
| `purple-ink` | `#2E2073` | Hover/active state for primary                   |
| `orange`     | `#FF6B35` | Highlight (winning quote, success states)        |
| `yellow`     | `#FFCB47` | Secondary accent (stars, decorative dots)        |
| `mint`       | `#7BD389` | Approved policy state                            |
| `sky`        | `#7DD3FC` | Info pills, secondary illustrations              |
| `coral`      | `#FF8FA3` | Reject/blocked state                             |

**Typography**: a chunky display face for headlines (Geist Sans 600 or Söhne) and a humanist sans for body (Inter / Geist Sans 400). Generous line-height (1.6+ on body), large H1 (`text-6xl`-ish on the landing/overview).

**Shapes & motifs**:
- Cards use **rounded petal shapes** (`rounded-[2rem]`, occasionally with one corner extra-rounded for personality).
- Decorative SVG "sparkles" (4-point and 8-point stars in yellow/orange) sprinkled around hero areas.
- Thin-outline character illustrations sourced from Storytale's free packs (or recoloured open-source illustrations from unDraw / Open Doodles to match the palette) — placed alongside empty states and on the overview hero.
- Loose hand-drawn dividers instead of straight `<hr>`.

**Components** (built on shadcn/ui but restyled):
- `<PetalCard>`: rounded `[2rem]` card with thick cream interior on a purple page accent.
- `<QuoteRow>`: side-by-side quote rows with the winning row highlighted in orange + a small star icon.
- `<PolicyCard>`: large illustrated card per tier with a character illustration, traffic-light dot for active state, and a chunky toggle.
- `<ReasoningTrail>`: vertical timeline with thin dashed line + petal-shaped step markers.
- Buttons: deep purple primary with thick `4px` outline shadow offset (chunky / 90s-ish), no gradients, no glassmorphism.

**What this design is NOT**: dark Bloomberg-terminal trading UI, neon DeFi gradients, or Apple-glass blur. It deliberately leans warm, playful, and confident — easier to demo, easier to remember.

### 6.1 Pages

Four pages, all driven by typed fetch wrappers in `lib/api.ts`, all on the cream canvas with the petal-card style above:

1. **Overview** — illustrated hero ("RouteGuardian is watching the routes" character), active-policy petal card, wallet balance (`zerion portfolio`), last 5 swaps as petal rows with tx links, daily-spend bar (purple fill on cream rail).
2. **New swap** — token in/out picker + amount on the left, live quote comparison (`QuoteRow` for each source) on the right with the winner highlighted in orange + sparkle. Execute button is the chunky purple primary. Reasoning log streams in below as a `ReasoningTrail`.
3. **Policies** — three `PolicyCard`s (small / medium / large) each with a unique character illustration, expiry countdown, daily-usage bar, attached agent-token name, and a chunky toggle to override the auto-selected policy.
4. **Audit** — paginated petal-row list of every `Decision` (approved + rejected), click-through to full reasoning JSON. This is the page bounty judges spend time on — it has to clearly show the agent reasoned its way through every decision.

---

## 7. Locked decisions (was: open questions)

Approved by Victor on the kickoff message:

- **Wallet:** fresh, created via `zerion wallet create` on the agent host.
- **Funding:** ~$30 in SOL + USDC for the demo wallet (pending a wallet address in step 7.x of implementation).
- **Secondary route source:** **Titan Gateway**.
- **Storage:** Prisma + SQLite for the MVP submission.
- **Scheduler:** in-scope but disabled by default; we ship one example DCA cron that's commented out, judges can flip it on.
- **Submission shape:** fresh `routeguardian/` repo + `zeriontech/zerion-ai` fork as a git submodule + a small upstream PR adding a `zerion-routeguardian` partner skill (so the bounty's "fork the Zerion CLI repo" requirement is satisfied with real upstream value, not just a dead fork).
- **Solana-only:** no EVM. Validator rejects any `chain !== "solana"` intent. Bridge and EVM-only flags (`--allowlist` for EVM contracts) are documented but not used.
- **Frontend:** Storytale-inspired visual identity (see §6.0).

## 8. Original open questions (kept for reference)

Most are small but they affect the plan, so I’d like to get them answered before we write code:

1. **Solana wallet provisioning.** Do you want the agent to use a fresh wallet created via `zerion wallet create` on the host running the agent, or import an existing key with `zerion wallet import --sol-key`? (Affects the setup script and the demo: a fresh wallet is cleaner; an existing one means we have something to swap on day 1.)
2. **Funding for the demo.** How much SOL + USDC are you OK to put on the demo wallet? (Even ~$30 is enough to demo all three policies — large-trade can be triggered with a configurable threshold lowered to e.g. $20 for the demo.)
3. **Secondary route source.** Recommendation is **Titan Gateway**. OK to go with that, or do you prefer **OKX DEX**, **Raydium SDK direct**, or all three?
4. **Storage.** Prisma + SQLite for the MVP / hackathon submission, then drop in Postgres if needed? Or do you want Postgres from day 1 (docker-compose included)?
5. **Scheduler scope.** Is the scheduled-swap path (cron-based DCA) in scope for the bounty submission, or do we keep it as “present but disabled in the demo”?
6. **Bounty submission target.** Should we submit a single mono-PR against a fork of `zeriontech/zerion-ai`, or set up a separate repo (`routeguardian/`) that pulls the CLI from npm and references the fork as “our submitted upstream contribution”? (Both are valid bounty patterns; the bounty wording leans toward forking, so my default would be a fresh repo with the fork as a git submodule + a tiny PR upstream that adds a `zerion-routeguardian` partner skill — that hits both checkboxes.)
7. **Demo format.** Live demo at submission, recorded video, or both? (Affects how much UX polish we put into the dashboard vs. the CLI-side logs.)
8. **Dashboard auth.** Single-user (just you running it locally + a deployed demo), or do you want simple email/passcode protection on the deployed dashboard so judges have to log in?

Once these are answered I’ll turn this into a concrete implementation roadmap (week-by-week or PR-by-PR, your call).
