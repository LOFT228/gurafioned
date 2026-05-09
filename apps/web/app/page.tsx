import Link from "next/link";
import { GuardianMascot } from "@/components/GuardianMascot";
import { Sparkles } from "@/components/Sparkles";
import { api } from "@/lib/api";

export default async function OverviewPage() {
  const [policies, audit] = await Promise.all([
    api.policies().catch(() => ({ policies: [] })),
    api.audit(5).catch(() => ({ decisions: [] })),
  ]);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-petal-lg border-2 border-ink bg-purple-mist p-8 lg:p-14">
        <Sparkles className="opacity-90" />
        <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <span className="inline-block rounded-full border-2 border-ink bg-cream px-3 py-1 text-xs font-bold uppercase tracking-wider">
              Solana · Zerion CLI · Open source
            </span>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-ink lg:text-6xl">
              The agent that<br />
              <span className="text-purple">guards your routes</span>.
            </h1>
            <p className="max-w-xl text-lg text-ink-soft">
              RouteGuardian compares Solana swap routes across Jupiter and Titan,
              applies a scoped policy that matches the trade size, and executes
              every swap through the Zerion CLI — so a misbehaving aggregator
              can never run away with your funds.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/swap" className="btn-chunky">
                New swap →
              </Link>
              <Link href="/policies" className="btn-chunky-ghost">
                See policies
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[360px]">
            <GuardianMascot className="h-auto w-full drop-shadow-[6px_6px_0_rgba(46,32,115,0.3)]" />
          </div>
        </div>
      </section>

      {/* Active policies summary */}
      <section className="grid gap-6 lg:grid-cols-3">
        {policies.policies.length === 0 ? (
          <div className="petal lg:col-span-3 p-7 text-center">
            <p className="text-ink-soft">
              Backend isn't reachable yet. Once it is, your three policy tiers
              will appear here.
            </p>
          </div>
        ) : (
          policies.policies.map(({ preset, usage }) => (
            <div key={preset.name} className="petal-purple p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-lg font-bold tracking-tight">
                  {preset.name}
                </h3>
                <span className="rounded-full bg-purple px-2 py-0.5 text-xs font-bold uppercase text-cream">
                  {preset.tier}
                </span>
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                ${preset.usdRange.min}–{preset.usdRange.max ?? "∞"} · max
                slippage {preset.maxSlippagePct}%
              </p>
              <p className="mt-4 text-xs text-ink-soft">
                Today's spend
              </p>
              <p className="text-2xl font-bold">
                ${(usage?.spentUsd ?? 0).toFixed(2)}
                <span className="ml-1 text-sm font-normal text-ink-soft">
                  / ${preset.dailySpendCapUsd.toLocaleString()}
                </span>
              </p>
            </div>
          ))
        )}
      </section>

      {/* Recent decisions */}
      <section>
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-bold tracking-tight">
            Recent decisions
          </h2>
          <Link
            href="/audit"
            className="text-sm font-semibold text-purple hover:underline"
          >
            See full audit log →
          </Link>
        </header>
        <div className="space-y-3">
          {audit.decisions.length === 0 ? (
            <p className="rounded-petal border-2 border-dashed border-ink/20 px-5 py-12 text-center text-ink-soft">
              No decisions yet. Trigger your first swap from the{" "}
              <Link href="/swap" className="font-semibold text-purple underline">
                New swap
              </Link>{" "}
              page.
            </p>
          ) : (
            audit.decisions.map((d) => (
              <Link
                key={d.id}
                href={`/audit#${d.id}`}
                className="flex items-center justify-between gap-4 rounded-petal border-2 border-ink/15 bg-cream px-5 py-4 transition-all hover:border-ink/30"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {d.intent
                      ? `${d.intent.amount} ${d.intent.fromToken} → ${d.intent.toToken}`
                      : d.id}
                  </p>
                  <p className="text-xs text-ink-soft">
                    {new Date(d.createdAt).toLocaleString()} · {d.policyName}
                  </p>
                </div>
                <span
                  className={
                    "rounded-full border-2 border-ink px-3 py-1 text-xs font-bold uppercase " +
                    (d.status === "executed"
                      ? "bg-mint text-ink"
                      : d.status === "rejected"
                        ? "bg-coral text-ink"
                        : d.status === "awaiting_confirmation"
                          ? "bg-yellow text-ink"
                          : "bg-cream-deep text-ink")
                  }
                >
                  {d.status}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
