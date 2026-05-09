import { z } from "zod";

/**
 * Tier of a policy. The selector picks one based on the USD value
 * of an intent.
 */
export const PolicyTierSchema = z.enum(["small", "medium", "large"]);
export type PolicyTier = z.infer<typeof PolicyTierSchema>;

/**
 * Weights used by the scoring function. Quotes are ranked by a linear
 * combination of these terms; per-policy weights let the large-trade tier
 * weight price-impact more heavily than the small-trade tier, etc.
 */
export const ScoringWeightsSchema = z.object({
  out: z.number().nonnegative().default(1.0),
  impact: z.number().nonnegative().default(0.4),
  fee: z.number().nonnegative().default(0.2),
  gas: z.number().nonnegative().default(0.1),
});
export type ScoringWeights = z.infer<typeof ScoringWeightsSchema>;

/**
 * Mapping from a policy preset to the Zerion CLI flags used to mint
 * its on-chain policy. Solana-only — `allowlist` is intentionally absent
 * because Zerion's allowlist plugin validates EVM contract addresses only.
 */
export const ZerionPolicyMappingSchema = z.object({
  chains: z.array(z.literal("solana")).min(1).default(["solana"]),
  expires: z.string().regex(/^\d+[hd]$/, "Use Nh or Nd, e.g. 24h or 7d"),
  denyTransfers: z.boolean().default(true),
  denyApprovals: z.boolean().default(true),
});
export type ZerionPolicyMapping = z.infer<typeof ZerionPolicyMappingSchema>;

/**
 * The canonical policy preset shape — JSON files under policies/presets/
 * are validated against this on load.
 */
export const PolicyPresetSchema = z.object({
  name: z.string().min(1),
  tier: PolicyTierSchema,
  usdRange: z.object({
    min: z.number().nonnegative(),
    /** null means "no upper bound" (used by the large-trade tier). */
    max: z.number().nonnegative().nullable(),
  }),

  // --- Client-side rules (enforced by validators.ts before calling the CLI) ---
  maxSlippagePct: z.number().positive().max(50),
  maxPriceImpactPct: z.number().positive().max(50),
  maxNotionalUsd: z.number().positive(),
  dailySpendCapUsd: z.number().positive(),
  txTimeoutSec: z.number().int().positive(),
  allowedFromTokens: z.array(z.string().min(1)).min(1),
  allowedToTokens: z.array(z.string().min(1)).min(1),
  scoringWeights: ScoringWeightsSchema,

  /**
   * If true, the orchestrator parks the decision as "awaiting_confirmation"
   * and the dashboard surfaces a one-click approve button before exec.
   */
  requiresConfirmation: z.boolean().default(false),

  /** Mapping to the on-chain Zerion policy. */
  zerion: ZerionPolicyMappingSchema,

  /**
   * Name of the agent token (set in .env) that's bound to this policy
   * on the Zerion side. The orchestrator switches to it via
   * `zerion agent use-token --wallet <wallet>` before executing.
   */
  agentTokenEnvVar: z.enum([
    "ZERION_AGENT_TOKEN_SMALL",
    "ZERION_AGENT_TOKEN_MEDIUM",
    "ZERION_AGENT_TOKEN_LARGE",
  ]),
});
export type PolicyPreset = z.infer<typeof PolicyPresetSchema>;

/**
 * Daily-usage row tracked in the DB; used by validators to enforce
 * the daily-spend cap.
 */
export interface PolicyUsage {
  policyName: string;
  /** YYYY-MM-DD in UTC. */
  day: string;
  spentUsd: number;
  count: number;
}

/**
 * Outcome of running the validators against a quote+policy+usage tuple.
 */
export type ValidationResult =
  | { ok: true }
  | { ok: false; code: ValidationFailureCode; message: string };

export type ValidationFailureCode =
  | "wrong_chain"
  | "slippage_exceeds_policy"
  | "price_impact_exceeds_policy"
  | "notional_exceeds_policy"
  | "daily_cap_exceeded"
  | "from_token_not_allowed"
  | "to_token_not_allowed"
  | "policy_expired"
  | "no_quotes_available"
  | "all_quotes_disqualified";
