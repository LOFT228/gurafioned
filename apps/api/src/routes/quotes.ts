import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { compareRoutes } from "../modules/routes/comparator.js";
import { selectPolicyForUsd } from "../modules/policies/selector.js";
import { parseAndResolveIntent } from "../modules/agent/intent.js";

const PreviewBody = z.object({
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export async function registerQuoteRoutes(app: FastifyInstance) {
  /**
   * POST /api/quotes — preview a swap WITHOUT executing.
   *
   * Returns:
   *   - resolved intent (mints + USD value)
   *   - selected policy
   *   - every quote the comparator received (success + failure)
   *   - the winning quote
   *
   * Used by the "New swap" page to render the quote table before the
   * user clicks "Execute".
   */
  app.post("/api/quotes", async (req, reply) => {
    const parsed = PreviewBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }

    const intent = await parseAndResolveIntent({
      ...parsed.data,
      chain: "solana",
      source: "manual",
    });
    const policy = await selectPolicyForUsd(intent.usdValue);
    const amountIn = toBaseUnits(intent.amount, intent.fromTokenDecimals);
    const cmp = await compareRoutes(
      {
        inMint: intent.fromMint,
        outMint: intent.toMint,
        amountIn,
        slippageBps: Math.round(policy.maxSlippagePct * 100),
      },
      policy,
    );

    return {
      intent,
      policy,
      results: cmp.results,
      scored: cmp.scored,
      best: cmp.best,
    };
  });
}

function toBaseUnits(amount: string, decimals: number): string {
  const [whole, frac = ""] = amount.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${whole ?? "0"}${fracPadded}`.replace(/^0+(?=\d)/, "");
  return combined === "" ? "0" : combined;
}
