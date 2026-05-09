/**
 * Normalized swap quote shape — every route source must produce this,
 * regardless of whether it came from Jupiter, Titan, or a direct DEX.
 *
 * All amounts are stored as decimal strings to avoid bigint serialization
 * issues across the API boundary; conversion to bigint happens at the edges.
 */
export type RouteSource = "jupiter" | "titan" | "okx" | "raydium-direct";

export interface Quote {
  /** Which source produced this quote. */
  source: RouteSource;
  /** Mint of the input token (Solana SPL mint address). */
  inMint: string;
  /** Mint of the output token. */
  outMint: string;
  /** Raw input amount in the smallest unit of the input token. */
  inAmount: string;
  /** Raw output amount in the smallest unit of the output token (gross). */
  outAmount: string;
  /**
   * Worst-case output (after applying slippage tolerance) — the floor the
   * agent is willing to accept on chain. This is what we feed into scoring.
   */
  outAmountWithSlippage: string;
  /** Price impact as a fraction in [0, 1]. e.g. 0.0042 = 0.42%. */
  priceImpactPct: number;
  /** Aggregator/router fee in basis points (1 bps = 0.01%). */
  feeBps: number;
  /** Estimated Solana network fee (priority + base) in lamports. */
  estimatedNetworkFeeLamports: number;
  /** Human-readable summary of the route, e.g. ["Raydium CLMM", "Whirlpool"]. */
  routePlanSummary: string[];
  /** Time the source took to respond, in milliseconds. */
  responseTimeMs: number;
  /** Original payload from the source — kept for the audit log. */
  raw: unknown;
}

/**
 * Wraps a Quote with its score and any disqualifying penalty reasons.
 */
export interface ScoredQuote {
  quote: Quote;
  score: number;
  disqualified: boolean;
  disqualificationReasons: string[];
}

/**
 * Result of attempting to fetch a quote from a single source.
 * `failed` carries the error so we can surface partial-failure cases
 * (e.g. "Titan was down, Jupiter answered") in the reasoning log.
 */
export type QuoteResult =
  | { ok: true; quote: Quote }
  | { ok: false; source: RouteSource; error: string; responseTimeMs: number };
