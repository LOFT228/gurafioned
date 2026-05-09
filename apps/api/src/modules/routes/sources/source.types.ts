import type { Quote, RouteSource } from "@routeguardian/shared";

/**
 * Common interface implemented by every route source.
 *
 * `getQuote` MUST resolve quickly (< ~1.5 s). Implementations are responsible
 * for their own timeouts so the comparator can trust the contract.
 */
export interface QuoteSource {
  readonly name: RouteSource;
  /**
   * Whether this source is enabled in the current environment. Sources read
   * their own env vars at construction time; the comparator skips disabled
   * ones rather than calling them and getting "missing API key" errors.
   */
  readonly enabled: boolean;
  getQuote(input: QuoteRequest): Promise<Quote>;
}

export interface QuoteRequest {
  inMint: string;
  outMint: string;
  /** Raw input amount in the smallest unit of `inMint`. */
  amountIn: string;
  /** Slippage tolerance in basis points (50 = 0.5%). */
  slippageBps: number;
  /** Hard timeout for the HTTP call. */
  timeoutMs: number;
}
