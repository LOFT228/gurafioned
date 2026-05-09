import type {
  PolicyPreset,
  Quote,
  ScoredQuote,
} from "@routeguardian/shared";
import {
  HARD_DISQUALIFY_PENALTY,
  LAMPORTS_PER_SOL,
} from "../../config/constants.js";

/**
 * Scoring function: given a list of normalized quotes and the active policy,
 * compute a per-quote score and flag any disqualified quotes.
 *
 * The score is a weighted linear combination — higher is better:
 *
 *   score =  w_out    * normalize(outAmountWithSlippage)
 *          - w_impact * priceImpactPct
 *          - w_fee    * feeBps / 10_000
 *          - w_gas    * networkFeeSol
 *          + hardPenalty(if policy gates fail)
 *
 * Output is normalized against the *best* outAmountWithSlippage in the
 * batch, so the scale stays consistent across batches and tokens.
 *
 * Disqualifying gates (set hardPenalty = HARD_DISQUALIFY_PENALTY):
 *   - priceImpactPct > policy.maxPriceImpactPct
 *   - implied slippage > policy.maxSlippagePct
 *
 * Disqualified quotes are kept in the output (for the audit log) but
 * their score is negative-large so they always lose to qualified ones.
 */
export function scoreQuotes(
  quotes: Quote[],
  policy: PolicyPreset,
): ScoredQuote[] {
  if (quotes.length === 0) return [];

  // 1. Normalize output amount against the best in the batch.
  const bestOut = quotes.reduce((acc, q) => {
    try {
      const n = BigInt(q.outAmountWithSlippage);
      return n > acc ? n : acc;
    } catch {
      return acc;
    }
  }, 0n);

  const w = policy.scoringWeights;

  return quotes.map((quote) => {
    const reasons: string[] = [];

    // --- Hard gates ---
    const policyMaxImpact = policy.maxPriceImpactPct / 100; // 1.0% -> 0.01
    if (quote.priceImpactPct > policyMaxImpact) {
      reasons.push(
        `price_impact_${(quote.priceImpactPct * 100).toFixed(3)}%>${policy.maxPriceImpactPct}%`,
      );
    }

    const impliedSlippagePct = computeImpliedSlippagePct(quote);
    if (impliedSlippagePct > policy.maxSlippagePct) {
      reasons.push(
        `implied_slippage_${impliedSlippagePct.toFixed(3)}%>${policy.maxSlippagePct}%`,
      );
    }

    // --- Components ---
    const outNormalized =
      bestOut === 0n
        ? 0
        : safeBigDiv(BigInt(quote.outAmountWithSlippage), bestOut);

    const impactComponent = quote.priceImpactPct;
    const feeComponent = quote.feeBps / 10_000;
    const gasComponent = quote.estimatedNetworkFeeLamports / LAMPORTS_PER_SOL;

    let score =
      w.out * outNormalized -
      w.impact * impactComponent -
      w.fee * feeComponent -
      w.gas * gasComponent;

    const disqualified = reasons.length > 0;
    if (disqualified) score += HARD_DISQUALIFY_PENALTY;

    return {
      quote,
      score,
      disqualified,
      disqualificationReasons: reasons,
    };
  });
}

/**
 * Approximates the slippage implied by a quote — i.e. how much worse the
 * outAmountWithSlippage is than outAmount. Returned as a percentage, e.g.
 * 0.5 means 0.5%.
 */
function computeImpliedSlippagePct(quote: Quote): number {
  try {
    const out = BigInt(quote.outAmount);
    const min = BigInt(quote.outAmountWithSlippage);
    if (out === 0n) return 0;
    // (out - min) / out * 100, computed in float (precision is fine for %).
    const diff = Number(out - min);
    return (diff / Number(out)) * 100;
  } catch {
    return 0;
  }
}

/**
 * BigInt division returning a float in [0, 1] — used to compare output
 * amounts of vastly different magnitudes (lamports vs USDC base units).
 * Loses some precision in the conversion but stays within ~1e-15 which
 * is irrelevant for ranking.
 */
function safeBigDiv(num: bigint, den: bigint): number {
  if (den === 0n) return 0;
  // Multiply by 1e9 to keep enough precision in the Number cast.
  const scaled = (num * 1_000_000_000n) / den;
  return Number(scaled) / 1_000_000_000;
}

/**
 * Picks the highest-scoring quote, or null if none are qualified.
 * Disqualified quotes are never returned even if they're the only ones.
 */
export function pickBest(scored: ScoredQuote[]): ScoredQuote | null {
  const qualified = scored.filter((s) => !s.disqualified);
  if (qualified.length === 0) return null;
  return qualified.reduce((best, cur) => (cur.score > best.score ? cur : best));
}
