import { PolicyCard } from "@/components/PolicyCard";
import { api } from "@/lib/api";

export default async function PoliciesPage() {
  const data = await api.policies().catch(() => ({ policies: [] }));

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <span className="inline-block rounded-full border-2 border-ink bg-mint px-3 py-1 text-xs font-bold uppercase tracking-wider">
          Scoped policies
        </span>
        <h1 className="text-4xl font-bold tracking-tight">
          Three lenses. <span className="text-purple">One guard.</span>
        </h1>
        <p className="max-w-2xl text-ink-soft">
          Every swap is matched to one of these tiers based on its USD value.
          The matching tier's slippage cap, daily-spend limit, and Zerion
          agent-token policy all apply automatically before the CLI is invoked.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {data.policies.length === 0 ? (
          <p className="lg:col-span-3 rounded-petal border-2 border-dashed border-ink/20 px-5 py-12 text-center text-ink-soft">
            Backend isn't reachable yet — make sure the API is running on{" "}
            <code className="rounded bg-cream-deep px-1.5 py-0.5 font-mono text-xs">
              {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}
            </code>
            .
          </p>
        ) : (
          data.policies.map(({ preset, usage }) => (
            <PolicyCard
              key={preset.name}
              preset={preset}
              usage={usage}
              active={false}
            />
          ))
        )}
      </section>

      <section className="petal-purple p-7">
        <h2 className="text-lg font-bold tracking-tight">
          How a policy is enforced
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">1. Client-side validators</strong> —
            slippage, price impact, daily cap, max notional, token allowlist
            are checked in <code>modules/policies/validators.ts</code> before
            the CLI is touched.
          </li>
          <li>
            <strong className="text-ink">2. CLI flags</strong> — the orchestrator
            always passes <code>--slippage</code> and <code>--timeout</code>
            from the active policy, never from user input.
          </li>
          <li>
            <strong className="text-ink">3. On-chain Zerion policy</strong> —
            chain-locked to Solana, expires per tier, and denies raw transfers
            and approvals so a stolen agent token still can't drain the wallet.
          </li>
        </ol>
      </section>
    </div>
  );
}
