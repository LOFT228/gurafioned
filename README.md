# RouteGuardian

> Solana-native autonomous swap agent that compares routes itself, applies scoped policies, and executes every swap through the [Zerion CLI](https://github.com/zeriontech/zerion-ai).

Built for the Superteam **"Build an Autonomous Onchain Agent using the Zerion CLI"** bounty.

---

## What it does

1. Receives a swap intent (manually from the dashboard, or from a scheduler).
2. Fetches quotes from **two independent Solana routing sources** (Jupiter + Titan) in parallel.
3. Scores them on output amount, slippage, price impact and network fee — picks the best.
4. Selects the right **scoped policy** (`small` / `medium` / `large` tier) based on the USD size of the trade.
5. Validates the chosen route against the policy (slippage cap, daily spend cap, token allowlist, …).
6. Switches the active **agent token** so the on-chain policy bound to it matches the tier.
7. Executes the swap via `zerion swap solana …` — a real, on-chain transaction.
8. Persists every step (sources queried, scores, decision, tx hash) to a SQLite ledger and surfaces it on a Storytale-styled dashboard.

## Repo layout

```
apps/
  api/         # Fastify + TS backend, Prisma + SQLite, agent core
  web/         # Next.js 14 + Tailwind + shadcn dashboard
packages/
  shared/      # Shared TS types (Quote, Decision, Policy, …)
  zerion-cli/  # Submodule: fork of zeriontech/zerion-ai
scripts/
  setup-zerion.sh   # Idempotent: creates wallet, policies, agent tokens
policies/      # JSON presets (small / medium / large), single source of truth
docs/
  ARCHITECTURE.md
```

## Quick start

> Requires Node ≥ 20 and pnpm ≥ 9.

```bash
# 1. Install
pnpm install

# 2. Install the Zerion CLI globally
npm install -g zerion-cli
zerion config set apiKey zk_dev_your_key

# 3. Set up wallet + policies + agent tokens (interactive — prompts passphrase)
bash scripts/setup-zerion.sh

# 4. Configure environment
cp .env.example .env
# edit .env

# 5. Run
pnpm dev
```

Dashboard: http://localhost:3000  ·  API: http://localhost:4000

## Bounty checklist

- [x] Forks `zeriontech/zerion-ai` (`packages/zerion-cli/` submodule)
- [x] All swaps executed via Zerion CLI (`zerion swap solana …`)
- [x] Real on-chain transactions on Solana mainnet (no simulation)
- [x] Multiple scoped policies (3 tiers, with multi-layer enforcement)
- [x] Open source (MIT)
- [x] Demo dashboard
- [ ] Demo video — recorded once a Solana wallet is funded

## License

MIT — see [LICENSE](./LICENSE).
