import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { PolicyPresetSchema, type PolicyPreset } from "@routeguardian/shared";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

/**
 * Loads policy presets from the repo-root /policies directory.
 *
 * Presets are the *single source of truth* — both the client-side validators
 * and the Zerion CLI on-chain policies are derived from these JSON files.
 *
 * Loaded once at startup and cached. Restart the API to pick up edits, or
 * call `reloadPolicies()` from a (future) admin endpoint.
 */

const PRESET_FILES = ["small-trade.json", "medium-trade.json", "large-trade.json"];

let cache: PolicyPreset[] | null = null;

function policiesDir(): string {
  // Resolve relative to this file: apps/api/src/modules/policies/registry.ts
  // -> repo root /policies
  const here = dirname(fileURLToPath(import.meta.url));
  return resolve(here, "..", "..", "..", "..", "..", "policies");
}

export async function loadPolicies(): Promise<PolicyPreset[]> {
  if (cache) return cache;

  const dir = policiesDir();
  const loaded: PolicyPreset[] = [];

  for (const file of PRESET_FILES) {
    const path = join(dir, file);
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw);
    const result = PolicyPresetSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid policy preset ${file}: ${result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`,
      );
    }
    loaded.push(applyDemoOverrides(result.data));
  }

  cache = loaded;
  logger.info("policies.loaded", { count: loaded.length, dir });
  return loaded;
}

export async function reloadPolicies(): Promise<PolicyPreset[]> {
  cache = null;
  return loadPolicies();
}

export async function getPolicyByName(name: string): Promise<PolicyPreset | undefined> {
  const all = await loadPolicies();
  return all.find((p) => p.name === name);
}

export async function getPolicyByTier(
  tier: PolicyPreset["tier"],
): Promise<PolicyPreset | undefined> {
  const all = await loadPolicies();
  return all.find((p) => p.tier === tier);
}

/**
 * Applies env-driven demo overrides — for example,
 * `DEMO_LARGE_TIER_USD_OVERRIDE=20` lowers the large-trade USD threshold to
 * $20 so we can demo the manual-confirmation flow with a small wallet.
 *
 * Production / non-demo runs should leave the override unset.
 */
function applyDemoOverrides(p: PolicyPreset): PolicyPreset {
  if (p.tier === "large" && env.DEMO_LARGE_TIER_USD_OVERRIDE !== undefined) {
    return {
      ...p,
      usdRange: { ...p.usdRange, min: env.DEMO_LARGE_TIER_USD_OVERRIDE },
    };
  }
  if (p.tier === "medium" && env.DEMO_LARGE_TIER_USD_OVERRIDE !== undefined) {
    // Bump medium tier's max down so it doesn't overlap the demo-lowered large tier.
    const newMax = Math.max(0, env.DEMO_LARGE_TIER_USD_OVERRIDE);
    return { ...p, usdRange: { ...p.usdRange, max: newMax } };
  }
  return p;
}
