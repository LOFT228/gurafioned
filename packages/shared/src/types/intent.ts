import { z } from "zod";

/**
 * A parsed swap intent. The agent only ever processes Solana intents;
 * any other chain is rejected at the validator boundary.
 */
export const SwapIntentSchema = z.object({
  /** Source token — symbol ("USDC") or full SPL mint address. */
  fromToken: z.string().min(1),
  /** Destination token — symbol or mint address. */
  toToken: z.string().min(1),
  /** Decimal amount of `fromToken` to swap, e.g. "100", "0.5". */
  amount: z.string().regex(/^\d+(\.\d+)?$/, "Amount must be a positive decimal."),
  /** Solana — locked. Validates explicitly so a typo doesn't sneak through. */
  chain: z.literal("solana").default("solana"),
  /** Where the intent came from — useful for dashboards + audit logs. */
  source: z.enum(["manual", "scheduler", "api"]).default("manual"),
  /** Optional human-readable label, e.g. "Daily DCA". */
  label: z.string().max(120).optional(),
});
export type SwapIntent = z.infer<typeof SwapIntentSchema>;

/**
 * SwapIntent enriched with mint resolution + USD valuation. Built by the
 * orchestrator after step 2 of the pipeline.
 */
export interface ResolvedIntent extends SwapIntent {
  fromMint: string;
  toMint: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  fromTokenDecimals: number;
  toTokenDecimals: number;
  /** USD value of the input amount at quote time. */
  usdValue: number;
}
