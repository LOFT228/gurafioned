import type { ScoredQuote } from "@routeguardian/shared";
import { cn } from "@/lib/cn";
import { FourStar } from "./Sparkles";

const SOURCE_COLORS: Record<string, string> = {
  jupiter: "bg-purple text-cream",
  titan: "bg-orange text-ink",
  okx: "bg-sky text-ink",
  "raydium-direct": "bg-mint text-ink",
};

export function QuoteRow({
  scored,
  rank,
  isWinner,
}: {
  scored: ScoredQuote;
  rank: number;
  isWinner: boolean;
}) {
  const { quote } = scored;
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-4 rounded-petal border-2 px-5 py-4 transition-all",
        isWinner
          ? "border-orange bg-orange-soft shadow-chunky-orange"
          : scored.disqualified
            ? "border-coral/60 bg-coral-soft/40"
            : "border-ink/15 bg-cream",
      )}
    >
      {isWinner && (
        <FourStar className="absolute -top-3 -left-3 h-7 w-7 animate-wiggle" />
      )}

      <div className="flex min-w-0 flex-1 items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-cream font-bold">
          {rank}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full border-2 border-ink px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide",
                SOURCE_COLORS[quote.source] ?? "bg-cream-deep text-ink",
              )}
            >
              {quote.source}
            </span>
            <span className="text-xs text-ink-soft">
              {quote.responseTimeMs}ms
            </span>
            {scored.disqualified && (
              <span className="rounded-full border-2 border-coral bg-coral-soft px-2 py-0.5 text-xs font-semibold text-ink">
                disqualified
              </span>
            )}
          </div>
          <p className="mt-1 truncate text-sm font-semibold text-ink">
            min out: {quote.outAmountWithSlippage}
          </p>
          <p className="truncate text-xs text-ink-soft">
            via {quote.routePlanSummary.join(" → ") || "direct"} ·
            impact {(quote.priceImpactPct * 100).toFixed(3)}% ·
            fee {quote.feeBps}bps
          </p>
          {scored.disqualified && (
            <p className="mt-1 text-xs font-semibold text-coral">
              {scored.disqualificationReasons.join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="text-right">
        <p className="text-xs uppercase tracking-wide text-ink-soft">score</p>
        <p className="font-mono text-sm font-bold">
          {scored.score < -1e6 ? "—" : scored.score.toFixed(4)}
        </p>
      </div>
    </div>
  );
}
