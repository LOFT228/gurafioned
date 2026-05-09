import { describe, expect, it } from "vitest";
import type { PolicyPreset, Quote } from "@routeguardian/shared";
import { pickBest, scoreQuotes } from "../scoring.js";

const policy: PolicyPreset = {
  name: "test-policy",
  tier: "small",
  usdRange: { min: 0, max: 500 },
  maxSlippagePct: 1.0,
  maxPriceImpactPct: 1.0,
  maxNotionalUsd: 500,
  dailySpendCapUsd: 5000,
  txTimeoutSec: 120,
  allowedFromTokens: ["USDC"],
  allowedToTokens: ["SOL"],
  scoringWeights: { out: 1.0, impact: 0.4, fee: 0.2, gas: 0.1 },
  requiresConfirmation: false,
  zerion: { chains: ["solana"], expires: "7d", denyTransfers: true, denyApprovals: true },
  agentTokenEnvVar: "ZERION_AGENT_TOKEN_SMALL",
};

function quote(over: Partial<Quote>): Quote {
  return {
    source: "jupiter",
    inMint: "USDC",
    outMint: "SOL",
    inAmount: "100000000",
    outAmount: "1000000000",
    outAmountWithSlippage: "990000000",
    priceImpactPct: 0.001,
    feeBps: 0,
    estimatedNetworkFeeLamports: 5_000,
    routePlanSummary: ["Raydium"],
    responseTimeMs: 100,
    raw: {},
    ...over,
  };
}

describe("scoring", () => {
  it("ranks higher output above lower output", () => {
    const scored = scoreQuotes(
      [
        quote({ source: "jupiter", outAmountWithSlippage: "990000000" }),
        quote({ source: "titan", outAmountWithSlippage: "1000000000" }),
      ],
      policy,
    );
    const winner = pickBest(scored);
    expect(winner?.quote.source).toBe("titan");
  });

  it("disqualifies a quote that exceeds maxPriceImpactPct", () => {
    const scored = scoreQuotes(
      [
        quote({ source: "jupiter", priceImpactPct: 0.0005 }),
        quote({ source: "titan", priceImpactPct: 0.05, outAmountWithSlippage: "9999999999" }),
      ],
      policy,
    );
    const titan = scored.find((s) => s.quote.source === "titan")!;
    expect(titan.disqualified).toBe(true);
    const winner = pickBest(scored);
    expect(winner?.quote.source).toBe("jupiter");
  });

  it("returns null when every quote is disqualified", () => {
    const scored = scoreQuotes(
      [
        quote({ source: "jupiter", priceImpactPct: 0.05 }),
        quote({ source: "titan", priceImpactPct: 0.05 }),
      ],
      policy,
    );
    expect(pickBest(scored)).toBeNull();
  });
});
