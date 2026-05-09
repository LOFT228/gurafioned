import type { FastifyInstance } from "fastify";
import { getDecisionDetail, listRecentDecisions } from "../modules/ledger/audit.js";

export async function registerAuditRoutes(app: FastifyInstance) {
  /**
   * GET /api/audit — list recent decisions (most recent first).
   */
  app.get("/api/audit", async (req) => {
    const limitParam = (req.query as Record<string, string | undefined>).limit;
    const limit = limitParam ? Math.min(200, parseInt(limitParam, 10) || 50) : 50;
    const rows = await listRecentDecisions(limit);
    return {
      decisions: rows.map((r) => ({
        id: r.id,
        intentId: r.intentId,
        policyName: r.policyName,
        policyTier: r.policyTier,
        status: r.status,
        rejectionCode: r.rejectionCode,
        rejectionReason: r.rejectionReason,
        chosenSource: r.chosenSource,
        createdAt: r.createdAt,
        intent: r.intent && {
          fromToken: r.intent.fromSymbol,
          toToken: r.intent.toSymbol,
          amount: r.intent.amount,
          usdValue: r.intent.usdValue,
        },
        execution: r.execution && {
          txHash: r.execution.txHash,
          txStatus: r.execution.txStatus,
          receivedAmount: r.execution.receivedAmount,
        },
      })),
    };
  });

  /**
   * GET /api/audit/:id — full decision detail (with reasoning + scored quotes).
   */
  app.get("/api/audit/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const row = await getDecisionDetail(id);
    if (!row) return reply.status(404).send({ error: "not_found" });
    return {
      id: row.id,
      intentId: row.intentId,
      policyName: row.policyName,
      policyTier: row.policyTier,
      status: row.status,
      rejectionCode: row.rejectionCode,
      rejectionReason: row.rejectionReason,
      chosenSource: row.chosenSource,
      scoredQuotes: safeJson(row.scoredQuotes),
      reasoning: safeJson(row.reasoning),
      createdAt: row.createdAt,
      intent: row.intent,
      execution: row.execution,
    };
  });
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
