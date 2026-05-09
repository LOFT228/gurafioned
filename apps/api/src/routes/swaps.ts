import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { executeIntent } from "../modules/agent/orchestrator.js";

const SwapBody = z.object({
  fromToken: z.string().min(1),
  toToken: z.string().min(1),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  source: z.enum(["manual", "scheduler", "api"]).default("manual"),
  label: z.string().max(120).optional(),
});

export async function registerSwapRoutes(app: FastifyInstance) {
  /**
   * POST /api/swaps — run the full agent pipeline and (if approved)
   * execute the swap on-chain via the Zerion CLI.
   */
  app.post("/api/swaps", async (req, reply) => {
    const parsed = SwapBody.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.format() });
    }
    const outcome = await executeIntent({ ...parsed.data, chain: "solana" });
    return outcome;
  });
}
