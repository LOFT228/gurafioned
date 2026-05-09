import type { FastifyInstance } from "fastify";
import { loadPolicies } from "../modules/policies/registry.js";
import { getUsageForToday } from "../modules/ledger/usage.js";

export async function registerPolicyRoutes(app: FastifyInstance) {
  /**
   * GET /api/policies — returns every policy preset + today's usage.
   * The dashboard's Policies page is driven entirely by this endpoint.
   */
  app.get("/api/policies", async () => {
    const presets = await loadPolicies();
    const withUsage = await Promise.all(
      presets.map(async (p) => ({
        preset: p,
        usage: await getUsageForToday(p.name),
      })),
    );
    return { policies: withUsage };
  });
}
