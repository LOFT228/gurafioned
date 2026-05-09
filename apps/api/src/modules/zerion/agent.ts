import { runZerion } from "./client.js";
import { logger } from "../../lib/logger.js";

/**
 * Helpers for managing agent tokens and policies through the CLI.
 *
 * `use-token` and `list-tokens` / `list-policies` are *agent-safe* —
 * they're read-only / config-only and don't require a passphrase, so
 * the orchestrator can switch between policy tiers autonomously.
 *
 * Anything that *creates*, *deletes*, or *revokes* tokens/policies is
 * intentionally NOT exposed here. Those operations require a human at
 * a terminal (passphrase prompt) and live in scripts/setup-zerion.sh.
 */

export interface AgentTokenInfo {
  name: string;
  wallet: string;
  policies: string[];
  active: boolean;
}

export interface PolicyInfo {
  id: string;
  name: string;
  rules: unknown[];
}

/**
 * Switch the active wallet/agent-token used by subsequent trading
 * commands. Equivalent to `zerion agent use-token --wallet <walletName>`.
 */
export async function useAgentToken(walletName: string): Promise<void> {
  const result = await runZerion<{ wallet: string; switched: boolean }>({
    args: ["agent", "use-token", "--wallet", walletName],
  });
  if (!result.ok) {
    throw new Error(
      `Failed to switch agent token to wallet "${walletName}": ${result.message}`,
    );
  }
  logger.info("zerion.agent.use-token", { wallet: walletName });
}

/**
 * List every saved agent token. Used by the dashboard to show which
 * tokens are bound to which policy.
 */
export async function listAgentTokens(): Promise<AgentTokenInfo[]> {
  const result = await runZerion<{ tokens: AgentTokenInfo[] }>({
    args: ["agent", "list-tokens"],
  });
  if (!result.ok) {
    throw new Error(`Failed to list agent tokens: ${result.message}`);
  }
  return result.data.tokens ?? [];
}

/**
 * List every saved policy. Used by the dashboard to show what's
 * currently configured on the Zerion side.
 */
export async function listPolicies(): Promise<PolicyInfo[]> {
  const result = await runZerion<{ policies: PolicyInfo[] }>({
    args: ["agent", "list-policies"],
  });
  if (!result.ok) {
    throw new Error(`Failed to list policies: ${result.message}`);
  }
  return result.data.policies ?? [];
}
