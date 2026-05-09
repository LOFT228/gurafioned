"use client";

import type {
  PolicyPreset,
  PolicyTier,
  PolicyUsage,
} from "@routeguardian/shared";
import { cn } from "@/lib/cn";
import { FourStar } from "./Sparkles";

const TIER_STYLES: Record<
  PolicyTier,
  { card: string; pill: string; emoji: string; subtitle: string }
> = {
  small: {
    card: "petal-mint",
    pill: "bg-mint text-ink",
    emoji: "🌱",
    subtitle: "Wide token list, generous slippage, fully autonomous.",
  },
  medium: {
    card: "petal-yellow",
    pill: "bg-yellow text-ink",
    emoji: "✨",
    subtitle: "Tighter slippage, narrower token list.",
  },
  large: {
    card: "petal-orange",
    pill: "bg-orange text-cream",
    emoji: "🛡️",
    subtitle: "Manual confirmation required. Short-lived agent token.",
  },
};

export function PolicyCard({
  preset,
  usage,
  active,
}: {
  preset: PolicyPreset;
  usage: PolicyUsage | null;
  active: boolean;
}) {
  const style = TIER_STYLES[preset.tier];
  const spent = usage?.spentUsd ?? 0;
  const cap = preset.dailySpendCapUsd;
  const pct = Math.min(100, Math.round((spent / cap) * 100));

  return (
    <div
      className={cn(
        "relative p-7 transition-all",
        style.card,
        active && "ring-4 ring-purple ring-offset-4 ring-offset-cream",
      )}
    >
      {active && (
        <FourStar className="absolute -top-3 -right-3 h-10 w-10 animate-wiggle" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={cn(
              "inline-block rounded-full border-2 border-ink px-3 py-0.5 text-xs font-bold uppercase tracking-wide",
              style.pill,
            )}
          >
            {preset.tier}
          </span>
          <h3 className="mt-2 text-2xl font-bold tracking-tight">
            {style.emoji} {preset.name}
          </h3>
          <p className="mt-1 text-sm text-ink-soft">{style.subtitle}</p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
        <dt className="text-ink-soft">USD range</dt>
        <dd className="text-right font-semibold">
          ${preset.usdRange.min}{preset.usdRange.max ? `–$${preset.usdRange.max}` : "+"}
        </dd>

        <dt className="text-ink-soft">Max slippage</dt>
        <dd className="text-right font-semibold">{preset.maxSlippagePct}%</dd>

        <dt className="text-ink-soft">Max impact</dt>
        <dd className="text-right font-semibold">{preset.maxPriceImpactPct}%</dd>

        <dt className="text-ink-soft">Daily cap</dt>
        <dd className="text-right font-semibold">${cap.toLocaleString()}</dd>

        <dt className="text-ink-soft">Zerion expiry</dt>
        <dd className="text-right font-mono text-xs font-semibold">
          {preset.zerion.expires}
        </dd>

        <dt className="text-ink-soft">Agent token</dt>
        <dd className="text-right font-mono text-xs font-semibold">
          {preset.agentTokenEnvVar.replace("ZERION_AGENT_TOKEN_", "rg-").toLowerCase()}
        </dd>
      </dl>

      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-ink-soft">Today's spend</span>
          <span>
            ${spent.toFixed(2)} / ${cap.toLocaleString()}
          </span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full border-2 border-ink bg-cream">
          <div
            className="h-full bg-purple"
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      {preset.requiresConfirmation && (
        <p className="mt-4 rounded-2xl border-2 border-ink bg-cream/60 px-3 py-2 text-xs font-semibold text-ink-soft">
          ⚠️ Manual confirmation required before execution.
        </p>
      )}
    </div>
  );
}
