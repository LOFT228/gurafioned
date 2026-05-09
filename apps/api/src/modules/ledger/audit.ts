import type {
  Decision,
  Execution,
  ResolvedIntent,
  ReasoningStep,
  ScoredQuote,
  ValidationFailureCode,
} from "@routeguardian/shared";
import { prisma } from "../../db/prisma.js";

/**
 * Audit ledger writes. Every public function here returns a fully-typed
 * domain object so the HTTP layer never has to touch raw Prisma rows.
 */

export async function persistIntent(intent: ResolvedIntent): Promise<string> {
  const row = await prisma.swapIntent.create({
    data: {
      fromToken: intent.fromToken,
      toToken: intent.toToken,
      fromMint: intent.fromMint,
      toMint: intent.toMint,
      fromSymbol: intent.fromTokenSymbol,
      toSymbol: intent.toTokenSymbol,
      amount: intent.amount,
      usdValue: intent.usdValue,
      chain: intent.chain,
      source: intent.source,
      label: intent.label,
    },
    select: { id: true },
  });
  return row.id;
}

export interface PersistDecisionInput {
  intentId: string;
  policyName: string;
  policyTier: "small" | "medium" | "large";
  status: Decision["status"];
  rejectionCode?: ValidationFailureCode;
  rejectionReason?: string;
  scoredQuotes: ScoredQuote[];
  chosenSource?: string;
  reasoning: ReasoningStep[];
}

export async function persistDecision(
  input: PersistDecisionInput,
): Promise<string> {
  const row = await prisma.decision.create({
    data: {
      intentId: input.intentId,
      policyName: input.policyName,
      policyTier: input.policyTier,
      status: input.status,
      rejectionCode: input.rejectionCode,
      rejectionReason: input.rejectionReason,
      scoredQuotes: JSON.stringify(input.scoredQuotes),
      chosenSource: input.chosenSource,
      reasoning: JSON.stringify(input.reasoning),
    },
    select: { id: true },
  });
  return row.id;
}

export async function persistExecution(input: {
  decisionId: string;
  agentTokenName: string;
  txHash?: string;
  txStatus: Execution["txStatus"];
  receivedAmount?: string;
  cliStdout?: string;
  cliStderr?: string;
}): Promise<string> {
  const row = await prisma.execution.create({
    data: {
      decisionId: input.decisionId,
      agentTokenName: input.agentTokenName,
      txHash: input.txHash,
      txStatus: input.txStatus,
      receivedAmount: input.receivedAmount,
      cliStdout: input.cliStdout?.slice(0, 50_000),
      cliStderr: input.cliStderr?.slice(0, 50_000),
    },
    select: { id: true },
  });
  return row.id;
}

export async function listRecentDecisions(limit = 50) {
  return prisma.decision.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { intent: true, execution: true },
  });
}

export async function getDecisionDetail(id: string) {
  return prisma.decision.findUnique({
    where: { id },
    include: { intent: true, execution: true },
  });
}
