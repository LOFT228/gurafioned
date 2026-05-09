import type {
  PolicyPreset,
  PolicyUsage,
  ResolvedIntent,
  ScoredQuote,
  ValidationResult,
} from "@routeguardian/shared";
import { SOLANA_CHAIN } from "../../config/constants.js";

/**
 * Validation pipeline. Runs *before* the Zerion CLI is called.
 *
 * Layered defence: even if Zerion's on-chain policy is bypassed
 * somehow, these client-side checks block:
 *   - non-Solana intents
 *   - tokens outside the policy allowlist
 *   - over-notional trades
 *   - daily-cap exceeded
 *   - quotes that violate slippage / price-impact gates
 */
export function validateIntent(
  intent: ResolvedIntent,
  policy: PolicyPreset,
): ValidationResult {
  if (intent.chain !== SOLANA_CHAIN) {
    return {
      ok: false,
      code: "wrong_chain",
      message: `RouteGuardian only operates on Solana — got "${intent.chain}".`,
    };
  }

  if (intent.usdValue > policy.maxNotionalUsd) {
    return {
      ok: false,
      code: "notional_exceeds_policy",
      message: `Trade USD value ${intent.usdValue.toFixed(2)} exceeds policy maxNotionalUsd ${policy.maxNotionalUsd}.`,
    };
  }

  const fromOk = policy.allowedFromTokens.includes(intent.fromTokenSymbol);
  if (!fromOk) {
    return {
      ok: false,
      code: "from_token_not_allowed",
      message: `${intent.fromTokenSymbol} is not in ${policy.name}.allowedFromTokens.`,
    };
  }

  const toOk = policy.allowedToTokens.includes(intent.toTokenSymbol);
  if (!toOk) {
    return {
      ok: false,
      code: "to_token_not_allowed",
      message: `${intent.toTokenSymbol} is not in ${policy.name}.allowedToTokens.`,
    };
  }

  return { ok: true };
}

export function validateDailyCap(
  intent: ResolvedIntent,
  policy: PolicyPreset,
  usage: PolicyUsage | null,
): ValidationResult {
  const alreadySpent = usage?.spentUsd ?? 0;
  const projected = alreadySpent + intent.usdValue;
  if (projected > policy.dailySpendCapUsd) {
    return {
      ok: false,
      code: "daily_cap_exceeded",
      message: `Trade would push today's spend to $${projected.toFixed(2)}, exceeding the $${policy.dailySpendCapUsd} cap for ${policy.name}.`,
    };
  }
  return { ok: true };
}

export function validateQuote(
  scored: ScoredQuote,
  policy: PolicyPreset,
): ValidationResult {
  if (scored.disqualified) {
    return {
      ok: false,
      code:
        scored.disqualificationReasons.find((r) => r.startsWith("price_impact"))
          ? "price_impact_exceeds_policy"
          : "slippage_exceeds_policy",
      message: `Best quote disqualified: ${scored.disqualificationReasons.join(", ")}`,
    };
  }
  // Price impact is also re-checked here as a belt-and-braces guard.
  const policyMaxImpact = policy.maxPriceImpactPct / 100;
  if (scored.quote.priceImpactPct > policyMaxImpact) {
    return {
      ok: false,
      code: "price_impact_exceeds_policy",
      message: `Best quote price impact ${(scored.quote.priceImpactPct * 100).toFixed(3)}% exceeds policy max ${policy.maxPriceImpactPct}%.`,
    };
  }
  return { ok: true };
}

/**
 * Convenience: run every validator in order, short-circuiting on the
 * first failure. Returns ok=true only if all passed.
 */
export function runAllValidators(args: {
  intent: ResolvedIntent;
  policy: PolicyPreset;
  usage: PolicyUsage | null;
  best: ScoredQuote | null;
}): ValidationResult {
  const intentCheck = validateIntent(args.intent, args.policy);
  if (!intentCheck.ok) return intentCheck;

  const dailyCheck = validateDailyCap(args.intent, args.policy, args.usage);
  if (!dailyCheck.ok) return dailyCheck;

  if (!args.best) {
    return {
      ok: false,
      code: "no_quotes_available",
      message: "No route source returned a quote.",
    };
  }

  return validateQuote(args.best, args.policy);
}
