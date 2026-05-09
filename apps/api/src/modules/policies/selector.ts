import type { PolicyPreset } from "@routeguardian/shared";
import { loadPolicies } from "./registry.js";

/**
 * Picks the active policy for a given USD trade size.
 *
 * Rules:
 *   - The first policy whose `usdRange.min ≤ usdValue` AND
 *     (`usdRange.max === null` OR `usdValue ≤ usdRange.max`) wins.
 *   - Policies are evaluated in tier order: small → medium → large.
 *   - If usdValue exceeds every tier (shouldn't happen, large is uncapped),
 *     the large tier is the safety fallback.
 */
export async function selectPolicyForUsd(usdValue: number): Promise<PolicyPreset> {
  const all = await loadPolicies();
  const ordered = ["small", "medium", "large"] as const;

  for (const tier of ordered) {
    const p = all.find((x) => x.tier === tier);
    if (!p) continue;
    const inRange =
      usdValue >= p.usdRange.min &&
      (p.usdRange.max === null || usdValue <= p.usdRange.max);
    if (inRange) return p;
  }

  // Defensive fallback — should never hit if presets cover [0, ∞).
  const fallback = all.find((p) => p.tier === "large");
  if (!fallback) {
    throw new Error(
      `No policy matches usdValue=${usdValue} and no large-tier fallback is configured.`,
    );
  }
  return fallback;
}
